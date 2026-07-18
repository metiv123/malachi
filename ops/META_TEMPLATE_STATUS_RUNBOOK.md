# Malachi Meta Template Status Runbook

Purpose: make future checks reliable without storing or exposing Meta access tokens.

## What happened on 2026-07-16

A cron task checked template approvals using a protected Render endpoint:

- `GET https://malachi-v78v.onrender.com/api/meta/templates/connection?token=<secret>`

The cron injected the full URL as an environment variable named `MALACHI_META_URL`, then ran a small Python request against that URL.
The result at 2026-07-16 13:05 UTC was:

- `daily_connection_check_he` — PENDING / MARKETING
- `daily_warm_connection_he` — PENDING / UTILITY
- `daily_family_connection_he` — PENDING / UTILITY
- `family_greeting_message_he` — PENDING / MARKETING
- `family_connection_update_he` — PENDING / UTILITY
- Existing baseline templates still approved: `daily_check_he`, `no_response_alert_he`

## What was lost

The underlying Render endpoint still exists, but it returns `403 Forbidden` without the secret `token` query parameter.
The token was intentionally not written to memory, source files, or public logs. The old cron run transcript redacted it, and deleted one-shot cron jobs do not expose it again.

So future Shiri can remember *the method*, but not the secret itself.

## How to avoid this next time

Use one of these durable approaches:

1. Preferred: store the endpoint token as a real OpenClaw/Gateway secret or a Render env var accessible via a safe internal endpoint name, not inside chat text.
2. Keep a persistent disabled cron named `Malachi Meta template status checker` that contains the check method but references a secret/env var, not a raw token.
3. Add a safe server endpoint that reports only template status and category, protected by an internal token, and document exactly where the token is stored.
4. After every successful check, write the timestamp, route used, and non-secret status summary into `memory/YYYY-MM-DD.md` and this runbook.

## Current blocker

To check live template status again, Shiri needs either:

- the protected endpoint token for `/api/meta/templates/connection`, or
- Meta Graph access token, or
- browser login to Meta Business tools.

Never paste or store the actual token in this file.
