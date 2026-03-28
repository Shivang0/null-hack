defmodule Canopy.Repo.Migrations.CreateOrganizations do
  use Ecto.Migration

  def change do
    create table(:organizations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :slug, :string, null: false
      add :logo_url, :string
      add :plan, :string, null: false, default: "free"
      add :settings, :map, null: false, default: %{}
      timestamps()
    end

    create unique_index(:organizations, [:slug])
  end
end
