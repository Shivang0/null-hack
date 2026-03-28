defmodule Canopy.Repo.Migrations.CreateAttachments do
  use Ecto.Migration

  def change do
    create table(:attachments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :filename, :string, null: false
      add :content_type, :string, null: false
      add :size_bytes, :integer, null: false
      add :storage_url, :string, null: false
      add :issue_id, references(:issues, type: :binary_id, on_delete: :delete_all)
      add :uploaded_by, references(:users, type: :binary_id, on_delete: :nilify_all)
      timestamps()
    end

    create index(:attachments, [:issue_id])
    create index(:attachments, [:uploaded_by])
  end
end
