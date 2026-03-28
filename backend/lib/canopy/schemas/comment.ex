defmodule Canopy.Schemas.Comment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "comments" do
    field :author_type, :string
    field :author_id, :binary_id
    field :body, :string

    belongs_to :issue, Canopy.Schemas.Issue

    timestamps(updated_at: false)
  end

  def changeset(comment, attrs) do
    comment
    |> cast(attrs, [:author_type, :author_id, :body, :issue_id])
    |> validate_required([:author_type, :author_id, :body, :issue_id])
    |> validate_inclusion(:author_type, ~w(user agent))
  end
end
