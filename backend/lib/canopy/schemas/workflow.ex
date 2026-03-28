defmodule Canopy.Schemas.Workflow do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "workflows" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :status, :string, default: "draft"
    field :trigger_type, :string, default: "manual"
    field :trigger_config, :map, default: %{}
    field :created_by, :string
    field :version, :integer, default: 1

    belongs_to :workspace, Canopy.Schemas.Workspace
    belongs_to :organization, Canopy.Schemas.Organization
    has_many :steps, Canopy.Schemas.WorkflowStep, preload_order: [asc: :position]
    has_many :runs, Canopy.Schemas.WorkflowRun

    timestamps()
  end

  def changeset(workflow, attrs) do
    workflow
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :status,
      :trigger_type,
      :trigger_config,
      :created_by,
      :version,
      :workspace_id,
      :organization_id
    ])
    |> validate_required([:name, :slug, :workspace_id])
    |> validate_inclusion(:status, ~w(draft active paused archived))
    |> validate_inclusion(:trigger_type, ~w(manual schedule webhook event))
    |> unique_constraint([:workspace_id, :slug])
  end
end
