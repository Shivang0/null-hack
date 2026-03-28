defmodule Canopy.Repo.Migrations.CreateEngagements do
  use Ecto.Migration

  def change do
    create table(:engagements, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_name, :string, null: false
      add :client_email, :string
      add :engagement_type, :string, null: false
      add :status, :string, default: "pending", null: false
      add :scope, :text
      add :findings_count, :integer, default: 0
      add :risk_level, :string
      add :started_at, :utc_datetime
      add :completed_at, :utc_datetime

      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      timestamps()
    end

    create index(:engagements, [:workspace_id])
    create index(:engagements, [:status])
    create index(:engagements, [:client_email])
  end
end
