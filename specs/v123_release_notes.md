# מלאכי V123 - Faster Hodaya Replies + Typing Indicator

## Summary
Improves perceived responsiveness for Hodaya's isolated WhatsApp agent.

## Changes
- Adds Meta WhatsApp typing/read indicator for actionable Hodaya text messages.
- Typing indicator is sent immediately when the webhook receives Hodaya's text, before the agent reply is generated.
- Reduces default Hodaya event-driven debounce from 10 seconds to 1.5 seconds.
- Keeps rate limiting in place to avoid reply storms.

## Safety
- Typing indicator runs only for:
  - Hodaya allowlisted sender.
  - Isolated Hodaya route.
  - Real text messages, not buttons or delivery statuses.
  - Meta provider only.
- Failure to send typing indicator is best-effort and does not break the webhook.
- Malachi family/elder routing remains unchanged.
