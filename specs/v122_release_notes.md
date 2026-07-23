# מלאכי V122 - Hodaya Event-Driven Trigger Guards

## Summary
Adds a fail-closed event-driven trigger layer for Hodaya's isolated Meta WhatsApp agent.

## What changed
- Hodaya text messages are now correctly classified as `hodaya_agent_message_received`.
- Hodaya window-opening buttons like `daily_ok` / “אני בסדר” still open the 24h service window.
- Added optional event-driven hook support:
  - `HODAYA_AGENT_EVENT_DRIVEN=true`
  - `HODAYA_AGENT_EVENT_HOOK_URL`
  - `HODAYA_AGENT_EVENT_HOOK_TOKEN`
  - `HODAYA_AGENT_EVENT_DEBOUNCE_MS` default 10000
  - `HODAYA_AGENT_EVENT_RATE_LIMIT_MS` default 15000
- Added admin endpoint:
  - `POST /api/admin/hodaya-agent/event-trigger`

## Safety
- Fail-closed: if event-driven is disabled or hook URL/token are missing, nothing external is triggered.
- Only Hodaya allowlisted messages can trigger this path.
- Only actionable text messages trigger event-driven handling; button clicks/status updates do not.
- Existing Malachi family/elder inbound storage remains bypassed for Hodaya.
- Event-driven prompt hard-restricts the agent to Hodaya admin endpoints only.
- Existing 1-minute monitor remains the fallback.

## Important deployment note
V122 prepares the Render/Malachi side. Full instant replies still require a secure reachable OpenClaw `/hooks/agent` URL and hook token. Until those env vars are configured, the system remains safe and uses the existing polling fallback.
