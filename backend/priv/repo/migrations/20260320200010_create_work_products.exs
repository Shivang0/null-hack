defmodule Canopy.Repo.Migrations.CreateWorkProducts do
  use Ecto.Migration

  def change do
    create table(:work_products, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :product_type, :string, null: false
      add :content, :text
      add :metadata, :map, null: false, default: %{}
      add :issue_id, references(:issues, type: :binary_id, on_delete: :nilify_all)
      add :session_id, references(:sessions, type: :binary_id, on_delete: :nilify_all)
      add :agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all)
      timestamps()
    end

    create index(:work_products, [:workspace_id])
    create index(:work_products, [:issue_id])
    create index(:work_products, [:session_id])
    create index(:work_products, [:agent_id])
  end
end
