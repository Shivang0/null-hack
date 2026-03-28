defmodule Canopy.Repo.Migrations.CreateTemplates do
  use Ecto.Migration

  def change do
    create table(:templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :category, :string, null: false, default: "custom"
      add :agents, :map, null: false, default: %{}
      add :skills, :map, null: false, default: %{}
      add :schedules, :map, null: false, default: %{}
      add :is_builtin, :boolean, null: false, default: false
      timestamps()
    end
  end
end
