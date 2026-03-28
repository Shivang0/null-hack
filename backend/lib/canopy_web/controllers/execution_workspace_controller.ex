defmodule CanopyWeb.ExecutionWorkspaceController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.ExecutionWorkspace
  import Ecto.Query

  def index(conn, params) do
    query =
      from ew in ExecutionWorkspace,
        order_by: [desc: ew.inserted_at]

    query =
      if params["workspace_id"],
        do: where(query, [ew], ew.workspace_id == ^params["workspace_id"]),
        else: query

    query =
      if params["status"],
        do: where(query, [ew], ew.status == ^params["status"]),
        else: query

    query =
      if params["agent_id"],
        do: where(query, [ew], ew.agent_id == ^params["agent_id"]),
        else: query

    execution_workspaces = Repo.all(query)
    json(conn, %{execution_workspaces: Enum.map(execution_workspaces, &serialize/1)})
  end

  def create(conn, params) do
    changeset = ExecutionWorkspace.changeset(%ExecutionWorkspace{}, params)

    case Repo.insert(changeset) do
      {:ok, ew} ->
        conn |> put_status(201) |> json(%{execution_workspace: serialize(ew)})

      {:error, cs} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(cs)})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(ExecutionWorkspace, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      ew ->
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        case ew
             |> Ecto.Changeset.change(status: "cleaned_up", cleaned_up_at: now)
             |> Repo.update() do
          {:ok, updated} ->
            json(conn, %{execution_workspace: serialize(updated)})

          {:error, _changeset} ->
            conn |> put_status(500) |> json(%{error: "update_failed"})
        end
    end
  end

  # --- Private helpers ---

  defp serialize(%ExecutionWorkspace{} = ew) do
    %{
      id: ew.id,
      base_branch: ew.base_branch,
      worktree_path: ew.worktree_path,
      status: ew.status,
      cleaned_up_at: ew.cleaned_up_at,
      session_id: ew.session_id,
      agent_id: ew.agent_id,
      workspace_id: ew.workspace_id,
      created_at: ew.inserted_at,
      inserted_at: ew.inserted_at,
      updated_at: ew.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
