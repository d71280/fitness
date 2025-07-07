-- アプリケーション設定テーブルの作成
-- メッセージテンプレート設定を永続化するためのテーブル

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  message_settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- デフォルト設定を挿入
INSERT INTO app_settings (id, message_settings) 
VALUES (
  'default',
  '{
    "bookingConfirmation": {
      "enabled": true,
      "messageType": "flex",
      "textMessage": "✅ 予約が完了しました！\\n\\n📅 日時: {date} {time}\\n🏃 プログラム: {program}\\n👨‍🏫 インストラクター: {instructor}\\n\\nお忘れなくお越しください！",
      "includeDetails": {
        "date": true,
        "time": true,
        "program": true,
        "instructor": true,
        "studio": false,
        "capacity": false
      },
      "customFields": ""
    },
    "reminder": {
      "enabled": true,
      "schedules": [
        {
          "id": "5d",
          "name": "5日前",
          "enabled": true,
          "hoursBefore": 120,
          "messageText": "【5日後のレッスンのご案内】\\n\\n{program}\\n📅 {date}\\n⏰ {time}\\n👨‍🏫 {instructor}\\n\\n5日後にレッスンがございます。スケジュールの確認をお願いします📝\\nキャンセルをご希望の場合はお早めにご連絡ください。"
        },
        {
          "id": "3d",
          "name": "3日前",
          "enabled": true,
          "hoursBefore": 72,
          "messageText": "【3日後のレッスンのお知らせ】\\n\\n{program}\\n📅 {date}\\n⏰ {time}\\n👨‍🏫 {instructor}\\n\\n3日後にレッスンがございます。準備はいかがですか？✨\\nご都合が悪くなった場合は、できるだけ早めにご連絡をお願いします。"
        },
        {
          "id": "1d",
          "name": "1日前",
          "enabled": true,
          "hoursBefore": 24,
          "messageText": "【明日のレッスンのお知らせ】\\n\\n{program}\\n📅 {date}\\n⏰ {time}\\n👨‍🏫 {instructor}\\n\\n明日はレッスンです！お忘れなく💪\\n何かご不明な点があればお気軽にお声かけください😊"
        }
      ],
      "customSchedules": []
    },
    "cancellation": {
      "enabled": true,
      "messageText": "ご予約をキャンセルしました。\\n\\nまたのご利用をお待ちしております。"
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 権限設定（必要に応じて調整）
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;