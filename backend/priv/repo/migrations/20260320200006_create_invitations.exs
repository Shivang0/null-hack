defmodule Canopy.Repo.Migrations.CreateInvitations do
  use Ecto.Migration

  def change do
    create table(:invitations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false

      add :organization_id, references(:organizations, type: :binary_id, on_delete: :delete_all),
        null: false

      add :role, :string, null: false, default: "member"
      add :token, :string, null: false
      add :invited_by, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :accepted_at, :utc_datetime
      add :expires_at, :utc_datetime
      timestamps()
    end

    create unique_index(:invitations, [:token])
    create index(:invitations, [:organization_id])
    create index(:invitations, [:email])
  end
end
