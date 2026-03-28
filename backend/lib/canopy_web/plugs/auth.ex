defmodule CanopyWeb.Plugs.Auth do
  @moduledoc "JWT authentication plug — bypassed for development (assigns default dev user)."
  import Plug.Conn

  alias Canopy.Repo
  alias Canopy.Schemas.User

  def init(opts), do: opts

  def call(conn, _opts) do
    # Dev bypass: always assign the first admin user (seeded as admin@canopy.dev)
    user =
      case Repo.get_by(User, email: "admin@canopy.dev") do
        %User{} = u -> u
        nil ->
          # Fallback: grab any user in the database
          Repo.one(User) || create_dev_user()
      end

    conn
    |> assign(:current_user, user)
    |> assign(:claims, %{"sub" => user.id})
  end

  defp create_dev_user do
    {:ok, user} =
      %User{}
      |> User.changeset(%{
        name: "Dev User",
        email: "admin@canopy.dev",
        password: "canopy123",
        role: "admin"
      })
      |> Repo.insert()

    user
  end
end
