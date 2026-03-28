defmodule Canopy.Sessions.Compactor do
  @moduledoc """
  Generates session summaries and manages cross-heartbeat context continuity.

  When a session completes, the compactor:
  1. Analyzes session events to extract key outcomes (no LLM required)
  2. Generates a structured handoff summary
  3. Stores continuation data for the next session
  4. Updates the agent's last_session_summary for quick injection

  Summarization is purely structural — it extracts facts from session_events
  without calling any LLM. LLM-powered summarization can be layered on later.
  """
  require Logger

  alias Canopy.Repo
  alias Canopy.Schemas.{Session, SessionEvent, Agent}
  alias Ecto.Multi
  import Ecto.Query, only: [from: 2]

  @doc """
  Check if the current session should be compacted based on agent continuity config.

  Compaction is triggered when token usage or event count approaches configured limits.
  Defaults: 100K tokens at 85% threshold, or 500 events.
  """
  def should_compact?(%Session{} = session, %Agent{} = agent) do
    config = agent.session_continuity || %{}
    max_tokens = Map.get(config, "max_context_tokens", 100_000)
    max_events = Map.get(config, "max_events", 500)

    total_tokens = (session.tokens_input || 0) + (session.tokens_output || 0)

    event_count =
      Repo.aggregate(
        from(e in SessionEvent, where: e.session_id == ^session.id),
        :count
      )

    total_tokens > trunc(max_tokens * 0.85) or event_count > max_events
  end

  @doc """
  Generate a structured summary from a completed session's events.

  Extracts key facts from session_events without calling an LLM:
  - Tasks worked on (from tool calls and content)
  - Completed items
  - Errors encountered
  - Token usage
  - Files mentioned

  Returns a summary string of approximately 200-500 tokens.
  """
  def summarize(%Session{} = session) do
    events =
      Repo.all(
        from e in SessionEvent,
          where: e.session_id == ^session.id,
          order_by: [asc: e.inserted_at]
      )

    extract_summary(session, events)
  end

  @doc """
  Generate handoff notes for the next session.

  Produces a structured markdown document with:
  - Last session summary
  - Pending items (tools that started but may not have completed)
  - Key decisions extracted from the session
  - Blockers and errors
  - Continuation state as JSON
  """
  def generate_handoff(%Session{} = session, summary) when is_binary(summary) do
    events =
      Repo.all(
        from e in SessionEvent,
          where: e.session_id == ^session.id,
          order_by: [asc: e.inserted_at]
      )

    pending = extract_pending_items(events)
    decisions = extract_decisions(events)
    blockers = extract_blockers(events)
    continuation = extract_continuation_data(session, events)

    parts = [
      "## Last Session Summary",
      summary,
      ""
    ]

    parts =
      if pending == [] do
        parts
      else
        parts ++
          [
            "## Pending Items",
            Enum.map_join(pending, "\n", &"- #{&1}"),
            ""
          ]
      end

    parts =
      if decisions == [] do
        parts
      else
        parts ++
          [
            "## Key Decisions",
            Enum.map_join(decisions, "\n", &"- #{&1}"),
            ""
          ]
      end

    parts =
      if blockers == [] do
        parts
      else
        parts ++
          [
            "## Blockers",
            Enum.map_join(blockers, "\n", &"- #{&1}"),
            ""
          ]
      end

    parts =
      if map_size(continuation) > 0 do
        parts ++
          [
            "## Continuation State",
            Jason.encode!(continuation, pretty: true),
            ""
          ]
      else
        parts
      end

    Enum.join(parts, "\n")
  end

  @doc """
  Compact a session — called when token limit is approached or session ends normally.

  Generates the summary and handoff, then atomically updates both the session
  and the agent's last_session_summary in a single Ecto.Multi transaction.
  """
  def compact(%Session{} = session, reason \\ "session_complete") do
    # Preload agent if not already loaded
    session = Repo.preload(session, :agent)

    summary = summarize(session)
    handoff = generate_handoff(session, summary)

    events =
      Repo.all(
        from e in SessionEvent,
          where: e.session_id == ^session.id,
          order_by: [asc: e.inserted_at]
      )

    continuation = extract_continuation_data(session, events)

    Multi.new()
    |> Multi.update(:session, fn _changes ->
      Session.changeset(session, %{
        context_summary: summary,
        handoff_notes: handoff,
        compaction_reason: reason,
        continuation_data: continuation
      })
    end)
    |> Multi.update(:agent, fn _changes ->
      Agent.changeset(session.agent, %{
        last_session_summary: summary
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{session: updated_session}} ->
        Logger.info("[Compactor] Compacted session #{session.id} (reason: #{reason})")
        {:ok, updated_session}

      {:error, :session, changeset, _changes} ->
        Logger.error(
          "[Compactor] Failed to update session #{session.id}: #{inspect(changeset.errors)}"
        )

        {:error, changeset}

      {:error, :agent, changeset, _changes} ->
        Logger.error(
          "[Compactor] Failed to update agent #{session.agent_id}: #{inspect(changeset.errors)}"
        )

        {:error, changeset}
    end
  end

  @doc """
  Build continuation context to inject at the start of a new heartbeat.

  Loads the most recent completed session for the agent. If it has handoff_notes,
  formats them for injection as a context prefix. Returns an empty string if
  there is no prior session or the prior session has no handoff data.
  """
  def build_continuation_context(%Agent{} = agent) do
    case most_recent_completed_session(agent.id) do
      nil ->
        ""

      %Session{handoff_notes: nil} ->
        ""

      %Session{handoff_notes: ""} ->
        ""

      %Session{handoff_notes: handoff, sequence_number: seq} ->
        """
        ## Context from Previous Session (Session #{seq})

        #{handoff}

        ---

        """
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────────

  defp most_recent_completed_session(agent_id) do
    Repo.one(
      from s in Session,
        where: s.agent_id == ^agent_id and s.status == "completed",
        order_by: [desc: s.started_at],
        limit: 1
    )
  end

  defp extract_summary(session, events) do
    total_tokens = (session.tokens_input || 0) + (session.tokens_output || 0)
    event_count = length(events)
    duration_str = format_duration(session)

    tool_calls = Enum.filter(events, &(&1.event_type in ["run.tool_call", "tool_use"]))

    tool_names =
      tool_calls |> Enum.map(&extract_tool_name/1) |> Enum.uniq() |> Enum.reject(&is_nil/1)

    errors = Enum.filter(events, &(&1.event_type in ["run.error", "tool_error", "error"]))
    error_messages = errors |> Enum.map(&extract_error_message/1) |> Enum.reject(&is_nil/1)

    output_events = Enum.filter(events, &(&1.event_type in ["run.output", "assistant", "text"]))
    content_snippet = extract_content_snippet(output_events)

    parts = [
      "Session completed in #{duration_str}.",
      "Events processed: #{event_count}. Total tokens used: #{total_tokens}.",
      if(session.cost_cents && session.cost_cents > 0,
        do: "Cost: #{session.cost_cents} cents.",
        else: nil
      )
    ]

    parts =
      if tool_names != [] do
        parts ++ ["Tools used: #{Enum.join(tool_names, ", ")}."]
      else
        parts
      end

    parts =
      if error_messages != [] do
        parts ++ ["Errors encountered: #{Enum.join(error_messages, "; ")}."]
      else
        parts
      end

    parts =
      if content_snippet do
        parts ++ ["Last output: #{content_snippet}"]
      else
        parts
      end

    parts
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" ")
  end

  defp extract_pending_items(events) do
    # A tool call is "pending" if it was started but no corresponding result event follows
    tool_call_events = Enum.filter(events, &(&1.event_type in ["run.tool_call", "tool_use"]))

    tool_result_events =
      Enum.filter(events, &(&1.event_type in ["run.tool_result", "tool_result"]))

    result_tool_use_ids =
      tool_result_events
      |> Enum.map(fn e -> get_in(e.data, ["tool_use_id"]) end)
      |> Enum.reject(&is_nil/1)
      |> MapSet.new()

    tool_call_events
    |> Enum.reject(fn e ->
      tool_use_id = get_in(e.data, ["id"]) || get_in(e.data, ["tool_use_id"])
      MapSet.member?(result_tool_use_ids, tool_use_id)
    end)
    |> Enum.map(fn e ->
      tool_name = extract_tool_name(e)
      input = get_in(e.data, ["input"])

      if tool_name do
        input_str =
          if is_map(input) and map_size(input) > 0 do
            " (input: #{Jason.encode!(input)})"
          else
            ""
          end

        "#{tool_name}#{input_str}"
      end
    end)
    |> Enum.reject(&is_nil/1)
  end

  defp extract_decisions(events) do
    # Extract text from assistant output that looks like decisions or conclusions
    output_events = Enum.filter(events, &(&1.event_type in ["run.output", "assistant", "text"]))

    output_events
    |> Enum.flat_map(fn e ->
      content = get_content(e.data)

      if is_binary(content) do
        content
        |> String.split("\n")
        |> Enum.filter(fn line ->
          lower = String.downcase(line)

          String.contains?(lower, "decided") or
            String.contains?(lower, "choosing") or
            String.contains?(lower, "will use") or
            String.contains?(lower, "approach:") or
            String.contains?(lower, "solution:") or
            (String.starts_with?(String.trim(line), "- ") and String.length(line) < 200)
        end)
        |> Enum.map(&String.trim/1)
      else
        []
      end
    end)
    |> Enum.uniq()
    |> Enum.take(5)
  end

  defp extract_blockers(events) do
    error_events = Enum.filter(events, &(&1.event_type in ["run.error", "tool_error", "error"]))

    error_events
    |> Enum.map(&extract_error_message/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
    |> Enum.take(5)
  end

  defp extract_continuation_data(session, events) do
    tool_calls = Enum.filter(events, &(&1.event_type in ["run.tool_call", "tool_use"]))
    last_tool = List.last(tool_calls)

    base = %{
      "session_id" => session.id,
      "sequence_number" => session.sequence_number || 1,
      "total_tokens" => (session.tokens_input || 0) + (session.tokens_output || 0),
      "event_count" => length(events)
    }

    if last_tool do
      Map.put(base, "last_tool_call", %{
        "name" => extract_tool_name(last_tool),
        "input" => get_in(last_tool.data, ["input"])
      })
    else
      base
    end
  end

  defp extract_tool_name(%SessionEvent{data: data}) when is_map(data) do
    data["name"] || data["tool_name"] || data["function_name"]
  end

  defp extract_tool_name(_), do: nil

  defp extract_error_message(%SessionEvent{data: data}) when is_map(data) do
    data["error"] || data["message"] || data["reason"]
  end

  defp extract_error_message(_), do: nil

  defp extract_content_snippet(output_events) do
    last_output = List.last(output_events)

    if last_output do
      content = get_content(last_output.data)

      if is_binary(content) and String.length(content) > 0 do
        content
        |> String.slice(0, 300)
        |> String.replace("\n", " ")
        |> then(fn s ->
          if String.length(content) > 300, do: s <> "...", else: s
        end)
      end
    end
  end

  defp get_content(data) when is_map(data) do
    data["content"] || data["text"] || data["body"] || data["output"]
  end

  defp get_content(_), do: nil

  defp format_duration(%Session{started_at: nil}), do: "unknown duration"

  defp format_duration(%Session{completed_at: nil, started_at: started}) do
    seconds = DateTime.diff(DateTime.utc_now(), started)
    format_seconds(seconds)
  end

  defp format_duration(%Session{started_at: started, completed_at: completed}) do
    seconds = DateTime.diff(completed, started)
    format_seconds(seconds)
  end

  defp format_seconds(seconds) when seconds < 60, do: "#{seconds}s"

  defp format_seconds(seconds) when seconds < 3600 do
    minutes = div(seconds, 60)
    secs = rem(seconds, 60)
    "#{minutes}m #{secs}s"
  end

  defp format_seconds(seconds) do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)
    "#{hours}h #{minutes}m"
  end
end
