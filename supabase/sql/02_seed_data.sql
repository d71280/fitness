-- シードデータの投入
-- このSQLをテーブル作成後に実行してください

-- 管理者ユーザー（パスワードはbcryptでハッシュ化済み: "admin123"）
INSERT INTO admins (email, password, name, role) VALUES
('admin@studio.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGcRLfH7qJe', 'Admin User', 'admin');

-- スタジオ
INSERT INTO studios (name, capacity, equipment, description, operating_hours) VALUES
('スタジオ1', 30, ARRAY['ヨガマット', 'ダンベル', '音響設備'], 'メインスタジオ', '{"start": "06:00", "end": "23:00"}'::jsonb),
('スタジオ2', 20, ARRAY['ヨガマット', 'ピラティスボール', '音響設備'], 'サブスタジオ', '{"start": "07:00", "end": "22:00"}'::jsonb);

-- プログラム
INSERT INTO programs (name, color_class, text_color_class, default_duration, description) VALUES
('ヨガ', 'bg-green-500', 'text-white', 60, 'リラックス効果のあるヨガクラス'),
('ピラティス', 'bg-purple-500', 'text-white', 45, 'コア強化に特化したピラティス'),
('ズンバ', 'bg-red-500', 'text-white', 60, 'ダンスフィットネス'),
('HIIT', 'bg-orange-500', 'text-white', 30, '高強度インターバルトレーニング');

-- インストラクター
INSERT INTO instructors (name, email, phone, specialties, bio) VALUES
('田中 美香', 'mika.tanaka@studio.com', '090-1234-5678', ARRAY['ヨガ', 'ピラティス'], 'ヨガインストラクター歴10年のベテラン講師'),
('佐藤 健太', 'kenta.sato@studio.com', '090-2345-6789', ARRAY['HIIT', 'ズンバ'], 'エネルギッシュなレッスンが人気の講師'),
('山田 さくら', 'sakura.yamada@studio.com', '090-3456-7890', ARRAY['ピラティス', 'ヨガ'], '丁寧な指導で初心者にも人気');

-- サンプルスケジュール（今週分）
INSERT INTO schedules (date, start_time, end_time, capacity, program_id, instructor_id, studio_id)
SELECT 
    CURRENT_DATE + (n || ' days')::interval,
    '10:00'::time,
    '11:00'::time,
    20,
    1, -- ヨガ
    1, -- 田中先生
    1  -- スタジオ1
FROM generate_series(0, 6) AS n;

INSERT INTO schedules (date, start_time, end_time, capacity, program_id, instructor_id, studio_id)
SELECT 
    CURRENT_DATE + (n || ' days')::interval,
    '14:00'::time,
    '14:45'::time,
    15,
    2, -- ピラティス
    3, -- 山田先生
    2  -- スタジオ2
FROM generate_series(0, 6) AS n;

INSERT INTO schedules (date, start_time, end_time, capacity, program_id, instructor_id, studio_id)
SELECT 
    CURRENT_DATE + (n || ' days')::interval,
    '18:00'::time,
    '18:30'::time,
    25,
    4, -- HIIT
    2, -- 佐藤先生
    1  -- スタジオ1
FROM generate_series(0, 6) AS n
WHERE EXTRACT(DOW FROM CURRENT_DATE + (n || ' days')::interval) IN (1, 3, 5); -- 月水金のみ

-- サンプル顧客
INSERT INTO customers (name, line_id, phone, email, membership_type, preferred_programs) VALUES
('テストユーザー1', 'U1234567890abcdef', '090-1111-1111', 'test1@example.com', 'regular', ARRAY[1, 2]),
('テストユーザー2', 'U2234567890abcdef', '090-2222-2222', 'test2@example.com', 'premium', ARRAY[3, 4]),
('テストユーザー3', 'U3234567890abcdef', '090-3333-3333', 'test3@example.com', 'regular', ARRAY[1]);

-- サンプル予約
INSERT INTO reservations (schedule_id, customer_id, status, booking_type)
SELECT 
    s.id,
    (ARRAY[1, 2, 3])[1 + floor(random() * 3)],
    'confirmed',
    'advance'
FROM schedules s
WHERE s.date >= CURRENT_DATE
LIMIT 10;