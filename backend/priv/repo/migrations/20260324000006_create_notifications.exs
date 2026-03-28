defmodule Canopy.Repo.Migrations.CreateNotifications do
  use Ecto.Migration

  def change do
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      add :recipient_type, :string, null: false
      add :recipient_id, :binary_id
      add :sender_type, :string
      add :sender_id, :binary_id
      add :category, :string, null: false
      add :severity, :string, default: "info"
      add :title, :string, null: false
      add :body, :text
      add :action_url, :string
      add :action_label, :string
      add :metadata, :map, default: %{}
      add :read_at, :utc_datetime
      add :dismissed_at, :utc_datetime
      add :expires_at, :utc_datetime

      timestamps()
    end

    create index(:notifications, [:workspace_id])
    create index(:notifications, [:recipient_type, :recipient_id])
    create index(:notifications, [:category])
    create index(:notifications, [:read_at])
    create index(:notifications, [:inserted_at])
  end
end
