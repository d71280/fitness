-- フィットネススタジオ予約システム初期スキーマ

-- プログラムテーブル
CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration INTEGER NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インストラクターテーブル
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタジオテーブル
CREATE TABLE studios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スケジュールテーブル
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE CASCADE,
  studio_id INTEGER REFERENCES studios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約テーブル
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  line_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_program_id ON schedules(program_id);
CREATE INDEX idx_schedules_instructor_id ON schedules(instructor_id);
CREATE INDEX idx_schedules_studio_id ON schedules(studio_id);
CREATE INDEX idx_reservations_schedule_id ON reservations(schedule_id);
CREATE INDEX idx_reservations_line_id ON reservations(line_id);

-- 初期データ
INSERT INTO programs (name, description, default_duration, color) VALUES
('ヨガ', 'リラックス効果の高いヨガクラス', 60, '#4ade80'),
('ピラティス', '体幹を鍛えるピラティス', 45, '#f97316'),
('エアロビクス', '有酸素運動で心肺機能向上', 45, '#3b82f6'),
('筋トレ', 'ウェイトトレーニング', 60, '#ef4444'),
('ダンス', '楽しく踊って体を動かす', 60, '#8b5cf6');

INSERT INTO instructors (name, email, bio) VALUES
('田中 美咲', 'tanaka@studio.com', 'ヨガインストラクター歴5年'),
('佐藤 健太', 'sato@studio.com', 'ピラティス・筋トレ専門'),
('山田 花子', 'yamada@studio.com', 'ダンス・エアロビクス担当');

INSERT INTO studios (name, capacity, description) VALUES
('スタジオA', 20, 'メインスタジオ、大型クラス向け'),
('スタジオB', 12, '中規模スタジオ、少人数制クラス'),
('スタジオC', 8, '小規模スタジオ、プライベートレッスン向け');