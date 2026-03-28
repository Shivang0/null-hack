defmodule Canopy.Schemas.AppPermission do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_categories ~w(development database automation browser design communication other)

  schema "app_permissions" do
    field :app_identifier, :string
    field :app_name, :string
    field :app_category, :string, default: "other"
    field :granted_by, :string

    belongs_to :agent, Canopy.Schemas.Agent

    timestamps()
  end

  def changeset(permission, attrs) do
    permission
    |> cast(attrs, [:agent_id, :app_identifier, :app_name, :app_category, :granted_by])
    |> validate_required([:agent_id, :app_identifier, :app_name])
    |> validate_inclusion(:app_category, @valid_categories)
    |> unique_constraint([:agent_id, :app_identifier])
  end
end
