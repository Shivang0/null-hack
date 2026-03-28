defmodule Canopy.Engagements do
  @moduledoc "Engagement status tracking context."

  alias Canopy.Repo
  alias Canopy.Schemas.Engagement
  import Ecto.Query

  @spec list_engagements(binary()) :: [Engagement.t()]
  def list_engagements(workspace_id) do
    Repo.all(
      from e in Engagement,
        where: e.workspace_id == ^workspace_id,
        order_by: [desc: e.inserted_at]
    )
  end

  @spec get_engagement(binary()) :: Engagement.t() | nil
  def get_engagement(id), do: Repo.get(Engagement, id)

  @spec create_engagement(map()) :: {:ok, Engagement.t()} | {:error, Ecto.Changeset.t()}
  def create_engagement(attrs) do
    %Engagement{} |> Engagement.changeset(attrs) |> Repo.insert()
  end

  @spec update_status(binary(), String.t()) ::
          {:ok, Engagement.t()} | {:error, Ecto.Changeset.t()} | {:error, :not_found}
  def update_status(id, new_status) do
    case get_engagement(id) do
      nil ->
        {:error, :not_found}

      engagement ->
        engagement
        |> Engagement.status_changeset(new_status)
        |> Repo.update()
    end
  end
end
