defmodule Canopy.Repo.Migrations.CreateDepartments do
  use Ecto.Migration

  def change do
    create table(:departments, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :division_id, references(:divisions, type: :binary_id, on_delete: :delete_all),
        null: false

      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :head_agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :budget_monthly_cents, :integer
      add :budget_enforcement, :string, default: "visibility"
      add :signal, :string
      add :mission, :text
      add :teams_overview, :text
      add :coordination, :text
      add :escalation_rules, :text

      timestamps()
    end

    create unique_index(:departments, [:division_id, :slug])
    create index(:departments, [:division_id])
  end
end
