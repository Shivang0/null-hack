defmodule Canopy.Repo.Migrations.CreateDatasets do
  use Ecto.Migration

  def change do
    create table(:datasets, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      add :created_by_agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :source_type, :string, null: false
      add :format, :string, null: false
      add :schema_definition, :map
      add :row_count, :integer, default: 0
      add :size_bytes, :bigint, default: 0
      add :status, :string, default: "active"
      add :refresh_schedule, :string
      add :last_refreshed_at, :utc_datetime
      add :connection_config, :map
      add :tags, {:array, :string}, default: []
      add :access_agents, {:array, :binary_id}, default: []

      timestamps()
    end

    create unique_index(:datasets, [:workspace_id, :slug])
    create index(:datasets, [:workspace_id])
    create index(:datasets, [:source_type])
  end
end
