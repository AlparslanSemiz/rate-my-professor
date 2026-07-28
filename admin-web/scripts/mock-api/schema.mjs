export async function createSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS mock_users (
      id uuid PRIMARY KEY,
      username text NOT NULL,
      kit_email text NOT NULL UNIQUE,
      role text NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
      status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED')),
      joined timestamptz NOT NULL,
      last_online timestamptz NOT NULL,
      biography text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mock_tokens (
      value text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      revoked boolean NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS mock_login_codes (
      email text PRIMARY KEY,
      code text NOT NULL,
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_warnings (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      message text NOT NULL,
      created_at timestamptz NOT NULL,
      created_from uuid REFERENCES mock_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mock_comment_reports (
      id uuid PRIMARY KEY,
      comment_content text NOT NULL,
      post_context text NOT NULL,
      report_text text NOT NULL,
      reported_user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      reporter_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      reason text NOT NULL CHECK (
        reason IN (
          'SPAM',
          'INSULT',
          'HARASSMENT',
          'HATE_SPEECH',
          'PERSONAL_INFORMATION',
          'OFF_TOPIC',
          'INAPPROPRIATE_CONTENT',
          'OTHER'
        )
      ),
      status text NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN')),
      date timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_bug_reports (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL,
      severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status text NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN')),
      reporter_id uuid REFERENCES mock_users(id) ON DELETE SET NULL,
      reported_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_audit_logs (
      id uuid PRIMARY KEY,
      actor_type text NOT NULL CHECK (actor_type IN ('ADMIN', 'USER')),
      actor_id uuid,
      actor_name text NOT NULL,
      actor_email text NOT NULL,
      actor_role text NOT NULL,
      action text NOT NULL CHECK (
        action IN (
          'ADMIN_LOGIN',
          'ADMIN_LOGOUT',
          'USER_WARNING_CREATED',
          'USER_BLOCKED',
          'USER_UNBLOCKED',
          'USER_DELETED',
          'COMMENT_REPORT_STATUS_CHANGED',
          'BUG_REPORT_UPDATED'
        )
      ),
      target_type text,
      target_id text,
      target_label text,
      changes jsonb NOT NULL DEFAULT '{}'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_activity_logs (
      id uuid PRIMARY KEY,
      type text NOT NULL,
      actor_type text CHECK (actor_type IN ('ADMIN', 'USER')),
      actor_id uuid,
      actor_name text,
      actor_email text,
      actor_role text,
      target_type text,
      target_id text,
      target_label text,
      route text,
      method text,
      ip text,
      user_agent text,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      outcome text NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED')),
      created_at timestamptz NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mock_audit_logs_created_at_id_idx
      ON mock_audit_logs (created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_actor_id_idx
      ON mock_audit_logs (actor_id);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_action_idx
      ON mock_audit_logs (action);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_target_type_idx
      ON mock_audit_logs (target_type);

    CREATE INDEX IF NOT EXISTS mock_activity_logs_created_at_id_idx
      ON mock_activity_logs (created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS mock_activity_logs_actor_id_idx
      ON mock_activity_logs (actor_id);
    CREATE INDEX IF NOT EXISTS mock_activity_logs_type_idx
      ON mock_activity_logs (type);
    CREATE INDEX IF NOT EXISTS mock_activity_logs_outcome_idx
      ON mock_activity_logs (outcome);
  `)
}
