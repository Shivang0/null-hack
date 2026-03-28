defmodule CanopyWeb.Portal.EngagementControllerTest do
  use CanopyWeb.ConnCase

  import Canopy.TestHelpers

  describe "GET /engagements" do
    test "requires authentication", %{conn: conn} do
      conn = get(conn, "/api/v1/engagements")
      assert conn.status == 401
    end

    test "returns empty list when no engagements exist", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = get(conn, "/api/v1/engagements")
      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)
      assert body["engagements"] == []
      assert body["count"] == 0
    end

    test "returns engagements for the users workspaces", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      insert_engagement(workspace, %{client_name: "ACME Corp", engagement_type: "pentest"})
      insert_engagement(workspace, %{client_name: "Beta Ltd", engagement_type: "audit"})
      conn = authenticated_conn(conn, user)
      conn = get(conn, "/api/v1/engagements")
      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)
      assert body["count"] == 2
      names = Enum.map(body["engagements"], & &1["client_name"])
      assert "ACME Corp" in names
      assert "Beta Ltd" in names
    end

    test "filters engagements by status", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      insert_engagement(workspace, %{client_name: "Pending Co", engagement_type: "pentest", status: "pending"})
      insert_engagement(workspace, %{client_name: "Active Co", engagement_type: "audit", status: "in_progress"})
      conn = authenticated_conn(conn, user)
      conn = get(conn, "/api/v1/engagements?status=pending")
      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)
      assert body["count"] == 1
      assert hd(body["engagements"])["client_name"] == "Pending Co"
    end
  end
  describe "GET /engagements/:id" do
    test "returns the engagement", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      engagement = insert_engagement(workspace, %{client_name: "Delta Inc", client_email: "delta@example.com", engagement_type: "compliance", scope: "SOC 2 Type II"})
      conn = authenticated_conn(conn, user)
      conn = get(conn, "/api/v1/engagements/#{engagement.id}")
      assert conn.status == 200
      body = Jason.decode!(conn.resp_body)
      assert body["engagement"]["client_name"] == "Delta Inc"
      assert body["engagement"]["status"] == "pending"
    end

    test "returns 404 for missing engagement", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = get(conn, "/api/v1/engagements/00000000-0000-0000-0000-000000000000")
      assert conn.status == 404
      assert Jason.decode!(conn.resp_body)["error"] == "not_found"
    end

    test "requires authentication", %{conn: conn} do
      conn = get(conn, "/api/v1/engagements/00000000-0000-0000-0000-000000000000")
      assert conn.status == 401
    end
  end
  describe "POST /engagements" do
    test "creates a new engagement (intake form happy path)", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/engagements", %{client_name: "Gamma Secure", client_email: "security@gamma.com", engagement_type: "pentest", scope: "External network", workspace_id: workspace.id})
      assert conn.status == 201
      body = Jason.decode!(conn.resp_body)
      assert body["engagement"]["client_name"] == "Gamma Secure"
      assert body["engagement"]["status"] == "pending"
      refute is_nil(body["engagement"]["id"])
    end

    test "returns 422 when client_name is missing", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/engagements", %{engagement_type: "pentest", workspace_id: workspace.id})
      assert conn.status == 422
      body = Jason.decode!(conn.resp_body)
      assert body["error"] == "validation_failed"
      assert Map.has_key?(body["details"], "client_name")
    end

    test "returns 422 for invalid engagement_type", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/engagements", %{client_name: "Test Corp", engagement_type: "invalid_type", workspace_id: workspace.id})
      assert conn.status == 422
      body = Jason.decode!(conn.resp_body)
      assert body["error"] == "validation_failed"
      assert Map.has_key?(body["details"], "engagement_type")
    end

    test "returns 422 for malformed client_email", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/engagements", %{client_name: "Test Corp", client_email: "not-an-email", engagement_type: "audit", workspace_id: workspace.id})
      assert conn.status == 422
      body = Jason.decode!(conn.resp_body)
      assert body["error"] == "validation_failed"
      assert Map.has_key?(body["details"], "client_email")
    end

    test "requires authentication", %{conn: conn} do
      conn = post(conn, "/api/v1/engagements", %{client_name: "Test", engagement_type: "pentest"})
      assert conn.status == 401
    end
  end
  describe "PATCH /engagements/:id/status" do
    test "advances engagement through the full status lifecycle", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      engagement = insert_engagement(workspace, %{engagement_type: "pentest"})
      conn = authenticated_conn(conn, user)
      for {new_status, expected} <- [{"scoping","scoping"},{"in_progress","in_progress"},{"reporting","reporting"},{"delivered","delivered"},{"closed","closed"}] do
        rc = patch(conn, "/api/v1/engagements/#{engagement.id}/status", %{status: new_status})
        assert rc.status == 200
        assert Jason.decode!(rc.resp_body)["engagement"]["status"] == expected
      end
    end

    test "returns 422 for invalid status value", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      engagement = insert_engagement(workspace, %{engagement_type: "pentest"})
      conn = authenticated_conn(conn, user)
      conn = patch(conn, "/api/v1/engagements/#{engagement.id}/status", %{status: "hacked"})
      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["error"] == "validation_failed"
    end

    test "returns 422 when status param is missing", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      engagement = insert_engagement(workspace, %{engagement_type: "pentest"})
      conn = authenticated_conn(conn, user)
      conn = patch(conn, "/api/v1/engagements/#{engagement.id}/status", %{})
      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["error"] == "missing_param"
    end

    test "returns 404 for non-existent engagement", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = patch(conn, "/api/v1/engagements/00000000-0000-0000-0000-000000000000/status", %{status: "in_progress"})
      assert conn.status == 404
      assert Jason.decode!(conn.resp_body)["error"] == "not_found"
    end
  end
  describe "Reports: generate and export" do
    test "generates a report and exports as CSV", %{conn: conn} do
      user = insert_user()
      workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      c2 = post(conn, "/api/v1/reports", %{name: "Pentest Report", report_type: "task_summary", config: %{}, workspace_id: workspace.id})
      assert c2.status == 201
      rpt = Jason.decode!(c2.resp_body)["report"]
      gen = post(conn, "/api/v1/reports/" <> rpt["id"] <> "/generate")
      assert gen.status == 200
      generated = Jason.decode!(gen.resp_body)
      assert generated["generated"] == true
      refute is_nil(generated["report"]["last_generated_at"])
      exp = get(conn, "/api/v1/reports/" <> rpt["id"] <> "/export?format=csv")
      assert exp.status == 200
      [ct | _] = get_resp_header(exp, "content-type")
      assert ct =~ "text/csv"
    end

    test "returns 404 when generating a missing report", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/reports/00000000-0000-0000-0000-000000000000/generate")
      assert conn.status == 404
      assert Jason.decode!(conn.resp_body)["error"] == "not_found"
    end

    test "returns 422 when creating report without required fields", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/reports", %{description: "missing name and type"})
      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["error"] == "validation_failed"
    end
  end
  describe "Invitations: onboarding flow" do
    test "creates an invitation and client accepts it", %{conn: conn} do
      user = insert_user()
      org = insert_organization()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      inv_conn = post(conn, "/api/v1/invitations", %{email: "newclient@example.com", role: "member", organization_id: org.id})
      assert inv_conn.status == 201
      invitation = Jason.decode!(inv_conn.resp_body)["invitation"]
      token = invitation["token"]
      refute is_nil(token)
      client = insert_user(%{email: "newclient@example.com"})
      accept_path = "/api/v1/invitations/" <> token <> "/accept"
      acc_conn = conn |> authenticated_conn(client) |> post(accept_path)
      assert acc_conn.status == 200
      result = Jason.decode!(acc_conn.resp_body)
      assert result["ok"] == true
      assert result["organization_id"] == org.id
    end
    test "returns 404 for invalid invitation token", %{conn: conn} do
      user = insert_user()
      _workspace = insert_workspace(user)
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/invitations/nonexistenttoken/accept")
      assert conn.status == 404
      assert Jason.decode!(conn.resp_body)["error"] == "not_found"
    end

    test "returns 422 when invitation email is missing", %{conn: conn} do
      user = insert_user()
      org = insert_organization()
      conn = authenticated_conn(conn, user)
      conn = post(conn, "/api/v1/invitations", %{role: "member", organization_id: org.id})
      assert conn.status == 422
      assert Jason.decode!(conn.resp_body)["error"] == "validation_failed"
    end
  end
end
