defmodule Canopy.Repo.Migrations.CreateTeamMemberships do
  use Ecto.Migration

  def change do
    create table(:team_memberships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :team_id, references(:teams, type: :binary_id, on_delete: :delete_all), null: false
      add :agent_id, references(:agents, type: :binary_id, on_delete: :delete_all), null: false
      add :role, :string, default: "member"

      timestamps()
    end

    create unique_index(:team_memberships, [:agent_id])
    create index(:team_memberships, [:team_id])
  end
end
