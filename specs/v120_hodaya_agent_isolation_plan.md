# V120 — Hodaya Agent Isolation Layer (Local POC)

## Goal
Add a safe, isolated infrastructure layer that can later allow Hodaya to use the existing Meta WhatsApp Business number as a personal super-agent channel, without risking Malachi's core elder/family flows.

## Non-negotiable safety rule
Malachi is the primary asset. Hodaya-agent messages must never be treated as elder responses, family contact messages, beta leads, or general Malachi inbound messages.

## Design

### 1. Feature flag off by default
The Hodaya agent is disabled unless all are configured:

- `HODAYA_AGENT_ENABLED=true`
- `HODAYA_AGENT_PHONE=<authorized phone>`

Default state is safe: no behavior change for Malachi.

### 2. Early webhook router
`webhookProcessor.js` now routes messages from the configured Hodaya phone before Malachi elder/contact handling.

If sender matches Hodaya:

- record under `db.hodayaAgent.inboundMessages`
- update `db.hodayaAgent.state.serviceWindowUntil`
- write audit `hodaya_agent_webhook_routed`
- do **not** call `handleElderResponse`
- do **not** write into general `db.inboundMessages`

### 3. Existing template for experiment
For the experiment only, `prepareHodayaWindowOpenTemplate({ dryRun: true })` uses the existing approved `daily_check_he` template and the existing `daily_ok` / “אני בסדר” button.

This is only to test whether a template response opens a 24h service window safely.

### 4. Dedicated future template
Prepared Meta template:

- name: `hodaya_agent_window_open_he`
- language: `he`
- category: `UTILITY`
- button: `פתחי שיחה`
- button payload when sending: `hodaya_open`

Text:

> היי {{1}} 🌿  
> יש לי עדכון שביקשת לקבל. כדי לפתוח שיחה בוואטסאפ ולקבל את הפרטים, אפשר להשיב להודעה או ללחוץ על הכפתור למטה.

### 5. Separate admin endpoints
Added isolated admin endpoints:

- `GET /api/admin/hodaya-agent/status`
- `POST /api/admin/hodaya-agent/window-open`
- `POST /api/meta/templates/hodaya-agent`

These are separate from Malachi family, elder, inbound reply, and beta-update endpoints.

## Tests added
Selftest now verifies the critical crossing-risk scenario:

1. A Malachi elder check is open.
2. Hodaya sends/clicks “אני בסדר”.
3. The event routes to `hodayaAgent`.
4. It does not enter `db.inboundMessages`.
5. It does not close the elder check.
6. Hodaya status shows a 24h window opened.

## Deployment status
Local code only. Not deployed to Render. No live WhatsApp message sent. No Meta template submitted yet unless explicitly approved/executed after this POC.

## Meta submission result
The dedicated future template was submitted to Meta on 2026-07-23:

- `hodaya_agent_window_open_he`
- Status: `PENDING`
- Category: `UTILITY`
- ID: `1603992194626267`

Important: submission alone does not activate it. Runtime activation requires a future approved deploy/config step.
