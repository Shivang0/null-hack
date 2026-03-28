defmodule Canopy.Schemas.ConfigRevision do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "config_revisions" do
    field :entity_type, :string
    field :entity_id, :binary_id
    field :key, :string
    field :old_value, :map
    field :new_value, :map

    belongs_to :changed_by_user, Canopy.Schemas.User, foreign_key: :changed_by
    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps(updated_at: false)
  end

  def changeset(config_revision, attrs) do
    config_revision
    |> cast(attrs, [
      :entity_type,
      :entity_id,
      :key,
      :old_value,
      :new_value,
      :changed_by,
      :workspace_id
    ])
    |> validate_required([:entity_type, :entity_id, :key, :new_value])
  end
end
