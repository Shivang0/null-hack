defmodule Canopy.Schemas.Dataset do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "datasets" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :source_type, :string
    field :format, :string
    field :schema_definition, :map, default: %{}
    field :row_count, :integer, default: 0
    field :size_bytes, :integer, default: 0
    field :status, :string, default: "active"
    field :refresh_schedule, :string
    field :last_refreshed_at, :utc_datetime
    field :connection_config, :map, default: %{}
    field :tags, {:array, :string}, default: []
    field :access_agents, {:array, :binary_id}, default: []

    belongs_to :workspace, Canopy.Schemas.Workspace
    belongs_to :created_by_agent, Canopy.Schemas.Agent

    timestamps()
  end

  @source_types ~w(upload api database agent_generated stream)
  @formats ~w(csv json parquet sql api)
  @statuses ~w(active processing stale archived)

  def changeset(dataset, attrs) do
    dataset
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :source_type,
      :format,
      :schema_definition,
      :row_count,
      :size_bytes,
      :status,
      :refresh_schedule,
      :last_refreshed_at,
      :connection_config,
      :tags,
      :access_agents,
      :workspace_id,
      :created_by_agent_id
    ])
    |> validate_required([:name, :slug, :source_type, :format])
    |> validate_inclusion(:source_type, @source_types)
    |> validate_inclusion(:format, @formats)
    |> validate_inclusion(:status, @statuses)
    |> unique_constraint([:workspace_id, :slug])
  end
end
