defmodule Canopy.Repo.Migrations.CreatePluginLogs do
  use Ecto.Migration

  def change do
    create table(:plugin_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :plugin_id, references(:plugins, type: :binary_id, on_delete: :delete_all), null: false
      add :level, :string, null: false
      add :message, :text, null: false
      add :metadata, :map, null: false, default: %{}
      timestamps(updated_at: false)
    end

    create index(:plugin_logs, [:plugin_id])
    create index(:plugin_logs, [:plugin_id, :level])
  end
end
