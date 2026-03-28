defmodule Canopy.Repo.Migrations.CreateExecutionWorkspaces do
  use Ecto.Migration

  def change do
    create table(:execution_workspaces, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :session_id, references(:sessions, type: :binary_id, on_delete: :delete_all),
        null: false

      add :agent_id, references(:agents, type: :binary_id, on_delete: :delete_all), null: false
      add :base_branch, :string
      add :worktree_path, :string
      add :status, :string, null: false, default: "active"

      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :cleaned_up_at, :utc_datetime
      timestamps()
    end

    create index(:execution_workspaces, [:session_id])
    create index(:execution_workspaces, [:agent_id])
    create index(:execution_workspaces, [:workspace_id])
    create index(:execution_workspaces, [:status])
  end
end
