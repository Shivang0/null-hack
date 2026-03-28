defmodule Canopy.Repo.Migrations.AddScopeToBudgetIncidents do
  use Ecto.Migration

  def change do
    alter table(:budget_incidents) do
      add :scope_type, :string
      add :scope_id, :binary_id
    end

    create index(:budget_incidents, [:scope_type, :scope_id])

    # Backfill existing rows: set scope_type="agent", scope_id=agent_id
    execute(
      "UPDATE budget_incidents SET scope_type = 'agent', scope_id = agent_id WHERE scope_type IS NULL",
      "SELECT 1"
    )
  end
end
