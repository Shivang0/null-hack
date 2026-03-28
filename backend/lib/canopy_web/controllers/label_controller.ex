defmodule CanopyWeb.LabelController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.Label
  import Ecto.Query

  def index(conn, params) do
    query =
      from l in Label,
        order_by: [asc: l.name]

    query =
      if params["workspace_id"],
        do: where(query, [l], l.workspace_id == ^params["workspace_id"]),
        else: query

    labels = Repo.all(query)
    json(conn, %{labels: Enum.map(labels, &serialize/1)})
  end

  def create(conn, params) do
    changeset = Label.changeset(%Label{}, params)

    case Repo.insert(changeset) do
      {:ok, label} ->
        conn |> put_status(201) |> json(%{label: serialize(label)})

      {:error, cs} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(cs)})
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Label, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      label ->
        Repo.delete!(label)
        json(conn, %{ok: true})
    end
  end

  # --- Private helpers ---

  defp serialize(%Label{} = l) do
    %{
      id: l.id,
      name: l.name,
      color: l.color,
      workspace_id: l.workspace_id,
      created_at: l.inserted_at,
      inserted_at: l.inserted_at,
      updated_at: l.updated_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
