defmodule Canopy.Repo.Migrations.CreateTeams do
  use Ecto.Migration

  def change do
    create table(:teams, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :department_id, references(:departments, type: :binary_id, on_delete: :delete_all),
        null: false

      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :manager_agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :budget_monthly_cents, :integer
      add :budget_enforcement, :string, default: "visibility"
      add :signal, :string
      add :mission, :text
      add :coordination, :text
      add :escalation_rules, :text
      add :handoff_protocols, :text

      timestamps()
    end

    create unique_index(:teams, [:department_id, :slug])
    create index(:teams, [:department_id])
  end
end
