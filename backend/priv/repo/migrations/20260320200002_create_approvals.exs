defmodule Canopy.Repo.Migrations.CreateApprovals do
  use Ecto.Migration

  def change do
    create table(:approvals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :description, :text
      add :status, :string, null: false, default: "pending"
      add :requested_by, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :reviewer_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :decision, :string
      add :decision_comment, :text
      add :context, :map
      add :expires_at, :utc_datetime
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      timestamps()
    end

    create index(:approvals, [:workspace_id])
    create index(:approvals, [:requested_by])
    create index(:approvals, [:reviewer_id])
    create index(:approvals, [:status])
  end
end
