defmodule Canopy.Governance.Executor do
  @moduledoc """
  Replays actions that were pending approval once they are approved.

  When an approval has `auto_execute: true` and is transitioned to "approved"
  status, `execute_approved/1` is called to replay the originally-requested
  action using the stored `action_params`.

  This keeps the approval/execution contract clean:
    - Gate creates the approval record with the original params.
    - Executor replays those params as if the original request succeeded.
  """

  require Logger

  alias Canopy.Schemas.{Agent, Session}
  alias Canopy.Repo

  @doc """
  Execute the action that was pending approval.

  Called by ApprovalController after a successful approve transition when
  `approval.auto_execute == true`.
  """
  def execute_approved(%{action_type: action_type, action_params: params} = approval)
      when is_map(params) do
    Logger.info(
      "[Governance.Executor] Auto-executing approved action: #{action_type} (approval #{approval.id})"
    )

    case action_type do
      "spawn_agent" ->
        replay_spawn(params, approval)

      "budget_override" ->
        replay_budget_override(params, approval)

      "delete_agent" ->
        replay_delete_agent(params, approval)

      other ->
        Logger.info("[Governance.Executor] No auto-execute handler for action type: #{other}")
        {:ok, :no_auto_execute}
    end
  end

  def execute_approved(approval) do
    Logger.warning(
      "[Governance.Executor] execute_approved called with missing action_params on approval #{approval.id}"
    )

    {:ok, :no_auto_execute}
  end

  # --- Private replay handlers ---

  defp replay_spawn(params, _approval) do
    agent_id = params["agent_id"]
    context = params["context"] || params["prompt"] || ""

    case Repo.get(Agent, agent_id) do
      nil ->
        Logger.error("[Governance.Executor] Spawn replay: agent #{agent_id} not found")
        {:error, :agent_not_found}

      agent ->
        session_params = %{
          "agent_id" => agent_id,
          "workspace_id" => agent.workspace_id,
          "model" => params["model"] || agent.model,
          "started_at" => DateTime.utc_now() |> DateTime.truncate(:second),
          "context" => context,
          "status" => "active"
        }

        changeset = Session.changeset(%Session{}, session_params)

        case Repo.insert(changeset) do
          {:ok, session} ->
            Task.Supervisor.start_child(Canopy.HeartbeatRunner, fn ->
              Canopy.Heartbeat.run(agent_id, context: context, session_id: session.id)
            end)

            Logger.info(
              "[Governance.Executor] Spawn replayed: session #{session.id} for agent #{agent_id}"
            )

            {:ok, %{session_id: session.id}}

          {:error, changeset} ->
            Logger.error(
              "[Governance.Executor] Spawn replay failed: #{inspect(changeset.errors)}"
            )

            {:error, changeset}
        end
    end
  end

  defp replay_budget_override(params, approval) do
    Logger.info(
      "[Governance.Executor] Budget override replayed for approval #{approval.id}: #{inspect(params)}"
    )

    # Budget override replay is domain-specific — signal the budget enforcer
    # that this override has been approved. Implementation depends on the
    # BudgetEnforcer API surface; for now we log and return :ok so the
    # approval workflow completes cleanly.
    {:ok, :budget_override_approved}
  end

  defp replay_delete_agent(params, approval) do
    agent_id = params["agent_id"] || params["id"]

    case agent_id && Repo.get(Agent, agent_id) do
      nil ->
        Logger.warning(
          "[Governance.Executor] Delete replay: agent #{agent_id} not found (may already be deleted)"
        )

        {:ok, :already_deleted}

      agent ->
        Repo.delete!(agent)

        Logger.info(
          "[Governance.Executor] Delete replayed: agent #{agent_id} deleted after approval #{approval.id}"
        )

        Canopy.EventBus.broadcast(
          Canopy.EventBus.workspace_topic(agent.workspace_id),
          %{event: "agent.terminated", agent_id: agent.id}
        )

        {:ok, %{deleted_agent_id: agent_id}}
    end
  end
end
