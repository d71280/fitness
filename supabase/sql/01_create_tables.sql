-- フィットネススタジオ予約システム - テーブル作成
-- このSQLをSupabase SQL Editorで実行してください

-- プログラムテーブル
CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  color_class VARCHAR(50) DEFAULT 'bg-blue-500',
  text_color_class VARCHAR(50) DEFAULT 'text-white',
  default_duration INTEGER DEFAULT 60,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インストラクターテーブル
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialties TEXT[],
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- スタジオテーブル
CREATE TABLE studios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  equipment TEXT[],
  description TEXT,
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- スケジュールテーブル
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  recurring_group_id UUID,
  recurring_type VARCHAR(50),
  recurring_end_date DATE,
  recurring_count INTEGER,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  instructor_id INTEGER NOT NULL REFERENCES instructors(id),
  studio_id INTEGER NOT NULL REFERENCES studios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, studio_id, start_time, end_time)
);

-- 顧客テーブル
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  line_id VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  email VARCHAR(255),
  membership_type VARCHAR(50) DEFAULT 'regular',
  preferred_programs INTEGER[],
  cancellation_count INTEGER DEFAULT 0,
  last_booking_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 予約テーブル
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'confirmed',
  booking_type VARCHAR(50) DEFAULT 'advance',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, customer_id)
);

-- キャンセル待ちテーブル
CREATE TABLE waiting_list (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  position INTEGER NOT NULL,
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, customer_id)
);

-- 通知ログテーブル
CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  reservation_id INTEGER REFERENCES reservations(id),
  notification_type VARCHAR(50) NOT NULL,
  message_content JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  lstep_response JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 管理者テーブル
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_program_id ON schedules(program_id);
CREATE INDEX idx_schedules_instructor_id ON schedules(instructor_id);
CREATE INDEX idx_schedules_studio_id ON schedules(studio_id);
CREATE INDEX idx_schedules_recurring_group_id ON schedules(recurring_group_id);
CREATE INDEX idx_reservations_schedule_id ON reservations(schedule_id);
CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_waiting_list_schedule_id ON waiting_list(schedule_id);
CREATE INDEX idx_notification_logs_customer_id ON notification_logs(customer_id);

-- 更新トリガーの作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新トリガーを適用
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();