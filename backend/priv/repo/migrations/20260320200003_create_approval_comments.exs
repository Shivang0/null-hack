defmodule Canopy.Repo.Migrations.CreateApprovalComments do
  use Ecto.Migration

  def change do
    create table(:approval_comments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :body, :text, null: false
      add :author_type, :string, null: false
      add :author_id, :binary_id, null: false

      add :approval_id, references(:approvals, type: :binary_id, on_delete: :delete_all),
        null: false

      timestamps(updated_at: false)
    end

    create index(:approval_comments, [:approval_id])
    create index(:approval_comments, [:author_id])
  end
end
