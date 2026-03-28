defmodule Canopy.Repo.Migrations.CreateSecrets do
  use Ecto.Migration

  def change do
    create table(:secrets, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :key, :string, null: false
      add :encrypted_value, :text, null: false
      add :provider, :string
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      add :created_by, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :last_used_at, :utc_datetime
      timestamps()
    end

    create index(:secrets, [:workspace_id])
    create index(:secrets, [:created_by])
  end
end
