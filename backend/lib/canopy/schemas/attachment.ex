defmodule Canopy.Schemas.Attachment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "attachments" do
    field :filename, :string
    field :content_type, :string
    field :size_bytes, :integer
    field :storage_url, :string

    belongs_to :issue, Canopy.Schemas.Issue
    belongs_to :uploaded_by_user, Canopy.Schemas.User, foreign_key: :uploaded_by

    timestamps()
  end

  def changeset(attachment, attrs) do
    attachment
    |> cast(attrs, [:filename, :content_type, :size_bytes, :storage_url, :issue_id, :uploaded_by])
    |> validate_required([:filename, :content_type, :size_bytes, :storage_url])
  end
end
