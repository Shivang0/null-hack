defmodule CanopyWeb.DivisionController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{Division, Department}
  import Ecto.Query

  def index(conn, params) do
    organization_id = params["organization_id"]

    query = from d in Division, order_by: [asc: d.name]

    query =
      if organization_id,
        do: where(query, [d], d.organization_id == ^organization_id),
        else: query

    divisions = Repo.all(query)
    json(conn, %{divisions: Enum.map(divisions, &serialize/1)})
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Division, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      division ->
        dept_count =
          Repo.aggregate(
            from(d in Department, where: d.division_id == ^id),
            :count
          )

        json(conn, %{division: serialize(division) |> Map.put(:department_count, dept_count)})
    end
  end

  def create(conn, params) do
    changeset = Division.changeset(%Division{}, params)

    case Repo.insert(changeset) do
      {:ok, division} ->
        Canopy.EventBus.broadcast(
          "organization:#{division.organization_id}",
          %{event: "division.created", division_id: division.id, name: division.name}
        )

        conn |> put_status(201) |> json(%{division: serialize(division)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    case Repo.get(Division, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      division ->
        changeset = Division.changeset(division, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            Canopy.EventBus.broadcast(
              "organization:#{updated.organization_id}",
              %{event: "division.updated", division_id: updated.id, name: updated.name}
            )

            json(conn, %{division: serialize(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(changeset)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Division, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      division ->
        Repo.delete!(division)

        Canopy.EventBus.broadcast(
          "organization:#{division.organization_id}",
          %{event: "division.deleted", division_id: division.id}
        )

        json(conn, %{ok: true})
    end
  end

  def departments(conn, %{"division_id" => division_id}) do
    case Repo.get(Division, division_id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "division_not_found"})

      _division ->
        departments =
          Repo.all(
            from d in Department,
              where: d.division_id == ^division_id,
              order_by: [asc: d.name]
          )

        json(conn, %{departments: Enum.map(departments, &serialize_department/1)})
    end
  end

  defp serialize(%Division{} = d) do
    %{
      id: d.id,
      organization_id: d.organization_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      head_agent_id: d.head_agent_id,
      budget_monthly_cents: d.budget_monthly_cents,
      budget_enforcement: d.budget_enforcement,
      signal: d.signal,
      mission: d.mission,
      operating_model: d.operating_model,
      coordination: d.coordination,
      escalation_rules: d.escalation_rules,
      inserted_at: d.inserted_at,
      updated_at: d.updated_at
    }
  end

  defp serialize_department(%Department{} = d) do
    %{
      id: d.id,
      division_id: d.division_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      head_agent_id: d.head_agent_id,
      budget_monthly_cents: d.budget_monthly_cents,
      budget_enforcement: d.budget_enforcement,
      inserted_at: d.inserted_at,
      updated_at: d.updated_at
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
