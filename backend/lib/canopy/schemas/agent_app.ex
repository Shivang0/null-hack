defmodule Canopy.Schemas.AgentApp do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_statuses ~w(running stopped building error)

  schema "agent_apps" do
    field :name, :string
    field :template_source, :string
    field :status, :string, default: "stopped"
    field :port, :integer
    field :directory, :string
    field :config, :map, default: %{}
    field :build_log, :string
    field :resource_usage, :map, default: %{}

    belongs_to :agent, Canopy.Schemas.Agent
    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps()
  end

  def changeset(agent_app, attrs) do
    agent_app
    |> cast(attrs, [
      :name,
      :agent_id,
      :workspace_id,
      :template_source,
      :status,
      :port,
      :directory,
      :config,
      :build_log,
      :resource_usage
    ])
    |> validate_required([:name])
    |> validate_inclusion(:status, @valid_statuses)
  end
end
