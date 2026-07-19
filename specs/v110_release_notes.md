# V110 - WhatsApp inbound message capture

## Summary
V110 adds persistent capture of incoming WhatsApp webhook messages so free-text messages that are not mapped to an existing Malachi flow are no longer lost in audit summaries.

## Changes
- Added `inboundMessages` to the normalized runtime DB schema.
- `processWhatsAppWebhookPayload()` now stores every handled inbound text/button event with:
  - sender phone number
  - last 4 digits
  - WhatsApp message id
  - text or button title/id
  - mapped intent
  - processing status
  - received timestamp
- Added admin-protected endpoint:
  - `GET /api/inbound-messages?adminToken=...&limit=100`
- Kept `/api/inbound-messages` protected by the same admin token as other admin APIs.

## Verification
- `npm test` passed.
- `node src/check-project-consistency.js` passed before version bump.

## Notes
This release prepares the production monitoring loop that notifies Shiri/Metiv when users send free-form WhatsApp messages to the Malachi Cloud API number.
