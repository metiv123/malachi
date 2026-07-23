# V120 Release Notes — Hodaya Agent Isolation POC

## Summary
Added a disabled-by-default isolation layer for a future Hodaya personal WhatsApp super-agent over the existing Meta WhatsApp Business number, with explicit protections so Malachi flows remain untouched.

## Added
- `app/src/hodayaAgent.js`
  - allowlisted sender detection
  - isolated inbound storage under `db.hodayaAgent`
  - 24h service-window state tracking
  - dry-run preparation for window-opening template
- Webhook pre-router in `app/src/webhookProcessor.js`
  - Hodaya messages are routed before elder/contact handling
  - Hodaya messages are excluded from general Malachi inbound messages
- Config flags:
  - `HODAYA_AGENT_ENABLED`
  - `HODAYA_AGENT_PHONE`
  - `HODAYA_AGENT_DISPLAY_NAME`
  - `HODAYA_AGENT_WINDOW_TEMPLATE` / `META_TEMPLATE_HODAYA_WINDOW_OPEN`
- Admin endpoints:
  - `GET /api/admin/hodaya-agent/status`
  - `POST /api/admin/hodaya-agent/window-open`
  - `POST /api/meta/templates/hodaya-agent`
- Future Meta template helper:
  - `hodaya_agent_window_open_he`

## Safety
- Default behavior is off.
- Only the configured Hodaya phone can enter the agent route.
- Hodaya events do not call `handleElderResponse`.
- Hodaya events do not enter `db.inboundMessages`.
- Selftest covers the exact crossing-risk case: Hodaya presses “אני בסדר” while a Malachi elder check is open; the Malachi check remains open.

## Not done
- Not deployed.
- No live WhatsApp message sent.
- No live Meta template submission performed in this local POC step.

## Meta template submission
Submitted dedicated Hodaya template to Meta:

- `hodaya_agent_window_open_he`
- Status after submission: `PENDING`
- Category: `UTILITY`
- Language: `he`
- Meta template ID: `1603992194626267`

This submission does not change live Malachi routing or environment variables. The live system will not use it unless `HODAYA_AGENT_WINDOW_TEMPLATE` / `META_TEMPLATE_HODAYA_WINDOW_OPEN` is configured in a future approved deployment.
