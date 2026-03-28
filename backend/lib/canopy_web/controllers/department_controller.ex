defmodule CanopyWeb.DepartmentController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{Department, Team}
  import Ecto.Query

  def index(conn, params) do
    division_id = params["division_id"]

    query = from d in Department, order_by: [asc: d.name]
    query = if division_id, do: where(query, [d], d.division_id == ^division_id), else: query

    departments = Repo.all(query)
    json(conn, %{departments: Enum.map(departments, &serialize/1)})
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Department, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      department ->
        team_count =
          Repo.aggregate(
            from(t in Team, where: t.department_id == ^id),
            :count
          )

        json(conn, %{department: serialize(department) |> Map.put(:team_count, team_count)})
    end
  end

  def create(conn, params) do
    changeset = Department.changeset(%Department{}, params)

    case Repo.insert(changeset) do
      {:ok, department} ->
        Canopy.EventBus.broadcast(
          "division:#{department.division_id}",
          %{event: "department.created", department_id: department.id, name: department.name}
        )

        conn |> put_status(201) |> json(%{department: serialize(department)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def update(conn, %{"id" => id} = params) do
    case Repo.get(Department, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      department ->
        changeset = Department.changeset(department, params)

        case Repo.update(changeset) do
          {:ok, updated} ->
            Canopy.EventBus.broadcast(
              "division:#{updated.division_id}",
              %{event: "department.updated", department_id: updated.id, name: updated.name}
            )

            json(conn, %{department: serialize(updated)})

          {:error, changeset} ->
            conn
            |> put_status(422)
            |> json(%{error: "validation_failed", details: format_errors(changeset)})
        end
    end
  end

  def delete(conn, %{"id" => id}) do
    case Repo.get(Department, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      department ->
        Repo.delete!(department)

        Canopy.EventBus.broadcast(
          "division:#{department.division_id}",
          %{event: "department.deleted", department_id: department.id}
        )

        json(conn, %{ok: true})
    end
  end

  def teams(conn, %{"department_id" => department_id}) do
    case Repo.get(Department, department_id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "department_not_found"})

      _department ->
        teams =
          Repo.all(
            from t in Team,
              where: t.department_id == ^department_id,
              order_by: [asc: t.name]
          )

        json(conn, %{teams: Enum.map(teams, &serialize_team/1)})
    end
  end

  defp serialize(%Department{} = d) do
    %{
      id: d.id,
      division_id: d.division_id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      head_agent_id: d.head_agent_id,
      budget_monthly_cents: d.budget_monthly_cents,
      budget_enforcement: d.budget_enforcement,
      signal: d.signal,
      mission: d.mission,
      teams_overview: d.teams_overview,
      coordination: d.coordination,
      escalation_rules: d.escalation_rules,
      inserted_at: d.inserted_at,
      updated_at: d.updated_at
    }
  end

  defp serialize_team(%Team{} = t) do
    %{
      id: t.id,
      department_id: t.department_id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      manager_agent_id: t.manager_agent_id,
      budget_monthly_cents: t.budget_monthly_cents,
      budget_enforcement: t.budget_enforcement,
      inserted_at: t.inserted_at,
      updated_at: t.updated_at
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
