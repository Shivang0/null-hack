defmodule Canopy.Schemas.Plugin do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "plugins" do
    field :slug, :string
    field :name, :string
    field :version, :string
    field :enabled, :boolean, default: true
    field :config, :map, default: %{}
    field :state, :map, default: %{}

    belongs_to :workspace, Canopy.Schemas.Workspace
    has_many :plugin_logs, Canopy.Schemas.PluginLog

    timestamps()
  end

  def changeset(plugin, attrs) do
    plugin
    |> cast(attrs, [:slug, :name, :version, :enabled, :config, :state, :workspace_id])
    |> validate_required([:slug, :name, :version])
    |> unique_constraint(:slug)
  end
end
