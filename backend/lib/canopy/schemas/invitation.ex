defmodule Canopy.Schemas.Invitation do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "invitations" do
    field :email, :string
    field :role, :string, default: "member"
    field :token, :string
    field :accepted_at, :utc_datetime
    field :expires_at, :utc_datetime

    belongs_to :organization, Canopy.Schemas.Organization
    belongs_to :invited_by_user, Canopy.Schemas.User, foreign_key: :invited_by

    timestamps()
  end

  def changeset(invitation, attrs) do
    invitation
    |> cast(attrs, [
      :email,
      :role,
      :token,
      :accepted_at,
      :expires_at,
      :organization_id,
      :invited_by
    ])
    |> validate_required([:email, :organization_id, :token])
    |> validate_format(:email, ~r/@/)
    |> validate_inclusion(:role, ~w(owner admin member))
    |> unique_constraint(:token)
  end
end
