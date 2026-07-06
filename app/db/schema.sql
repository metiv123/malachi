-- מלאכי Production DB schema - PostgreSQL compatible

CREATE TABLE families (
  id TEXT PRIMARY KEY,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT,
  management_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE elders (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  daily_check_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  opt_in_status TEXT NOT NULL DEFAULT 'pending',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  relationship TEXT,
  opt_in_status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE daily_checks (
  id TEXT PRIMARY KEY,
  elder_id TEXT NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  scheduled_local_date DATE,
  sent_at TIMESTAMPTZ,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  responded_at TIMESTAMPTZ,
  response_payload JSONB,
  alert_sent_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_elder_scheduled_day
ON daily_checks(elder_id, scheduled_local_date, source)
WHERE source = 'scheduled' AND scheduled_local_date IS NOT NULL;

CREATE INDEX idx_daily_checks_status_sent ON daily_checks(status, sent_at);
CREATE INDEX idx_elders_active_time ON elders(active, daily_check_time);

CREATE TABLE outbound_messages (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  body TEXT,
  buttons JSONB,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
