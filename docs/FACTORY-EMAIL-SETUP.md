# MMW-ORDER — factory email setup

## Goal

Before touching production, verify the complete customer-email pipeline in the factory branch:

1. order is created and saved;
2. PDF is generated in memory;
3. Resend accepts the admin email with the PDF;
4. Resend accepts the customer email with the same PDF;
5. the API returns explicit notification status and errors;
6. no API key or internal access token is exposed to the browser.

## Environment variables

Set these only in the runtime environment (local/Render), never in GitHub source:

- `RESEND_API_KEY` — Resend API key with permission to send mail;
- `RESEND_FROM` — sender in the form `MMW-ORDER <orders@your-verified-domain.com>`;
- `ADMIN_EMAIL` — internal recipient for new-order notifications;
- `ADMIN_KEY` — protects `/api/admin/*` diagnostics and journal endpoints;
- `PUBLIC_BASE_URL` — factory URL while testing.

The repository contains `.env.example` as a template. Real secrets must not be committed.

## Factory verification

### 1. Health

Open:

`/api/health`

Expected:

- `ok: true`
- `email: true`

The endpoint exposes only boolean configuration state; it does not expose the API key.

### 2. Admin notification test

Call `POST /api/admin/test-notifications` with the configured `ADMIN_KEY`.

Expected result:

- `notifications.email: true`
- an `emailId` is returned;
- no `emailError` is returned.

### 3. Real customer order test

Create one factory order using a test mailbox that you control.

Expected result in the API response:

- `notifications.customerEmail: true`
- `notifications.pdf: true`
- `notifications.pdfAttachedToCustomer: true`
- `notifications.customerEmailId` contains a Resend email ID;
- `notifications.customerEmailError` is `null`.

The admin side should simultaneously report:

- `notifications.email: true`
- `notifications.pdfAttachedToAdmin: true`
- `notifications.emailId` contains a Resend email ID.

## If delivery fails

Use the returned `customerEmailError` / `emailError` first. Do not guess or silently retry.

Then inspect Resend email logs for the returned email ID. Resend provides API-call and email-event visibility in its dashboard.

## Production gate

Production is **not** changed until the factory test passes end-to-end.

Only after the factory is verified should the same environment configuration be entered into the production service and one controlled production order be tested.
