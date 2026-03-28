defmodule Canopy.Repo.Migrations.CreateConfigRevisions do
  use Ecto.Migration

  def change do
    create table(:config_revisions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :entity_type, :string, null: false
      add :entity_id, :binary_id, null: false
      add :key, :string, null: false
      add :old_value, :map
      add :new_value, :map, null: false
      add :changed_by, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      timestamps(updated_at: false)
    end

    create index(:config_revisions, [:workspace_id])
    create index(:config_revisions, [:entity_type, :entity_id])
    create index(:config_revisions, [:changed_by])
  end
end
