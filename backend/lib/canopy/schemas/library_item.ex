defmodule Canopy.Schemas.LibraryItem do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_categories ~w(agent_template skill team_template workflow_template company_template)
  @valid_statuses ~w(draft published deprecated archived)
  @valid_visibilities ~w(private organization public)

  schema "library_items" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :category, :string
    field :subcategory, :string
    field :version, :string, default: "1.0.0"
    field :status, :string, default: "published"
    field :visibility, :string, default: "organization"
    field :icon, :string
    field :config, :map, default: %{}
    field :tags, {:array, :string}, default: []
    field :install_count, :integer, default: 0
    field :rating_sum, :integer, default: 0
    field :rating_count, :integer, default: 0
    field :dependencies, {:array, :string}, default: []
    field :changelog, :string
    field :readme, :string

    belongs_to :organization, Canopy.Schemas.Organization
    field :created_by_id, :binary_id

    has_many :installs, Canopy.Schemas.LibraryInstall

    timestamps()
  end

  def changeset(item, attrs) do
    item
    |> cast(attrs, [
      :name,
      :slug,
      :description,
      :category,
      :subcategory,
      :version,
      :status,
      :visibility,
      :icon,
      :config,
      :tags,
      :install_count,
      :rating_sum,
      :rating_count,
      :dependencies,
      :changelog,
      :readme,
      :organization_id,
      :created_by_id
    ])
    |> validate_required([:name, :slug, :category, :config])
    |> validate_length(:name, min: 1, max: 200)
    |> validate_format(:slug, ~r/^[a-z0-9_-]+$/,
      message: "must be lowercase alphanumeric with dashes/underscores"
    )
    |> validate_inclusion(:category, @valid_categories)
    |> validate_inclusion(:status, @valid_statuses)
    |> validate_inclusion(:visibility, @valid_visibilities)
    |> unique_constraint([:organization_id, :slug, :category])
  end

  def avg_rating(%__MODULE__{rating_count: count}) when count == 0, do: nil

  def avg_rating(%__MODULE__{rating_sum: sum, rating_count: count}) do
    Float.round(sum / count, 2)
  end
end
