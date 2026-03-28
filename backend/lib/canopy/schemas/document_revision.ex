defmodule Canopy.Schemas.DocumentRevision do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "document_revisions" do
    field :path, :string
    field :content, :string
    field :message, :string
    field :author_type, :string
    field :author_id, :binary_id

    belongs_to :workspace, Canopy.Schemas.Workspace

    timestamps(updated_at: false)
  end

  def changeset(document_revision, attrs) do
    document_revision
    |> cast(attrs, [:path, :content, :message, :author_type, :author_id, :workspace_id])
    |> validate_required([:path, :content, :author_type, :author_id, :workspace_id])
    |> validate_inclusion(:author_type, ~w(user agent))
  end
end
