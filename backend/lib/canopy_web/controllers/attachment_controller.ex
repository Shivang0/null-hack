defmodule CanopyWeb.AttachmentController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{Attachment, Issue}
  import Ecto.Query

  def index(conn, %{"issue_id" => issue_id}) do
    case Repo.get(Issue, issue_id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      _issue ->
        attachments =
          Repo.all(
            from a in Attachment,
              where: a.issue_id == ^issue_id,
              order_by: [desc: a.inserted_at]
          )

        json(conn, %{attachments: Enum.map(attachments, &serialize/1)})
    end
  end

  def create(conn, %{"issue_id" => issue_id} = params) do
    case Repo.get(Issue, issue_id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      _issue ->
        attrs = Map.put(params, "issue_id", issue_id)
        changeset = Attachment.changeset(%Attachment{}, attrs)

        case Repo.insert(changeset) do
          {:ok, attachment} ->
            conn |> put_status(201) |> json(%{attachment: serialize(attachment)})

          {:error, cs} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(cs)})
        end
    end
  end

  def delete(conn, %{"issue_id" => issue_id, "id" => id}) do
    case Repo.one(from a in Attachment, where: a.id == ^id and a.issue_id == ^issue_id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      attachment ->
        Repo.delete!(attachment)
        json(conn, %{ok: true})
    end
  end

  # --- Private helpers ---

  defp serialize(%Attachment{} = a) do
    %{
      id: a.id,
      filename: a.filename,
      content_type: a.content_type,
      size_bytes: a.size_bytes,
      storage_url: a.storage_url,
      issue_id: a.issue_id,
      uploaded_by: a.uploaded_by,
      created_at: a.inserted_at,
      inserted_at: a.inserted_at,
      updated_at: a.updated_at
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
