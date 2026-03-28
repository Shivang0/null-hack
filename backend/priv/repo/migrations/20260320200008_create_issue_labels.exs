defmodule Canopy.Repo.Migrations.CreateIssueLabels do
  use Ecto.Migration

  def change do
    create table(:issue_labels, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :issue_id, references(:issues, type: :binary_id, on_delete: :delete_all), null: false
      add :label_id, references(:labels, type: :binary_id, on_delete: :delete_all), null: false
      timestamps(updated_at: false)
    end

    create unique_index(:issue_labels, [:issue_id, :label_id])
    create index(:issue_labels, [:label_id])
  end
end
