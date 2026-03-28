defmodule Canopy.Notifications.Dispatcher do
  @moduledoc "Creates notifications and broadcasts them via EventBus for real-time delivery."

  alias Canopy.Repo
  alias Canopy.Schemas.Notification

  @doc "Create and broadcast a single notification. Returns {:ok, notification} | {:error, changeset}."
  def notify(attrs) do
    %Notification{}
    |> Notification.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, notification} ->
        broadcast(notification)
        {:ok, notification}

      error ->
        error
    end
  end

  @doc "Notify that an agent completed a task."
  def notify_agent_task_complete(agent, task_summary, workspace_id) do
    notify(%{
      workspace_id: workspace_id,
      recipient_type: "broadcast",
      sender_type: "agent",
      sender_id: agent.id,
      category: "task",
      severity: "info",
      title: "Task complete: #{agent.name}",
      body: task_summary,
      action_label: "View Task"
    })
  end

  @doc "Notify that a human approval is required."
  def notify_approval_required(approval, workspace_id) do
    notify(%{
      workspace_id: workspace_id,
      recipient_type: "broadcast",
      sender_type: "system",
      category: "approval",
      severity: "warning",
      title: "Approval required: #{approval.title}",
      body: approval.description,
      action_url: "/approvals/#{approval.id}",
      action_label: "Review",
      metadata: %{approval_id: approval.id}
    })
  end

  @doc "Notify that an agent is approaching or has exceeded a budget threshold."
  def notify_budget_warning(agent, budget_info, workspace_id) do
    severity = if budget_info[:exceeded], do: "error", else: "warning"

    notify(%{
      workspace_id: workspace_id,
      recipient_type: "broadcast",
      sender_type: "system",
      category: "budget",
      severity: severity,
      title:
        "Budget #{if budget_info[:exceeded], do: "exceeded", else: "warning"}: #{agent.name}",
      body: budget_info[:message],
      action_url: "/budgets",
      action_label: "View Budget",
      metadata: budget_info
    })
  end

  @doc "Notify about a workflow run status change."
  def notify_workflow_status(workflow_run, status, workspace_id) do
    severity = if status in ["failed", "error"], do: "error", else: "info"

    notify(%{
      workspace_id: workspace_id,
      recipient_type: "broadcast",
      sender_type: "workflow",
      category: "workflow",
      severity: severity,
      title: "Workflow #{status}",
      body: "Run #{workflow_run.id} #{status}",
      action_url: "/workflows/#{workflow_run.workflow_id}",
      action_label: "View Workflow",
      metadata: %{workflow_run_id: workflow_run.id, status: status}
    })
  end

  @doc "Broadcast a system-level alert to all users in a workspace."
  def notify_system_alert(title, body, severity, workspace_id) do
    notify(%{
      workspace_id: workspace_id,
      recipient_type: "broadcast",
      sender_type: "system",
      category: "system",
      severity: severity,
      title: title,
      body: body
    })
  end

  # --- Private ---

  defp broadcast(notification) do
    if notification.workspace_id do
      Canopy.EventBus.broadcast(
        "notifications:#{notification.workspace_id}",
        %{event: "notification.created", data: serialize(notification)}
      )
    end
  end

  defp serialize(%Notification{} = n) do
    %{
      id: n.id,
      workspace_id: n.workspace_id,
      recipient_type: n.recipient_type,
      recipient_id: n.recipient_id,
      sender_type: n.sender_type,
      sender_id: n.sender_id,
      category: n.category,
      severity: n.severity,
      title: n.title,
      body: n.body,
      action_url: n.action_url,
      action_label: n.action_label,
      metadata: n.metadata,
      read_at: n.read_at,
      dismissed_at: n.dismissed_at,
      expires_at: n.expires_at,
      inserted_at: n.inserted_at
    }
  end
end
