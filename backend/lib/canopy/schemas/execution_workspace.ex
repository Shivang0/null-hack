defmodule Canopy.Schemas.ExecutionWorkspace do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "execution_workspaces" do
    field :base_branch, :string
    field :worktree_path, :string
    field :status, :string, default: "active"
    field :cleaned_up_at, :utc_datetime

    belongs_to :session, Canopy.Schemas.Session
    belongs_to :agent, Canopy.Schemas.Agent
    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(execution_workspace, attrs) do
    execution_workspace
    |> cast(attrs, [
      :base_branch,
      :worktree_path,
      :status,
      :cleaned_up_at,
      :session_id,
      :agent_id,
      :workspace_id
    ])
    |> validate_required([:session_id, :agent_id, :workspace_id])
    |> validate_inclusion(:status, ~w(active cleaning cleaned error))
  end
end
