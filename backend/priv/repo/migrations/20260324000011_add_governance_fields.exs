defmodule Canopy.Repo.Migrations.AddGovernanceFields do
  use Ecto.Migration

  def change do
    alter table(:approvals) do
      add :action_type, :string
      add :action_params, :map, default: %{}
      add :auto_execute, :boolean, default: false
    end

    create index(:approvals, [:action_type])

    create index(:approvals, [:workspace_id, :action_type, :status],
             name: "approvals_workspace_action_status_idx"
           )
  end
end
