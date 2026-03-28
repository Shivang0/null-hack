defmodule Canopy.Schemas.ApprovalComment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "approval_comments" do
    field :body, :string
    field :author_type, :string
    field :author_id, :binary_id

    belongs_to :approval, Canopy.Schemas.Approval

    timestamps(updated_at: false)
  end

  def changeset(approval_comment, attrs) do
    approval_comment
    |> cast(attrs, [:body, :author_type, :author_id, :approval_id])
    |> validate_required([:body, :author_type, :author_id, :approval_id])
    |> validate_inclusion(:author_type, ~w(user agent))
  end
end
