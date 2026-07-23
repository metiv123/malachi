# מלאכי V124 - Hodaya Instant Acknowledgement

## Summary
Adds an immediate lightweight acknowledgement for Hodaya so the conversation feels responsive even when the agent model takes longer to produce the real answer.

## Changes
- Sends `קיבלתי, אני איתך 🌸` immediately for actionable Hodaya text messages.
- Stores that message as `hodaya_agent_fast_ack`, separate from real Shiri replies.
- Event-driven prompt explicitly ignores `hodaya_agent_fast_ack` so the agent still sends the real answer afterward.
- Fast ack is rate-limited by `HODAYA_AGENT_FAST_ACK_MIN_GAP_MS` default 15000.

## Safety
- Only for Hodaya allowlisted sender.
- Only in the isolated `hodayaAgent` path.
- Only when Meta provider and 24h service window are active.
- Does not write to general Malachi outbound/inbound messages.
