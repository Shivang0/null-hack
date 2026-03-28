defmodule CanopyWeb.SidebarBadgeController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{ActivityEvent, Approval, Issue, Agent, Session}
  import Ecto.Query

  def show(conn, params) do
    workspace_id = params["workspace_id"]

    inbox_unread = count_inbox_unread(workspace_id)
    pending_approvals = count_pending_approvals(workspace_id)
    open_issues = count_open_issues(workspace_id)
    active_agents = count_active_agents(workspace_id)
    active_sessions = count_active_sessions(workspace_id)

    json(conn, %{
      inbox_unread: inbox_unread,
      pending_approvals: pending_approvals,
      open_issues: open_issues,
      active_agents: active_agents,
      active_sessions: active_sessions
    })
  end

  # --- Private helpers ---

  defp count_inbox_unread(workspace_id) do
    query =
      from e in ActivityEvent,
        where: e.level == "notification",
        where: fragment("COALESCE((?->>'read')::boolean, false) = false", e.metadata)

    query =
      if workspace_id,
        do: where(query, [e], e.workspace_id == ^workspace_id),
        else: query

    Repo.aggregate(query, :count)
  end

  defp count_pending_approvals(workspace_id) do
    query = from a in Approval, where: a.status == "pending"

    query =
      if workspace_id,
        do: where(query, [a], a.workspace_id == ^workspace_id),
        else: query

    Repo.aggregate(query, :count)
  end

  defp count_open_issues(workspace_id) do
    query = from i in Issue, where: i.status not in ["done", "cancelled", "closed"]

    query =
      if workspace_id,
        do: where(query, [i], i.workspace_id == ^workspace_id),
        else: query

    Repo.aggregate(query, :count)
  end

  defp count_active_agents(workspace_id) do
    query = from a in Agent, where: a.status in ["active", "working"]

    query =
      if workspace_id,
        do: where(query, [a], a.workspace_id == ^workspace_id),
        else: query

    Repo.aggregate(query, :count)
  end

  defp count_active_sessions(workspace_id) do
    query = from s in Session, where: s.status == "active"

    query =
      if workspace_id,
        do: where(query, [s], s.workspace_id == ^workspace_id),
        else: query

    Repo.aggregate(query, :count)
  end
end
