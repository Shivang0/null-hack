defmodule CanopyWeb.AccessController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.RoleAssignment
  import Ecto.Query

  def index(conn, params) do
    query =
      from r in RoleAssignment,
        order_by: [asc: r.inserted_at]

    query =
      if params["resource_type"],
        do: where(query, [r], r.resource_type == ^params["resource_type"]),
        else: query

    query =
      if params["resource_id"],
        do: where(query, [r], r.resource_id == ^params["resource_id"]),
        else: query

    query =
      if params["user_id"],
        do: where(query, [r], r.user_id == ^params["user_id"]),
        else: query

    assignments = Repo.all(query)
    json(conn, %{assignments: Enum.map(assignments, &serialize/1)})
  end

  def assign(conn, params) do
    changeset = RoleAssignment.changeset(%RoleAssignment{}, params)

    case Repo.insert(changeset) do
      {:ok, assignment} ->
        conn |> put_status(201) |> json(%{assignment: serialize(assignment)})

      {:error, cs} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(cs)})
    end
  end

  def revoke(conn, %{"id" => id}) do
    case Repo.get(RoleAssignment, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      assignment ->
        Repo.delete!(assignment)
        json(conn, %{ok: true})
    end
  end

  # --- Private helpers ---

  defp serialize(%RoleAssignment{} = r) do
    %{
      id: r.id,
      role: r.role,
      resource_type: r.resource_type,
      resource_id: r.resource_id,
      user_id: r.user_id,
      created_at: r.inserted_at,
      inserted_at: r.inserted_at
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
