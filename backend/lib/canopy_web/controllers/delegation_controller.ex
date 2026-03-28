defmodule CanopyWeb.DelegationController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.Issue
  alias Canopy.Dispatch.{Delegation, Router}

  @doc """
  POST /api/v1/delegations

  Create a subtask delegated from a parent issue with automatic adapter routing.

  Body params:
    - `parent_task_id` (required) — UUID of the parent issue
    - `description`    (required) — text description of the delegated work
    - `adapter`        (optional) — explicit adapter type (overrides inference)
    - `agent_id`       (optional) — assign to a specific agent UUID
    - `priority`       (optional) — "low" | "medium" | "high" | "critical"
  """
  def create(conn, %{"parent_task_id" => parent_id, "description" => description} = params) do
    case Repo.get(Issue, parent_id) do
      nil ->
        conn
        |> put_status(404)
        |> json(%{error: "parent issue not found", parent_task_id: parent_id})

      parent ->
        opts =
          []
          |> maybe_opt(:adapter, params["adapter"])
          |> maybe_opt(:agent_id, params["agent_id"])
          |> maybe_opt(:priority, params["priority"])

        case Delegation.delegate(parent, description, opts) do
          {:ok, issue} ->
            issue = Repo.preload(issue, [:labels, :assignee])

            conn
            |> put_status(201)
            |> json(%{
              issue: serialize_issue(issue),
              resolved_adapter: issue.adapter_override || "agent_default"
            })

          {:error, changeset} ->
            errors =
              Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)

            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: errors})
        end
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(422)
    |> json(%{error: "missing required fields: parent_task_id, description"})
  end

  @doc """
  GET /api/v1/dispatch/routes

  Returns the current routing rules table for UI display. No side effects.
  """
  def routes(conn, _params) do
    json(conn, %{rules: Router.routing_rules()})
  end

  @doc """
  POST /api/v1/dispatch/preview

  Dry-run: given a task description, return which adapter would be selected
  without creating anything. Useful for UI previews before delegation.

  Body params:
    - `description` (required) — the task description to analyze
    - `agent_id`    (optional) — agent UUID to use as fallback default
  """
  def preview(conn, %{"description" => description} = params) do
    adapter_type =
      case params["agent_id"] do
        nil ->
          # No agent: just run content analysis, no fallback
          Router.infer_adapter_type(description) || "osa"

        agent_id ->
          case Repo.get(Canopy.Schemas.Agent, agent_id) do
            nil ->
              Router.infer_adapter_type(description) || "osa"

            agent ->
              stub = %{title: description, description: description, labels: [], adapter_override: nil}

              case Router.resolve(stub, agent) do
                {:ok, mod} -> mod.type()
                {:error, _} -> agent.adapter
              end
          end
      end

    {:ok, adapter_mod} = Canopy.Adapter.resolve(adapter_type)

    json(conn, %{
      description: description,
      resolved_adapter: adapter_type,
      adapter_name: adapter_mod.name(),
      routing_source: routing_source(description, adapter_type, params["agent_id"])
    })
  end

  def preview(conn, _params) do
    conn
    |> put_status(422)
    |> json(%{error: "missing required field: description"})
  end

  # ── Private ──────────────────────────────────────────────────────────────────

  defp routing_source(description, _adapter_type, agent_id) do
    content = String.downcase(description)

    cond do
      content =~ ~r/(screenshot|image|visual|diagram|ui review)/ -> "content:multimodal"
      content =~ ~r/(refactor \d+ files|bulk|mass update|find and replace across)/ -> "content:bulk"
      content =~ ~r/(run tests|deploy|docker|kubectl|terraform|ansible|script)/ -> "content:shell"
      content =~ ~r/(check endpoint|api status|webhook|curl|health check|ping)/ -> "content:http"
      content =~ ~r/(design|architect|spec|complex|analyze|review|strategy)/ -> "content:reasoning"
      not is_nil(agent_id) -> "agent_default"
      true -> "system_default"
    end
  end

  defp serialize_issue(issue) do
    %{
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      adapter_override: issue.adapter_override,
      delegation_chain: issue.delegation_chain,
      workspace_id: issue.workspace_id,
      assignee_id: issue.assignee_id,
      inserted_at: issue.inserted_at,
      updated_at: issue.updated_at
    }
  end

  defp maybe_opt(opts, _key, nil), do: opts
  defp maybe_opt(opts, _key, ""), do: opts
  defp maybe_opt(opts, key, value), do: Keyword.put(opts, key, value)
end
