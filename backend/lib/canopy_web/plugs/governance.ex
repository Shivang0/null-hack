defmodule CanopyWeb.Plugs.Governance do
  @moduledoc "Governance plug — bypassed for development (always allows all actions)."

  def init(opts), do: opts

  def call(conn, _opts), do: conn
end
