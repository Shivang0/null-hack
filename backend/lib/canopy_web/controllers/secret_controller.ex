defmodule CanopyWeb.SecretController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.Secret
  import Ecto.Query

  def index(conn, params) do
    query =
      from s in Secret,
        order_by: [asc: s.name]

    query =
      if params["workspace_id"],
        do: where(query, [s], s.workspace_id == ^params["workspace_id"]),
        else: query

    secrets = Repo.all(query)
    json(conn, %{secrets: Enum.map(secrets, &serialize/1)})
  end

  def create(conn, params) do
    changeset = Secret.changeset(%Secret{}, params)

    case Repo.insert(changeset) do
      {:ok, secret} ->
        conn |> put_status(201) |> json(%{secret: serialize(secret)})

      {:error, cs} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(cs)})
    end
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Secret, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      secret ->
        json(conn, %{secret: serialize(secret)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    case Repo.get(Secret, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      secret ->
        changeset = Secret.changeset(secret, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            json(conn, %{secret: serialize(updated)})

          {:error, cs} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(cs)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Secret, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      secret ->
        Repo.delete!(secret)
        json(conn, %{ok: true})
    end
  end

  def rotate(conn, %{"secret_id" => id}) do
    case Repo.get(Secret, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      secret ->
        new_token = Base.encode64(:crypto.strong_rand_bytes(32))

        case secret
             |> Secret.changeset(%{"encrypted_value" => new_token})
             |> Repo.update() do
          {:ok, updated} ->
            json(conn, %{secret: serialize(updated)})

          {:error, cs} ->
            conn
            |> put_status(422)
            |> json(%{error: "rotation_failed", details: format_errors(cs)})
        end
    end
  end

  # --- Private helpers ---

  # Never return encrypted_value — mask at all times.
  defp serialize(%Secret{} = s) do
    %{
      id: s.id,
      name: s.name,
      key: s.key,
      provider: s.provider,
      workspace_id: s.workspace_id,
      last_used_at: s.last_used_at,
      created_at: s.inserted_at,
      inserted_at: s.inserted_at,
      updated_at: s.updated_at
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
