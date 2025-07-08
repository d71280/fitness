-- メッセージ設定用の正規化されたテーブル設計
-- 現在のJSONB形式ではなく、適切に正規化されたテーブル構造

-- 1. メッセージテンプレートタイプテーブル
CREATE TABLE IF NOT EXISTS message_template_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. メッセージテンプレートテーブル
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  template_type_id TEXT NOT NULL REFERENCES message_template_types(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. リマインドスケジュールテーブル
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hours_before INTEGER NOT NULL CHECK (hours_before > 0),
  message_template_id TEXT REFERENCES message_templates(id),
  enabled BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. アプリケーション設定テーブル（簡略化）
CREATE TABLE IF NOT EXISTS app_configuration (
  id TEXT PRIMARY KEY,
  booking_confirmation_enabled BOOLEAN DEFAULT true,
  booking_confirmation_template_id TEXT REFERENCES message_templates(id),
  reminder_enabled BOOLEAN DEFAULT true,
  cancellation_enabled BOOLEAN DEFAULT true,
  cancellation_template_id TEXT REFERENCES message_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- トリガー関数（更新時刻自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_message_template_types_updated_at 
    BEFORE UPDATE ON message_template_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at 
    BEFORE UPDATE ON message_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_schedules_updated_at 
    BEFORE UPDATE ON reminder_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_configuration_updated_at 
    BEFORE UPDATE ON app_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データ挿入
INSERT INTO message_template_types (id, name, description) VALUES
('booking_confirmation', '予約完了', '予約完了時に送信されるメッセージ'),
('reminder', 'リマインド', 'レッスン前のリマインドメッセージ'),
('cancellation', 'キャンセル', 'キャンセル時に送信されるメッセージ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO message_templates (id, template_type_id, name, content, variables) VALUES
('booking_default', 'booking_confirmation', 'デフォルト予約完了', 'こんばんは！よろしくお願いします！', '{"date": true, "time": true, "program": true, "instructor": true}'),
('reminder_1d', 'reminder', '1日前リマインド', '明日のレッスンのお知らせ {program} {date} {time}', '{"date": true, "time": true, "program": true, "instructor": true}'),
('reminder_3d', 'reminder', '3日前リマインド', '3日後のレッスンのお知らせ {program} {date} {time}', '{"date": true, "time": true, "program": true, "instructor": true}'),
('reminder_5d', 'reminder', '5日前リマインド', '5日後のレッスンのお知らせ {program} {date} {time}', '{"date": true, "time": true, "program": true, "instructor": true}'),
('cancellation_default', 'cancellation', 'デフォルトキャンセル', 'ご予約をキャンセルしました。', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reminder_schedules (id, name, hours_before, message_template_id, is_custom) VALUES
('1d', '1日前', 24, 'reminder_1d', false),
('3d', '3日前', 72, 'reminder_3d', false),
('5d', '5日前', 120, 'reminder_5d', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_configuration (id, booking_confirmation_template_id, cancellation_template_id) VALUES
('default', 'booking_default', 'cancellation_default')
ON CONFLICT (id) DO NOTHING;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type_id);
CREATE INDEX IF NOT EXISTS idx_reminder_schedules_enabled ON reminder_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_message_templates_enabled ON message_templates(enabled);

-- ビュー作成（現在のAPIとの互換性のため）
CREATE OR REPLACE VIEW message_settings_view AS
SELECT 
  json_build_object(
    'bookingConfirmation', json_build_object(
      'enabled', ac.booking_confirmation_enabled,
      'messageType', 'text',
      'textMessage', bt.content,
      'includeDetails', bt.variables,
      'customFields', ''
    ),
    'reminder', json_build_object(
      'enabled', ac.reminder_enabled,
      'schedules', (
        SELECT json_agg(
          json_build_object(
            'id', rs.id,
            'name', rs.name,
            'enabled', rs.enabled,
            'hoursBefore', rs.hours_before,
            'messageText', rt.content
          )
        )
        FROM reminder_schedules rs
        JOIN message_templates rt ON rs.message_template_id = rt.id
        WHERE rs.enabled = true AND rs.is_custom = false
      ),
      'customSchedules', (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', rs.id,
            'name', rs.name,
            'enabled', rs.enabled,
            'hoursBefore', rs.hours_before,
            'messageText', rt.content
          )
        ), '[]'::json)
        FROM reminder_schedules rs
        JOIN message_templates rt ON rs.message_template_id = rt.id
        WHERE rs.enabled = true AND rs.is_custom = true
      )
    ),
    'cancellation', json_build_object(
      'enabled', ac.cancellation_enabled,
      'messageText', ct.content
    )
  ) as message_settings
FROM app_configuration ac
LEFT JOIN message_templates bt ON ac.booking_confirmation_template_id = bt.id
LEFT JOIN message_templates ct ON ac.cancellation_template_id = ct.id
WHERE ac.id = 'default';

-- RLS（Row Level Security）設定（必要に応じて）
-- ALTER TABLE message_template_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;