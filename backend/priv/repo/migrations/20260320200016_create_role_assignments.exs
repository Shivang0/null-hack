defmodule Canopy.Repo.Migrations.CreateRoleAssignments do
  use Ecto.Migration

  def change do
    create table(:role_assignments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :role, :string, null: false
      add :resource_type, :string, null: false
      add :resource_id, :binary_id, null: false
      timestamps()
    end

    create unique_index(:role_assignments, [:user_id, :resource_type, :resource_id])
    create index(:role_assignments, [:resource_type, :resource_id])
  end
end
