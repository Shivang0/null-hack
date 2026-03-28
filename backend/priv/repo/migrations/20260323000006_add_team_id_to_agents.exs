defmodule Canopy.Repo.Migrations.AddTeamIdToAgents do
  use Ecto.Migration

  def change do
    alter table(:agents) do
      add :team_id, references(:teams, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:agents, [:team_id])
  end
end
