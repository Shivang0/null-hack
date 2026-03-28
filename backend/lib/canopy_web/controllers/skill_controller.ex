defmodule CanopyWeb.SkillController do
  use CanopyWeb, :controller

  alias Canopy.Repo
  alias Canopy.Schemas.{Agent, Skill}
  import Ecto.Query

  def index(conn, params) do
    workspace_id = params["workspace_id"]
    category = params["category"]
    enabled = params["enabled"]

    query = from s in Skill, order_by: [asc: s.category, asc: s.name]

    query = if workspace_id, do: where(query, [s], s.workspace_id == ^workspace_id), else: query
    query = if category, do: where(query, [s], s.category == ^category), else: query

    query =
      case enabled do
        "true" -> where(query, [s], s.enabled == true)
        "false" -> where(query, [s], s.enabled == false)
        _ -> query
      end

    skills = Repo.all(query)
    json(conn, %{skills: Enum.map(skills, &serialize/1)})
  end

  def show(conn, %{"id" => id}) do
    case Repo.get(Skill, id) do
      nil -> conn |> put_status(404) |> json(%{error: "not_found"})
      skill -> json(conn, %{skill: serialize(skill)})
    end
  end

  def toggle(conn, %{"skill_id" => id}) do
    case Repo.get(Skill, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      skill ->
        case skill
             |> Ecto.Changeset.change(enabled: !skill.enabled)
             |> Repo.update() do
          {:ok, updated} ->
            Canopy.EventBus.broadcast(
              Canopy.EventBus.workspace_topic(updated.workspace_id),
              %{event: "skill.toggled", skill_id: updated.id, enabled: updated.enabled}
            )

            json(conn, %{skill: serialize(updated)})

          {:error, _changeset} ->
            conn |> put_status(500) |> json(%{error: "update_failed"})
        end
    end
  end

  def bulk_enable(conn, %{"ids" => ids}) do
    {count, _} =
      Repo.update_all(
        from(s in Skill, where: s.id in ^ids),
        set: [enabled: true]
      )

    Canopy.EventBus.broadcast(
      Canopy.EventBus.activity_topic(),
      %{event: "skill.bulk_toggled", action: "enabled", updated: count}
    )

    json(conn, %{ok: true, updated: count})
  end

  def bulk_disable(conn, %{"ids" => ids}) do
    {count, _} =
      Repo.update_all(
        from(s in Skill, where: s.id in ^ids),
        set: [enabled: false]
      )

    Canopy.EventBus.broadcast(
      Canopy.EventBus.activity_topic(),
      %{event: "skill.bulk_toggled", action: "disabled", updated: count}
    )

    json(conn, %{ok: true, updated: count})
  end

  def categories(conn, params) do
    workspace_id = params["workspace_id"]

    query =
      from s in Skill,
        group_by: s.category,
        select: %{
          category: s.category,
          count: count(s.id),
          enabled_count: sum(fragment("CASE WHEN ? THEN 1 ELSE 0 END", s.enabled))
        }

    query = if workspace_id, do: where(query, [s], s.workspace_id == ^workspace_id), else: query

    categories = Repo.all(query)
    json(conn, %{categories: categories})
  end

  def import_skill(conn, params) do
    changeset = Skill.changeset(%Skill{}, params)

    case Repo.insert(changeset) do
      {:ok, skill} ->
        Canopy.EventBus.broadcast(
          Canopy.EventBus.workspace_topic(skill.workspace_id),
          %{event: "skill.imported", skill_id: skill.id, name: skill.name}
        )

        conn |> put_status(201) |> json(%{skill: serialize(skill)})

      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: "validation_failed", details: format_errors(changeset)})
    end
  end

  def inject(conn, %{"skill_id" => id}) do
    case Repo.get(Skill, id) do
      nil ->
        conn |> put_status(404) |> json(%{error: "not_found"})

      skill ->
        Canopy.EventBus.broadcast(
          Canopy.EventBus.activity_topic(),
          %{event: "skill.injected", skill_id: skill.id, name: skill.name}
        )

        json(conn, %{ok: true, skill_id: skill.id})
    end
  end

  def assign_to_agent(conn, %{"agent_id" => agent_id, "skill_id" => skill_id}) do
    with %Agent{} <- Repo.get(Agent, agent_id),
         %Skill{} <- Repo.get(Skill, skill_id) do
      result =
        Repo.insert_all(
          "agent_skills",
          [%{agent_id: agent_id, skill_id: skill_id}],
          on_conflict: :nothing
        )

      case result do
        {_, _} -> json(conn, %{ok: true})
      end
    else
      nil -> conn |> put_status(404) |> json(%{error: "not_found"})
    end
  end

  def remove_from_agent(conn, %{"agent_id" => agent_id, "skill_id" => skill_id}) do
    query =
      from as in "agent_skills",
        where:
          as.agent_id == type(^agent_id, :binary_id) and
            as.skill_id == type(^skill_id, :binary_id)

    {count, _} = Repo.delete_all(query)

    if count > 0 do
      json(conn, %{ok: true})
    else
      conn |> put_status(404) |> json(%{error: "not_found"})
    end
  end

  defp serialize(%Skill{} = s) do
    %{
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category,
      trigger_rules: s.trigger_rules,
      enabled: s.enabled,
      workspace_id: s.workspace_id,
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
