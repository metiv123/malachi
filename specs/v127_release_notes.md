# V127 Release Notes — Hodaya reply latency + token control

Date: 2026-07-26

## Problem
- Hodaya received an automatic `קיבלתי, אני איתך 🌸` fast ACK on many free-text messages.
- This felt robotic and did not provide a real conversational answer.
- Complex replies could take close to a minute or more because they went through the event-driven isolated agent path.
- Live Render env still had older values (`HODAYA_AGENT_FAST_ACK=true`, debounce/rate-limit overrides), so code defaults alone were not enough.

## Fix
- Disabled fast ACK unless explicitly set to the non-default sentinel `HODAYA_AGENT_FAST_ACK=force_true`.
- Changed Render blueprint value to `HODAYA_AGENT_FAST_ACK=false`.
- Capped Hodaya event-driven debounce to max 300ms even if an old env value exists.
- Capped Hodaya event-driven rate limit to max 1000ms even if an old env value exists.
- Reduced event hook payload cost:
  - shorter prompt
  - `thinking: low`
  - `lightContext: true`
  - timeout reduced from 120s to 45s
- Added local quick replies for simple low-value messages like greetings and thanks, avoiding model use for those.

## Verification
- Local selftest passed.
- Deployed commits:
  - `cbbefe1` Fix Hodaya reply latency and disable fast ack
  - `3148dc4` Cap Hodaya event trigger delays
- Live verification after deploy:
  - `fastAckEnabled=false`
  - `debounceMs=300`
  - `rateLimitMs=1000`

## Remaining note
- A genuinely complex reply still depends on the isolated OpenClaw event hook and can be slower than an in-process rule-based reply. The next optimization should measure hook start-to-reply latency and consider a lighter dedicated reply endpoint/agent path if needed.
