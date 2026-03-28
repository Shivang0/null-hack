defmodule Canopy.EventBus do
  @moduledoc "Internal event bus using Phoenix.PubSub."

  @pubsub Canopy.PubSub

  def broadcast(topic, event) do
    Phoenix.PubSub.broadcast(@pubsub, topic, event)
  end

  def broadcast!(topic, event) do
    Phoenix.PubSub.broadcast!(@pubsub, topic, event)
  end

  def subscribe(topic) do
    Phoenix.PubSub.subscribe(@pubsub, topic)
  end

  def unsubscribe(topic) do
    Phoenix.PubSub.unsubscribe(@pubsub, topic)
  end

  # Convenience topic builders
  def workspace_topic(workspace_id), do: "workspace:#{workspace_id}"
  def agent_topic(agent_id), do: "agent:#{agent_id}"
  def session_topic(session_id), do: "session:#{session_id}"
  def organization_topic(org_id), do: "organization:#{org_id}"
  def division_topic(div_id), do: "division:#{div_id}"
  def department_topic(dept_id), do: "department:#{dept_id}"
  def team_topic(team_id), do: "team:#{team_id}"
  def activity_topic, do: "activity:global"
  def logs_topic, do: "logs:global"
  def notifications_topic(workspace_id), do: "notifications:#{workspace_id}"
  def workflow_topic(workflow_id), do: "workflow:#{workflow_id}"
  def workflow_run_topic(run_id), do: "workflow_run:#{run_id}"
end
