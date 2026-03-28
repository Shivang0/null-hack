defmodule Canopy.Schemas.Secret do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "secrets" do
    field :name, :string
    field :key, :string
    field :encrypted_value, :string
    field :provider, :string
    field :last_used_at, :utc_datetime

    belongs_to :workspace, Canopy.Schemas.Workspace
    belongs_to :created_by_user, Canopy.Schemas.User, foreign_key: :created_by

    timestamps()
  end

  def changeset(secret, attrs) do
    secret
    |> cast(attrs, [
      :name,
      :key,
      :encrypted_value,
      :provider,
      :workspace_id,
      :created_by,
      :last_used_at
    ])
    |> validate_required([:name, :key, :encrypted_value])
  end
end
