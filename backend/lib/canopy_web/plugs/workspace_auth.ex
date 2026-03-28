defmodule CanopyWeb.Plugs.WorkspaceAuth do
  @moduledoc """
  Workspace authorization plug — bypassed for development.
  Assigns all workspaces as accessible.
  """
  import Plug.Conn
  import Ecto.Query

  alias Canopy.Repo
  alias Canopy.Schemas.Workspace

  def init(opts), do: opts

  def call(conn, _opts) do
    workspace_id = conn.params["workspace_id"]

    cond do
      is_nil(workspace_id) or workspace_id == "" ->
        # No workspace_id — assign all workspace IDs
        all_ids = Repo.all(from w in Workspace, select: w.id)
        assign(conn, :user_workspace_ids, all_ids)

      true ->
        case Repo.get(Workspace, workspace_id) do
          %Workspace{} = workspace ->
            conn
            |> assign(:workspace, workspace)
            |> assign(:user_workspace_ids, [workspace_id])

          nil ->
            # Still pass through — let the controller handle not-found
            assign(conn, :user_workspace_ids, [workspace_id])
        end
    end
  end
end
