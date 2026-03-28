defmodule Canopy.Repo.Migrations.AddOrgFieldsAndWorkspaceFk do
  use Ecto.Migration

  def change do
    alter table(:organizations) do
      add :mission, :text
      add :description, :text
      add :issue_prefix, :string
      add :budget_monthly_cents, :integer
      add :budget_per_agent_cents, :integer
      add :budget_enforcement, :string, default: "visibility"
      add :governance, :map, default: %{}
    end

    alter table(:workspaces) do
      add :organization_id, references(:organizations, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:workspaces, [:organization_id])
  end
end
