defmodule Canopy.Schemas.WorkProduct do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_types ~w(report code data document analysis design)
  @valid_statuses ~w(draft final archived)

  schema "work_products" do
    field :title, :string
    field :type, :string
    # Legacy column kept for backward compat — maps to :type going forward
    field :product_type, :string
    field :content_preview, :string
    field :content, :string
    field :file_path, :string
    field :file_size_bytes, :integer
    field :status, :string, default: "draft"
    field :quality_score, :integer
    field :metadata, :map, default: %{}

    belongs_to :agent, Canopy.Schemas.Agent
    belongs_to :session, Canopy.Schemas.Session
    belongs_to :project, Canopy.Schemas.Project
    belongs_to :workspace, Canopy.Schemas.Workspace
    # Legacy association — issue_id still exists in the table
    belongs_to :issue, Canopy.Schemas.Issue

    timestamps()
  end

  def changeset(work_product, attrs) do
    work_product
    |> cast(attrs, [
      :title,
      :type,
      :product_type,
      :content_preview,
      :content,
      :file_path,
      :file_size_bytes,
      :status,
      :quality_score,
      :metadata,
      :agent_id,
      :session_id,
      :project_id,
      :workspace_id,
      :issue_id
    ])
    |> validate_required([:title, :type])
    |> validate_inclusion(:type, @valid_types)
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_number(:quality_score, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
  end
end
