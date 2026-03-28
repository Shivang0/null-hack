defmodule Canopy.Repo.Migrations.CreateDocumentRevisions do
  use Ecto.Migration

  def change do
    create table(:document_revisions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :path, :string, null: false
      add :content, :text, null: false
      add :message, :string
      add :author_type, :string, null: false
      add :author_id, :binary_id, null: false

      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      timestamps(updated_at: false)
    end

    create index(:document_revisions, [:workspace_id])
    create index(:document_revisions, [:workspace_id, :path])
    create index(:document_revisions, [:author_id])
  end
end
