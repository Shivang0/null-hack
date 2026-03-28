defmodule Canopy.Schemas.PluginLog do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "plugin_logs" do
    field :level, :string
    field :message, :string
    field :metadata, :map, default: %{}

    belongs_to :plugin, Canopy.Schemas.Plugin

    timestamps(updated_at: false)
  end

  def changeset(plugin_log, attrs) do
    plugin_log
    |> cast(attrs, [:level, :message, :metadata, :plugin_id])
    |> validate_required([:level, :message, :plugin_id])
    |> validate_inclusion(:level, ~w(debug info warning error))
  end
end
