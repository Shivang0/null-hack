defmodule Canopy.Repo.Migrations.AddAdapterOverrideToIssues do
  use Ecto.Migration

  def change do
    alter table(:issues) do
      add :adapter_override, :string, null: true
      add :delegation_chain, :map, default: %{}
    end
  end
end
