// Full DDL for OpenSpectrum — 20 tables across 6 domains
// Note: voice_logs and observations have a circular FK reference.
// We defer FK checks during schema creation to handle this.

export const SCHEMA_SQL = `
-- ============================================================
-- Domain 1: Identity & Access
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                TEXT PRIMARY KEY,
    email             TEXT UNIQUE,
    display_name      TEXT NOT NULL,
    user_type         TEXT NOT NULL DEFAULT 'parent'
                      CHECK(user_type IN ('parent','grandparent','caregiver','therapist','doctor','teacher','other')),
    avatar_url        TEXT,
    auth_provider_id  TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider_id) WHERE auth_provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS families (
    id                TEXT PRIMARY KEY,
    family_name       TEXT NOT NULL,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS family_members (
    id                TEXT PRIMARY KEY,
    family_id         TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
    joined_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1,
    UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fm_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_fm_user ON family_members(user_id);

CREATE TABLE IF NOT EXISTS family_invites (
    id                TEXT PRIMARY KEY,
    family_id         TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    invited_by        TEXT NOT NULL REFERENCES users(id),
    invite_token      TEXT NOT NULL UNIQUE,
    role              TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
    expires_at        TEXT NOT NULL,
    accepted_at       TEXT,
    accepted_by       TEXT REFERENCES users(id),
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON family_invites(invite_token);

-- ============================================================
-- Domain 2: Child Profiles & Tags
-- ============================================================

CREATE TABLE IF NOT EXISTS children (
    id                TEXT PRIMARY KEY,
    family_id         TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    display_name      TEXT NOT NULL,
    birth_year_month  TEXT,
    avatar_url        TEXT,
    profile_notes     TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);

CREATE TABLE IF NOT EXISTS tag_definitions (
    id                TEXT PRIMARY KEY,
    category          TEXT NOT NULL
                      CHECK(category IN ('behavior','food','medication','emotion','sleep','sensory','transitions','successes','trigger','other')),
    name              TEXT NOT NULL,
    is_system         INTEGER NOT NULL DEFAULT 1,
    child_id          TEXT REFERENCES children(id) ON DELETE CASCADE,
    family_id         TEXT REFERENCES families(id) ON DELETE CASCADE,
    display_order     INTEGER DEFAULT 0,
    color             TEXT,
    icon              TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1,
    UNIQUE(category, name, child_id)
);

CREATE INDEX IF NOT EXISTS idx_tags_category ON tag_definitions(category);
CREATE INDEX IF NOT EXISTS idx_tags_child ON tag_definitions(child_id) WHERE child_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS child_tags (
    id                TEXT PRIMARY KEY,
    child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    tag_id            TEXT NOT NULL REFERENCES tag_definitions(id) ON DELETE CASCADE,
    is_enabled        INTEGER NOT NULL DEFAULT 1,
    display_order     INTEGER DEFAULT 0,
    UNIQUE(child_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_child_tags_child ON child_tags(child_id);

-- ============================================================
-- Domain 3: Observations & Logging
-- ============================================================
-- Note: observations.voice_log_id FK is omitted here to avoid
-- circular dependency with voice_logs. The relationship is
-- maintained at the application level.

CREATE TABLE IF NOT EXISTS observations (
    id                    TEXT PRIMARY KEY,
    child_id              TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_by            TEXT REFERENCES users(id),
    occurred_at           TEXT NOT NULL,
    entry_type            TEXT NOT NULL
                          CHECK(entry_type IN ('quick_tap','incident','voice','lock_screen','manual')),
    category              TEXT NOT NULL
                          CHECK(category IN ('behavior','food','medication','emotion','sleep','sensory','transitions','successes','milestone','other')),
    title                 TEXT,
    notes                 TEXT,
    incident_data         TEXT,
    visibility_level      TEXT NOT NULL DEFAULT 'family'
                          CHECK(visibility_level IN ('family','parents','clinical','private','custom')),
    is_partial            INTEGER NOT NULL DEFAULT 0,
    voice_log_id          TEXT,
    parent_observation_id TEXT REFERENCES observations(id),
    created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted            INTEGER NOT NULL DEFAULT 0,
    sync_status           TEXT NOT NULL DEFAULT 'pending'
                          CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at        TEXT,
    device_id             TEXT,
    version               INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_obs_child_occurred ON observations(child_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_obs_child_category ON observations(child_id, category);
CREATE INDEX IF NOT EXISTS idx_obs_entry_type ON observations(entry_type);
CREATE INDEX IF NOT EXISTS idx_obs_created_by ON observations(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obs_voice_log ON observations(voice_log_id) WHERE voice_log_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obs_parent ON observations(parent_observation_id) WHERE parent_observation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obs_visibility ON observations(visibility_level);

CREATE TABLE IF NOT EXISTS observation_tags (
    observation_id    TEXT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    tag_id            TEXT NOT NULL REFERENCES tag_definitions(id) ON DELETE CASCADE,
    PRIMARY KEY(observation_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_obs_tags_tag ON observation_tags(tag_id);

CREATE TABLE IF NOT EXISTS voice_logs (
    id                TEXT PRIMARY KEY,
    observation_id    TEXT NOT NULL UNIQUE REFERENCES observations(id) ON DELETE CASCADE,
    audio_file_path   TEXT,
    audio_duration_secs INTEGER,
    raw_transcript    TEXT,
    edited_transcript TEXT,
    ai_parse_status   TEXT NOT NULL DEFAULT 'pending'
                      CHECK(ai_parse_status IN ('pending','processing','completed','failed','skipped')),
    ai_parsed_at      TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_vl_observation ON voice_logs(observation_id);
CREATE INDEX IF NOT EXISTS idx_vl_parse_status ON voice_logs(ai_parse_status);

CREATE TABLE IF NOT EXISTS ai_extracted_events (
    id                TEXT PRIMARY KEY,
    voice_log_id      TEXT NOT NULL REFERENCES voice_logs(id) ON DELETE CASCADE,
    observation_id    TEXT REFERENCES observations(id),
    extracted_category TEXT NOT NULL,
    extracted_value   TEXT NOT NULL,
    confidence        REAL,
    user_action       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(user_action IN ('pending','confirmed','edited','deleted')),
    user_edited_value TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aie_voice_log ON ai_extracted_events(voice_log_id);

CREATE TABLE IF NOT EXISTS observation_access (
    id                TEXT PRIMARY KEY,
    observation_id    TEXT NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(observation_id, user_id)
);

-- ============================================================
-- Domain 4: Medications
-- ============================================================

CREATE TABLE IF NOT EXISTS medication_templates (
    id                TEXT PRIMARY KEY,
    child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    dose              TEXT,
    schedule          TEXT,
    schedule_times    TEXT,
    notes             TEXT,
    is_active         INTEGER NOT NULL DEFAULT 1,
    started_at        TEXT,
    ended_at          TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_medtpl_child ON medication_templates(child_id);
CREATE INDEX IF NOT EXISTS idx_medtpl_active ON medication_templates(child_id, is_active);

CREATE TABLE IF NOT EXISTS medication_events (
    id                TEXT PRIMARY KEY,
    medication_id     TEXT NOT NULL REFERENCES medication_templates(id) ON DELETE CASCADE,
    child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    observation_id    TEXT REFERENCES observations(id),
    status            TEXT NOT NULL CHECK(status IN ('taken','missed','skipped','side_effect')),
    taken_at          TEXT NOT NULL,
    dose_override     TEXT,
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_medevt_child_taken ON medication_events(child_id, taken_at);
CREATE INDEX IF NOT EXISTS idx_medevt_medication ON medication_events(medication_id);
CREATE INDEX IF NOT EXISTS idx_medevt_status ON medication_events(status);

-- ============================================================
-- Domain 5: Reflections, Reminders, Reports
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_reflections (
    id                TEXT PRIMARY KEY,
    child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_by        TEXT REFERENCES users(id),
    reflection_date   TEXT NOT NULL,
    rating            TEXT NOT NULL CHECK(rating IN ('better_than_usual','typical','difficult')),
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1,
    UNIQUE(child_id, reflection_date)
);

CREATE INDEX IF NOT EXISTS idx_dr_child_date ON daily_reflections(child_id, reflection_date);

CREATE TABLE IF NOT EXISTS reminders (
    id                    TEXT PRIMARY KEY,
    child_id              TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_by            TEXT REFERENCES users(id),
    source_observation_id TEXT REFERENCES observations(id),
    reminder_type         TEXT NOT NULL CHECK(reminder_type IN ('follow_up','scheduled','medication')),
    title                 TEXT NOT NULL,
    scheduled_at          TEXT NOT NULL,
    repeat_rule           TEXT,
    is_completed          INTEGER NOT NULL DEFAULT 0,
    completed_at          TEXT,
    is_active             INTEGER NOT NULL DEFAULT 1,
    created_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted            INTEGER NOT NULL DEFAULT 0,
    sync_status           TEXT NOT NULL DEFAULT 'pending'
                          CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at        TEXT,
    device_id             TEXT,
    version               INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rem_child_scheduled ON reminders(child_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_rem_active ON reminders(is_active, scheduled_at) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_rem_source ON reminders(source_observation_id) WHERE source_observation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS reports (
    id                TEXT PRIMARY KEY,
    child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    created_by        TEXT REFERENCES users(id),
    title             TEXT NOT NULL,
    date_range_start  TEXT NOT NULL,
    date_range_end    TEXT NOT NULL,
    category_filters  TEXT,
    report_format     TEXT NOT NULL DEFAULT 'pdf' CHECK(report_format IN ('pdf','csv','json')),
    file_path         TEXT,
    cloud_url         TEXT,
    generated_at      TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        INTEGER NOT NULL DEFAULT 0,
    sync_status       TEXT NOT NULL DEFAULT 'pending'
                      CHECK(sync_status IN ('pending','synced','conflict')),
    last_synced_at    TEXT,
    device_id         TEXT,
    version           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_reports_child ON reports(child_id);

CREATE TABLE IF NOT EXISTS report_shares (
    id                TEXT PRIMARY KEY,
    report_id         TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    share_token       TEXT NOT NULL UNIQUE,
    expires_at        TEXT NOT NULL,
    access_count      INTEGER NOT NULL DEFAULT 0,
    max_accesses      INTEGER,
    is_revoked        INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rs_token ON report_shares(share_token);

-- ============================================================
-- Domain 6: System (local-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS consent_log (
    id                TEXT PRIMARY KEY,
    child_id          TEXT REFERENCES children(id) ON DELETE CASCADE,
    user_id           TEXT REFERENCES users(id),
    setting           TEXT NOT NULL,
    value             TEXT NOT NULL,
    context           TEXT,
    recorded_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_id         TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_child_setting ON consent_log(child_id, setting);

CREATE TABLE IF NOT EXISTS sync_queue (
    id                TEXT PRIMARY KEY,
    table_name        TEXT NOT NULL,
    record_id         TEXT NOT NULL,
    operation         TEXT NOT NULL CHECK(operation IN ('insert','update','delete')),
    payload           TEXT,
    retry_count       INTEGER NOT NULL DEFAULT 0,
    last_error        TEXT,
    created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sq_pending ON sync_queue(processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sq_table_record ON sync_queue(table_name, record_id);
`;
