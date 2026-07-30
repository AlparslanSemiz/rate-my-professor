import { ALL_ACTIONS } from './audit.mjs'

const ACTION_CHECK = ALL_ACTIONS.map((action) => `'${action}'`).join(', ')

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
      biography text NOT NULL DEFAULT '',
      credibility_score integer NOT NULL DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS mock_professors (
      id uuid PRIMARY KEY,
      first_name text NOT NULL,
      last_name text NOT NULL,
      active boolean NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS mock_lectures (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      code text NOT NULL,
      semester_year integer NOT NULL,
      semester_season text NOT NULL CHECK (semester_season IN ('SUMMER', 'WINTER')),
      active boolean NOT NULL DEFAULT true,
      lecture_type text NOT NULL
        CHECK (lecture_type IN ('LECTURE_ONLY', 'LECTURE_AND_EXERCISE'))
        DEFAULT 'LECTURE_ONLY'
    );

    CREATE TABLE IF NOT EXISTS mock_lecture_professors (
      lecture_id uuid NOT NULL REFERENCES mock_lectures(id) ON DELETE CASCADE,
      professor_id uuid NOT NULL REFERENCES mock_professors(id) ON DELETE CASCADE,
      PRIMARY KEY (lecture_id, professor_id)
    );

    CREATE TABLE IF NOT EXISTS mock_ratings (
      id uuid PRIMARY KEY,
      lecture_id uuid NOT NULL REFERENCES mock_lectures(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      score numeric(3, 1) NOT NULL,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_comments (
      id uuid PRIMARY KEY,
      lecture_id uuid NOT NULL REFERENCES mock_lectures(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      content text NOT NULL,
      status text NOT NULL CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED')),
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_answers (
      id uuid PRIMARY KEY,
      comment_id uuid NOT NULL REFERENCES mock_comments(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      content text NOT NULL,
      status text NOT NULL CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED')),
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_comment_reports (
      id uuid PRIMARY KEY,
      comment_id uuid REFERENCES mock_comments(id) ON DELETE CASCADE,
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

    CREATE TABLE IF NOT EXISTS mock_answer_reports (
      id uuid PRIMARY KEY,
      answer_id uuid REFERENCES mock_answers(id) ON DELETE CASCADE,
      answer_content text NOT NULL,
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
      action text NOT NULL CHECK (action IN (${ACTION_CHECK})),
      target_type text,
      target_id text,
      target_label text,
      changes jsonb NOT NULL DEFAULT '{}'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
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
    CREATE INDEX IF NOT EXISTS mock_comments_lecture_idx
      ON mock_comments (lecture_id);
    CREATE INDEX IF NOT EXISTS mock_answers_comment_idx
      ON mock_answers (comment_id);
  `)

  // The activity half now lives in mock_audit_logs, separated by the action's scope.
  await client.query('DROP TABLE IF EXISTS mock_activity_logs')
}
