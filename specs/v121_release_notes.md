# מלאכי V121 - Hodaya Agent Reply Bridge

## Summary
Adds the missing isolated reply bridge so Hodaya can actually receive free-form Shiri replies through the Meta WhatsApp number during an open 24h service window.

## Added
- `GET /api/admin/hodaya-agent/messages`
  - Lists isolated Hodaya inbound/outbound messages only.
- `POST /api/admin/hodaya-agent/reply`
  - Sends a free-form Meta WhatsApp text reply only if Hodaya is inside the 24h service window.
  - Stores outbound reply only under `db.hodayaAgent.outboundMessages`.
  - Does not write Hodaya replies into general Malachi outbound messages.

## Safety
- Hodaya Agent still requires explicit env allowlist:
  - `HODAYA_AGENT_ENABLED=true`
  - `HODAYA_AGENT_PHONE=<authorized Hodaya phone>`
- Replies fail closed outside the WhatsApp 24h service window.
- Selftest verifies:
  - Hodaya click remains isolated.
  - Malachi elder check is not closed by Hodaya “אני בסדר”.
  - Hodaya reply can be sent in mock mode.
  - Hodaya reply does not enter general `db.outboundMessages`.

## Live intent
This release is intended to run with the already configured Hodaya allowlist and the temporary existing `daily_check_he` template until Meta approves `hodaya_agent_window_open_he`.
