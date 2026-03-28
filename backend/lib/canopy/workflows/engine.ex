defmodule Canopy.Workflows.Engine do
  @moduledoc """
  Workflow execution engine.

  Each `start_run/2` call spawns a dedicated Task under `Canopy.TaskSupervisor`
  to execute the run asynchronously.  The calling process receives the run record
  immediately and the execution happens in the background.

  Execution model:
    1. Load workflow + steps from DB.
    2. Create a `workflow_runs` row (status: "running").
    3. Topologically sort steps by `depends_on`.
    4. Detect circular dependencies — abort with error if found.
    5. Execute steps in order.  Each step receives the accumulated context
       (all previous step results merged with the original input).
    6. Persist step results atomically via `Ecto.Multi`.
    7. Honour `on_failure` per step: "stop" | "skip" | "retry" | "fallback".
    8. Retry up to `retry_count` times (capped at 3) with exponential back-off.
    9. Approval steps pause the run — execution resumes when `resume_run/2` is called.
   10. Broadcast PubSub events at every state transition.
  """

  require Logger

  alias Canopy.Repo
  alias Canopy.Schemas.{Workflow, WorkflowStep, WorkflowRun}
  alias Canopy.EventBus
  alias Ecto.Multi
  import Ecto.Query

  @max_retry_attempts 3
  @base_backoff_ms 1_000

  # ── Public API ────────────────────────────────────────────────────────────────

  @doc """
  Load the workflow, create a run record, and start execution asynchronously.

  Returns `{:ok, run}` immediately.  The run will be executed in the background.
  """
  def start_run(workflow_id, params \\ %{}) do
    with %Workflow{} = workflow <- load_workflow(workflow_id),
         {:ok, run} <- create_run(workflow, params) do
      Task.Supervisor.start_child(Canopy.TaskSupervisor, fn ->
        execute_run(run.id, workflow, params)
      end)

      {:ok, run}
    else
      nil -> {:error, :workflow_not_found}
      {:error, _} = err -> err
    end
  end

  @doc """
  Pause a running workflow run (used internally for approval steps).
  """
  def pause_run(run_id) do
    case Repo.get(WorkflowRun, run_id) do
      nil ->
        {:error, :not_found}

      %WorkflowRun{status: "running"} = run ->
        {:ok, updated} =
          run
          |> WorkflowRun.changeset(%{status: "paused"})
          |> Repo.update()

        broadcast_run_event(updated, "workflow_run.paused", %{})
        {:ok, updated}

      %WorkflowRun{status: status} ->
        {:error, {:invalid_transition, status}}
    end
  end

  @doc """
  Resume a paused workflow run from where it stopped.

  `resume_params` can carry approval decision data (e.g., `%{"approved" => true}`).
  """
  def resume_run(run_id, resume_params \\ %{}) do
    case Repo.get(WorkflowRun, run_id) do
      nil ->
        {:error, :not_found}

      %WorkflowRun{status: "paused"} = run ->
        run = Repo.preload(run, workflow: [:steps])

        {:ok, updated} =
          run
          |> WorkflowRun.changeset(%{status: "running"})
          |> Repo.update()

        broadcast_run_event(updated, "workflow_run.resumed", %{})

        Task.Supervisor.start_child(Canopy.TaskSupervisor, fn ->
          execute_run(run_id, run.workflow, resume_params, run.step_results)
        end)

        {:ok, updated}

      %WorkflowRun{status: status} ->
        {:error, {:invalid_transition, status}}
    end
  end

  @doc """
  Cancel a running or paused workflow run.
  """
  def cancel_run(run_id) do
    case Repo.get(WorkflowRun, run_id) do
      nil ->
        {:error, :not_found}

      %WorkflowRun{status: status} = run when status in ["running", "paused", "pending"] ->
        now = DateTime.utc_now()

        {:ok, updated} =
          run
          |> WorkflowRun.changeset(%{
            status: "cancelled",
            completed_at: now,
            error: "Cancelled by user"
          })
          |> Repo.update()

        broadcast_run_event(updated, "workflow_run.cancelled", %{})
        {:ok, updated}

      %WorkflowRun{status: status} ->
        {:error, {:invalid_transition, status}}
    end
  end

  # ── Private — Execution ───────────────────────────────────────────────────────

  defp execute_run(run_id, workflow, _params, prior_results \\ %{}) do
    run = Repo.get!(WorkflowRun, run_id)

    steps =
      Repo.all(
        from s in WorkflowStep,
          where: s.workflow_id == ^workflow.id,
          order_by: [asc: s.position],
          preload: [:agent]
      )

    case topological_sort(steps) do
      {:error, :circular_dependency} ->
        fail_run!(run, "Circular dependency detected in workflow steps")

      {:ok, sorted_steps} ->
        # Skip steps that have already completed (resume case)
        remaining_steps =
          Enum.reject(sorted_steps, fn step ->
            Map.has_key?(prior_results, step.id) &&
              get_in(prior_results, [step.id, "status"]) == "completed"
          end)

        context = Map.merge(run.input, %{"_step_results" => prior_results})

        run_steps(run, remaining_steps, context)
    end
  end

  defp run_steps(run, [], context) do
    # All steps completed
    output = Map.get(context, "_step_results", %{})
    now = DateTime.utc_now()

    {:ok, completed_run} =
      run
      |> WorkflowRun.changeset(%{
        status: "completed",
        completed_at: now,
        output: output
      })
      |> Repo.update()

    broadcast_run_event(completed_run, "workflow_run.completed", %{output: output})
    Logger.info("[Workflows.Engine] Run #{run.id} completed successfully")
  end

  defp run_steps(run, [step | rest], context) do
    # Re-check run status in case it was cancelled externally
    current_run = Repo.get!(WorkflowRun, run.id)

    case current_run.status do
      "cancelled" ->
        Logger.info("[Workflows.Engine] Run #{run.id} was cancelled — stopping execution")

      _running ->
        broadcast_step_event(run, step, "workflow_step.started", %{})
        Logger.debug("[Workflows.Engine] Executing step #{step.name} (#{step.step_type})")

        case execute_step_with_retry(step, context, run) do
          {:ok, result} ->
            new_context = put_step_result(context, step.id, result)
            persist_step_result(run, step.id, result)
            broadcast_step_event(run, step, "workflow_step.completed", %{result: result})
            run_steps(run, rest, new_context)

          {:paused, _approval_id} ->
            # Approval step paused the run — execution halts here
            Logger.info(
              "[Workflows.Engine] Run #{run.id} paused waiting for approval at step #{step.name}"
            )

          {:error, reason} ->
            handle_step_failure(run, step, rest, context, reason)
        end
    end
  end

  defp execute_step_with_retry(step, context, run) do
    max_attempts = min(step.retry_count + 1, @max_retry_attempts + 1)
    do_retry(step, context, run, max_attempts, 0)
  end

  defp do_retry(step, context, run, max_attempts, attempt) when attempt < max_attempts do
    case execute_step(step, context, run) do
      {:ok, _} = ok ->
        ok

      {:paused, _} = paused ->
        paused

      {:error, reason} when attempt + 1 < max_attempts ->
        backoff = (@base_backoff_ms * :math.pow(2, attempt)) |> round()

        Logger.warning(
          "[Workflows.Engine] Step #{step.name} failed (attempt #{attempt + 1}/#{max_attempts}): #{inspect(reason)} — retrying in #{backoff}ms"
        )

        Process.sleep(backoff)
        do_retry(step, context, run, max_attempts, attempt + 1)

      {:error, _} = err ->
        err
    end
  end

  defp do_retry(_step, _context, _run, max_attempts, attempt) when attempt >= max_attempts do
    {:error, :max_retries_exceeded}
  end

  defp handle_step_failure(run, step, rest, context, reason) do
    error_msg = inspect(reason)
    broadcast_step_event(run, step, "workflow_step.failed", %{error: error_msg})
    persist_step_result(run, step.id, %{"status" => "failed", "error" => error_msg})

    case step.on_failure do
      "stop" ->
        fail_run!(run, "Step '#{step.name}' failed: #{error_msg}")

      "skip" ->
        Logger.info("[Workflows.Engine] Step #{step.name} failed — on_failure=skip, continuing")

        skipped_result = %{"status" => "skipped", "error" => error_msg}
        new_context = put_step_result(context, step.id, skipped_result)
        run_steps(run, rest, new_context)

      "retry" ->
        # Retry is handled inside execute_step_with_retry.
        # If we reach here, retries are exhausted — treat as stop.
        fail_run!(run, "Step '#{step.name}' failed after retries: #{error_msg}")

      "fallback" ->
        Logger.info(
          "[Workflows.Engine] Step #{step.name} failed — on_failure=fallback, skipping remaining"
        )

        # Skip this step and all subsequent dependent steps; continue with independents.
        failed_id = step.id
        independent_rest = Enum.reject(rest, &depends_on?(&1, failed_id))

        fallback_result = %{"status" => "fallback", "error" => error_msg}
        new_context = put_step_result(context, step.id, fallback_result)
        run_steps(run, independent_rest, new_context)

      _ ->
        fail_run!(run, "Step '#{step.name}' failed: #{error_msg}")
    end
  end

  # ── Step Executors ────────────────────────────────────────────────────────────

  defp execute_step(%WorkflowStep{step_type: "agent_task"} = step, context, _run) do
    agent_id = step.agent_id || step.config["agent_id"]

    case agent_id do
      nil ->
        {:error, :no_agent_configured}

      agent_id ->
        task_context =
          step.config["context"] ||
            Jason.encode!(context) |> then(&"Execute task with context: #{&1}")

        case Canopy.Heartbeat.run(agent_id,
               context: task_context,
               schedule_id: nil
             ) do
          {:ok, session_id} ->
            {:ok, %{"status" => "completed", "session_id" => session_id}}

          {:error, reason} ->
            {:error, reason}
        end
    end
  end

  defp execute_step(%WorkflowStep{step_type: "api_call"} = step, context, _run) do
    url = step.config["url"]
    method = step.config["method"] || "GET"
    headers = step.config["headers"] || %{}
    body = resolve_template(step.config["body"], context)
    timeout = step.timeout_seconds * 1_000

    if is_nil(url) do
      {:error, :no_url_configured}
    else
      method_atom = method |> String.downcase() |> String.to_existing_atom()

      req =
        Req.new(
          url: url,
          headers: headers,
          receive_timeout: timeout
        )

      result =
        case method_atom do
          :get -> Req.get(req)
          :post -> Req.post(req, json: body)
          :put -> Req.put(req, json: body)
          :patch -> Req.patch(req, json: body)
          :delete -> Req.delete(req)
          _ -> {:error, {:unsupported_method, method}}
        end

      case result do
        {:ok, %{status: status, body: resp_body}} when status in 200..299 ->
          {:ok, %{"status" => "completed", "http_status" => status, "body" => resp_body}}

        {:ok, %{status: status, body: resp_body}} ->
          {:error, {:http_error, status, resp_body}}

        {:error, reason} ->
          {:error, {:request_failed, reason}}
      end
    end
  end

  defp execute_step(%WorkflowStep{step_type: "condition"} = step, context, _run) do
    condition = step.config["condition"]

    result =
      case evaluate_condition(condition, context) do
        true -> %{"status" => "completed", "result" => true, "branch" => "true"}
        false -> %{"status" => "completed", "result" => false, "branch" => "false"}
        {:error, reason} -> %{"status" => "error", "error" => inspect(reason)}
      end

    {:ok, result}
  end

  defp execute_step(%WorkflowStep{step_type: "transform"} = step, context, _run) do
    transform_spec = step.config["transform"]

    case apply_transform(transform_spec, context) do
      {:ok, transformed} ->
        {:ok, %{"status" => "completed", "output" => transformed}}

      {:error, reason} ->
        {:error, {:transform_failed, reason}}
    end
  end

  defp execute_step(%WorkflowStep{step_type: "webhook"} = step, context, _run) do
    # Webhook step is an outbound HTTP call — alias for api_call with fixed POST
    url = step.config["url"]

    if is_nil(url) do
      {:error, :no_webhook_url}
    else
      payload =
        step.config["payload"] ||
          %{"step" => step.name, "context" => Map.drop(context, ["_step_results"])}

      resolved_payload = resolve_template(payload, context)

      case Req.post(url,
             json: resolved_payload,
             receive_timeout: step.timeout_seconds * 1_000
           ) do
        {:ok, %{status: status}} when status in 200..299 ->
          {:ok, %{"status" => "completed", "http_status" => status}}

        {:ok, %{status: status, body: body}} ->
          {:error, {:webhook_failed, status, body}}

        {:error, reason} ->
          {:error, {:webhook_error, reason}}
      end
    end
  end

  defp execute_step(%WorkflowStep{step_type: "delay"} = step, _context, _run) do
    delay_seconds = step.config["seconds"] || 5
    Process.sleep(delay_seconds * 1_000)
    {:ok, %{"status" => "completed", "delayed_seconds" => delay_seconds}}
  end

  defp execute_step(%WorkflowStep{step_type: "notification"} = step, context, _run) do
    # Broadcast a notification event and continue immediately.
    channel = step.config["channel"] || "workflow"
    message = resolve_template(step.config["message"] || "Workflow notification", context)

    EventBus.broadcast("notifications:global", %{
      event: "workflow.notification",
      channel: channel,
      message: message,
      step_name: step.name
    })

    {:ok, %{"status" => "completed", "channel" => channel, "message" => message}}
  end

  defp execute_step(%WorkflowStep{step_type: "approval"} = step, _context, run) do
    # Pause the run and record that we're waiting for approval.
    # The run will be resumed externally via Engine.resume_run/2.
    approval_id = Ecto.UUID.generate()

    EventBus.broadcast("workflow:#{run.workflow_id}", %{
      event: "workflow.approval_required",
      run_id: run.id,
      step_id: step.id,
      step_name: step.name,
      approval_id: approval_id,
      prompt: step.config["prompt"] || "Please approve this workflow step to continue."
    })

    # Pause the run synchronously before returning so the caller can halt.
    pause_run(run.id)

    {:paused, approval_id}
  end

  defp execute_step(%WorkflowStep{step_type: unknown}, _context, _run) do
    {:error, {:unknown_step_type, unknown}}
  end

  # ── Condition Evaluator ───────────────────────────────────────────────────────

  # Supported condition formats:
  #   %{"field" => "path.to.field", "op" => "eq", "value" => "expected"}
  #   %{"field" => "_step_results.step_id.output", "op" => "gt", "value" => 0}
  defp evaluate_condition(nil, _context), do: true

  defp evaluate_condition(%{"field" => field, "op" => op, "value" => expected}, context) do
    actual = get_nested(context, String.split(field, "."))

    case op do
      "eq" -> actual == expected
      "neq" -> actual != expected
      "gt" -> compare_numbers(actual, expected, &(&1 > &2))
      "gte" -> compare_numbers(actual, expected, &(&1 >= &2))
      "lt" -> compare_numbers(actual, expected, &(&1 < &2))
      "lte" -> compare_numbers(actual, expected, &(&1 <= &2))
      "contains" -> is_binary(actual) && String.contains?(actual, to_string(expected))
      "present" -> not is_nil(actual)
      "absent" -> is_nil(actual)
      _ -> {:error, {:unknown_op, op}}
    end
  end

  defp evaluate_condition(_, _), do: true

  defp compare_numbers(a, b, fun) when is_number(a) and is_number(b), do: fun.(a, b)
  defp compare_numbers(_, _, _), do: false

  # ── Transform Engine ──────────────────────────────────────────────────────────

  # Supported transform_spec formats:
  #   %{"type" => "pick", "fields" => ["a", "b"]}
  #   %{"type" => "merge", "data" => %{"key" => "value"}}
  #   %{"type" => "map_field", "from" => "old_key", "to" => "new_key"}
  defp apply_transform(nil, context), do: {:ok, context}

  defp apply_transform(%{"type" => "pick", "fields" => fields}, context) do
    picked = Map.take(context, fields)
    {:ok, picked}
  end

  defp apply_transform(%{"type" => "merge", "data" => extra}, context) do
    {:ok, Map.merge(context, extra)}
  end

  defp apply_transform(%{"type" => "map_field", "from" => from, "to" => to}, context) do
    case Map.fetch(context, from) do
      {:ok, value} ->
        {:ok, context |> Map.delete(from) |> Map.put(to, value)}

      :error ->
        {:ok, context}
    end
  end

  defp apply_transform(%{"type" => unknown}, _context) do
    {:error, {:unknown_transform_type, unknown}}
  end

  defp apply_transform(_, context), do: {:ok, context}

  # ── Topological Sort (Kahn's algorithm) ──────────────────────────────────────

  defp topological_sort(steps) do
    # Build adjacency: step_id -> [ids that depend on it]
    id_map = Map.new(steps, &{&1.id, &1})

    in_degree =
      Map.new(steps, fn step ->
        valid_deps = Enum.filter(step.depends_on, &Map.has_key?(id_map, &1))
        {step.id, length(valid_deps)}
      end)

    # Map each step to which other steps it unblocks
    unblocks =
      Enum.reduce(steps, %{}, fn step, acc ->
        valid_deps = Enum.filter(step.depends_on, &Map.has_key?(id_map, &1))

        Enum.reduce(valid_deps, acc, fn dep_id, inner_acc ->
          Map.update(inner_acc, dep_id, [step.id], &[step.id | &1])
        end)
      end)

    queue = steps |> Enum.filter(&(Map.get(in_degree, &1.id) == 0)) |> Enum.map(& &1.id)

    kahn(queue, in_degree, unblocks, id_map, [])
  end

  defp kahn([], in_degree, _unblocks, _id_map, sorted) do
    if Enum.any?(in_degree, fn {_, v} -> v > 0 end) do
      {:error, :circular_dependency}
    else
      {:ok, Enum.reverse(sorted)}
    end
  end

  defp kahn([step_id | queue], in_degree, unblocks, id_map, sorted) do
    step = Map.fetch!(id_map, step_id)
    unblocked = Map.get(unblocks, step_id, [])

    {new_in_degree, newly_free} =
      Enum.reduce(unblocked, {in_degree, []}, fn id, {deg, free} ->
        new_deg = Map.update!(deg, id, &(&1 - 1))
        free = if Map.get(new_deg, id) == 0, do: [id | free], else: free
        {new_deg, free}
      end)

    kahn(
      queue ++ newly_free,
      Map.delete(new_in_degree, step_id),
      unblocks,
      id_map,
      [step | sorted]
    )
  end

  # ── DB Helpers ────────────────────────────────────────────────────────────────

  defp load_workflow(workflow_id) do
    Repo.get(Workflow, workflow_id)
  end

  defp create_run(%Workflow{} = workflow, params) do
    now = DateTime.utc_now()

    attrs = %{
      workflow_id: workflow.id,
      status: "running",
      trigger_event: params["trigger_event"] || "manual",
      input: params["input"] || %{},
      started_at: now,
      step_results: %{}
    }

    %WorkflowRun{}
    |> WorkflowRun.changeset(attrs)
    |> Repo.insert()
  end

  defp persist_step_result(run, step_id, result) do
    run = Repo.get!(WorkflowRun, run.id)
    updated_results = Map.put(run.step_results, step_id, result)

    Multi.new()
    |> Multi.update(
      :run,
      WorkflowRun.changeset(run, %{step_results: updated_results})
    )
    |> Repo.transaction()
    |> case do
      {:ok, _} ->
        :ok

      {:error, _op, changeset, _} ->
        Logger.error(
          "[Workflows.Engine] Failed to persist step result: #{inspect(changeset.errors)}"
        )
    end
  end

  defp fail_run!(run, error_msg) do
    now = DateTime.utc_now()

    {:ok, updated} =
      run
      |> WorkflowRun.changeset(%{
        status: "failed",
        completed_at: now,
        error: error_msg
      })
      |> Repo.update()

    broadcast_run_event(updated, "workflow_run.failed", %{error: error_msg})

    Logger.error("[Workflows.Engine] Run #{run.id} failed: #{error_msg}")
  end

  # ── Event Broadcasting ────────────────────────────────────────────────────────

  defp broadcast_run_event(run, event_type, extra) do
    payload =
      Map.merge(
        %{
          event: event_type,
          run_id: run.id,
          workflow_id: run.workflow_id,
          status: run.status
        },
        extra
      )

    EventBus.broadcast("workflow:#{run.workflow_id}", payload)
    EventBus.broadcast("workflow_run:#{run.id}", payload)
  end

  defp broadcast_step_event(run, step, event_type, extra) do
    payload =
      Map.merge(
        %{
          event: event_type,
          run_id: run.id,
          workflow_id: run.workflow_id,
          step_id: step.id,
          step_name: step.name,
          step_type: step.step_type
        },
        extra
      )

    EventBus.broadcast("workflow:#{run.workflow_id}", payload)
    EventBus.broadcast("workflow_run:#{run.id}", payload)
  end

  # ── Utilities ─────────────────────────────────────────────────────────────────

  defp put_step_result(context, step_id, result) do
    step_results = Map.get(context, "_step_results", %{})
    Map.put(context, "_step_results", Map.put(step_results, step_id, result))
  end

  defp depends_on?(%WorkflowStep{depends_on: deps}, failed_id) when is_list(deps) do
    failed_id in deps
  end

  defp depends_on?(_, _), do: false

  # Resolve a simple template: replace {{field}} references with values from context.
  defp resolve_template(nil, _context), do: nil

  defp resolve_template(template, context) when is_binary(template) do
    Regex.replace(~r/\{\{([^}]+)\}\}/, template, fn _, key ->
      keys = String.split(String.trim(key), ".")
      get_nested(context, keys) |> to_string()
    end)
  end

  defp resolve_template(template, context) when is_map(template) do
    Map.new(template, fn {k, v} -> {k, resolve_template(v, context)} end)
  end

  defp resolve_template(template, _context), do: template

  defp get_nested(map, []) when is_map(map), do: map
  defp get_nested(nil, _), do: nil
  defp get_nested(map, [key | rest]) when is_map(map), do: get_nested(Map.get(map, key), rest)
  defp get_nested(_, _), do: nil
end
