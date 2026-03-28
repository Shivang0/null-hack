defmodule Canopy.Repo.Migrations.CreatePlugins do
  use Ecto.Migration

  def change do
    create table(:plugins, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :name, :string, null: false
      add :version, :string, null: false
      add :enabled, :boolean, null: false, default: true
      add :config, :map, null: false, default: %{}
      add :state, :map, null: false, default: %{}
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      timestamps()
    end

    create unique_index(:plugins, [:slug])
    create index(:plugins, [:workspace_id])
  end
end
