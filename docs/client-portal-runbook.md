# Client Portal Runbook

Internal runbook for the NULLHACK team. Covers portal administration, engagement management, and troubleshooting.


## 1. How to Update Engagement Status

Via the admin dashboard:
1. Log in as an admin or member.
2. Navigate to Engagements in the sidebar.
3. Click the engagement to update.
4. Click Update Status and select the new status, then Save.

Via the API: PATCH /api/v1/engagements/:id/status with body {"status": "in_progress"}

Valid values: pending, scoping, in_progress, reporting, delivered, closed.

Error responses: 422 validation_failed (bad status), 422 missing_param (field absent), 404 not_found (unknown ID).

## 2. How to Upload Reports

Steps:
1. Navigate to Reports in the sidebar.
2. Click New Report and fill in Name, Report Type, and Config.
3. Click Create Report.
4. On the report detail page click Generate to populate the cached result.
5. The client can now download it from their portal.

Via the API:
    POST /api/v1/reports {"name": "...", "report_type": "task_summary", "config": {}}
    POST /api/v1/reports/:id/generate
    GET /api/v1/reports/:id/export?format=csv

Formats: csv, json, pdf, table.


## 3. How to Invite New Clients

Steps:
1. Navigate to Invitations in the admin panel.
2. Click Send Invitation.
3. Enter the client email, select a role (member or viewer), and select the organization.
4. Click Send. The client receives an acceptance link valid for 7 days.

To resend an expired invitation: find it in the list and click Resend.

Via the API: POST /api/v1/invitations {"email": "...", "role": "member", "organization_id": "<uuid>"}

## 4. Common Troubleshooting

Engagement does not appear in client dashboard:
Cause: client user not linked to the engagement workspace.
Fix: Check user_workspace_ids for the client user. Add user to the workspace if missing.

Status update returns 422:
Cause: invalid status value or status field missing.
Fix: Use one of the valid statuses listed in Section 1.

Report export returns empty CSV:
Cause: report not generated yet (last_generated_at is null).
Fix: Call POST /api/v1/reports/:id/generate first.

Invitation link expired:
Cause: invitations expire after 7 days.
Fix: Resend the invitation from the admin panel.

Invitation accept returns 500:
Cause: database error, often duplicate membership.
Fix: Check server logs via GET /api/v1/logs. Confirm via GET /api/v1/organizations/:id/members.

Auth returns 401 on all API calls:
Cause: JWT token expired.
Fix: Re-authenticate via POST /api/v1/auth/login.


## 5. API Quick Reference

List engagements:  GET  /api/v1/engagements
Get engagement:    GET  /api/v1/engagements/:id
Create engagement: POST /api/v1/engagements
Update status:     PATCH /api/v1/engagements/:id/status
List reports:      GET  /api/v1/reports
Create report:     POST /api/v1/reports
Generate report:   POST /api/v1/reports/:id/generate
Download report:   GET  /api/v1/reports/:id/export
Send invitation:   POST /api/v1/invitations
Accept invitation: POST /api/v1/invitations/:token/accept
