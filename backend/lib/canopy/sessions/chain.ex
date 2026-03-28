defmodule Canopy.Sessions.Chain do
  @moduledoc """
  Manages session chains — linked sequences of sessions across heartbeats.

  When an agent's context grows beyond a threshold, the current session is
  compacted and a new session is created as a continuation. The chain tracks
  this lineage via parent_session_id and sequence_number.

  Sessions in a chain form a singly-linked list:
    Session 1 (sequence_number: 1) → Session 2 (parent: 1) → Session 3 (parent: 2)
  """
  require Logger

  alias Canopy.Repo
  alias Canopy.Schemas.Session
  import Ecto.Query, only: [from: 2]

  @doc """
  Get the full ordered chain of sessions for an agent, optionally filtered by issue.

  Returns sessions in ascending sequence order (oldest first).
  """
  def get_chain(agent_id, opts \\ []) do
    issue_id = opts[:issue_id]

    query =
      from s in Session,
        where: s.agent_id == ^agent_id,
        order_by: [asc: s.sequence_number, asc: s.started_at]

    query = if issue_id, do: from(s in query, where: s.issue_id == ^issue_id), else: query

    Repo.all(query)
    |> build_chain()
  end

  @doc """
  Create a continuation session linked to the previous one.

  The new session inherits:
  - parent_session_id pointing to the previous session
  - sequence_number incremented by 1
  - Same agent, schedule, issue, workspace associations
  """
  def continue(%Session{} = previous_session, agent) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    attrs = %{
      agent_id: previous_session.agent_id,
      schedule_id: previous_session.schedule_id,
      issue_id: previous_session.issue_id,
      workspace_id: previous_session.workspace_id,
      model: agent.model,
      status: "active",
      started_at: now,
      parent_session_id: previous_session.id,
      sequence_number: (previous_session.sequence_number || 1) + 1
    }

    %Session{}
    |> Session.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Get total token usage across the full ancestor chain for a session.

  Walks up via parent_session_id and sums tokens at each level.
  """
  def chain_token_usage(%Session{} = session) do
    chain = collect_ancestors(session, [session])

    Enum.reduce(chain, 0, fn s, acc ->
      acc + (s.tokens_input || 0) + (s.tokens_output || 0) + (s.tokens_cache || 0)
    end)
  end

  @doc """
  Get the root session of the chain (the one with no parent).
  """
  def root(%Session{parent_session_id: nil} = session), do: session

  def root(%Session{parent_session_id: parent_id}) do
    case Repo.get(Session, parent_id) do
      nil -> nil
      parent -> root(parent)
    end
  end

  @doc """
  Serialize a chain of sessions for API responses.
  """
  def serialize_chain(sessions) when is_list(sessions) do
    Enum.map(sessions, fn s ->
      %{
        id: s.id,
        sequence_number: s.sequence_number,
        status: s.status,
        model: s.model,
        tokens_input: s.tokens_input,
        tokens_output: s.tokens_output,
        tokens_cache: s.tokens_cache,
        cost_cents: s.cost_cents,
        compaction_reason: s.compaction_reason,
        has_summary: not is_nil(s.context_summary) and s.context_summary != "",
        parent_session_id: s.parent_session_id,
        started_at: s.started_at,
        completed_at: s.completed_at
      }
    end)
  end

  # ── Private ───────────────────────────────────────────────────────────────────

  # Given a flat list of sessions for an agent, reconstruct the chain
  # by linking sessions through parent_session_id references.
  # Returns the sessions that form the most recent continuous chain.
  defp build_chain(sessions) do
    by_id = Map.new(sessions, &{&1.id, &1})

    # Find the most recent session (the tail of the chain)
    tail = Enum.max_by(sessions, & &1.sequence_number, fn -> nil end)

    if tail do
      collect_ancestors_from_map(tail, by_id, [tail])
      |> Enum.reverse()
    else
      []
    end
  end

  defp collect_ancestors_from_map(%Session{parent_session_id: nil}, _by_id, acc), do: acc

  defp collect_ancestors_from_map(%Session{parent_session_id: parent_id}, by_id, acc) do
    case Map.get(by_id, parent_id) do
      nil -> acc
      parent -> collect_ancestors_from_map(parent, by_id, [parent | acc])
    end
  end

  defp collect_ancestors(%Session{parent_session_id: nil}, acc), do: acc

  defp collect_ancestors(%Session{parent_session_id: parent_id}, acc) do
    case Repo.get(Session, parent_id) do
      nil -> acc
      parent -> collect_ancestors(parent, [parent | acc])
    end
  end
end
