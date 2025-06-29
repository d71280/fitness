// Supabaseデータベースセットアップスクリプト
// 使用方法: node scripts/setup-supabase.js

const { createClient } = require('@supabase/supabase-js')

// 環境変数から設定を読み込み
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません')
  console.log('以下を .env.local に設定してください:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🚀 テーブル作成開始...')
  
  const tableSQL = `
    -- プログラムテーブル
    CREATE TABLE IF NOT EXISTS programs (
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
    CREATE TABLE IF NOT EXISTS instructors (
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
    CREATE TABLE IF NOT EXISTS studios (
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
    CREATE TABLE IF NOT EXISTS schedules (
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
      program_id INTEGER NOT NULL,
      instructor_id INTEGER NOT NULL,
      studio_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(date, studio_id, start_time, end_time)
    );

    -- 外部キー制約を後で追加
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'schedules_program_id_fkey') THEN
            ALTER TABLE schedules ADD CONSTRAINT schedules_program_id_fkey 
            FOREIGN KEY (program_id) REFERENCES programs(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'schedules_instructor_id_fkey') THEN
            ALTER TABLE schedules ADD CONSTRAINT schedules_instructor_id_fkey 
            FOREIGN KEY (instructor_id) REFERENCES instructors(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'schedules_studio_id_fkey') THEN
            ALTER TABLE schedules ADD CONSTRAINT schedules_studio_id_fkey 
            FOREIGN KEY (studio_id) REFERENCES studios(id);
        END IF;
    END$$;

    -- 残りのテーブル
    CREATE TABLE IF NOT EXISTS customers (
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

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      schedule_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'confirmed',
      booking_type VARCHAR(50) DEFAULT 'advance',
      cancellation_reason TEXT,
      cancelled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(schedule_id, customer_id)
    );

    CREATE TABLE IF NOT EXISTS waiting_list (
      id SERIAL PRIMARY KEY,
      schedule_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      notified_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(schedule_id, customer_id)
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      reservation_id INTEGER,
      notification_type VARCHAR(50) NOT NULL,
      message_content JSONB NOT NULL,
      sent_at TIMESTAMPTZ,
      lstep_response JSONB,
      success BOOLEAN NOT NULL,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  const { error } = await supabase.rpc('exec_sql', { sql: tableSQL })
  
  if (error) {
    console.error('❌ テーブル作成エラー:', error)
    return false
  }
  
  console.log('✅ テーブル作成完了')
  return true
}

async function insertSeedData() {
  console.log('🌱 シードデータ投入開始...')
  
  try {
    // 管理者
    await supabase.from('admins').upsert({
      email: 'admin@studio.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGcRLfH7qJe',
      name: 'Admin User',
      role: 'admin'
    })

    // スタジオ
    await supabase.from('studios').upsert([
      {
        id: 1,
        name: 'スタジオ1',
        capacity: 30,
        equipment: ['ヨガマット', 'ダンベル', '音響設備'],
        description: 'メインスタジオ',
        operating_hours: { start: '06:00', end: '23:00' }
      },
      {
        id: 2,
        name: 'スタジオ2',
        capacity: 20,
        equipment: ['ヨガマット', 'ピラティスボール', '音響設備'],
        description: 'サブスタジオ',
        operating_hours: { start: '07:00', end: '22:00' }
      }
    ])

    // プログラム
    await supabase.from('programs').upsert([
      { id: 1, name: 'ヨガ', color_class: 'bg-green-500', description: 'リラックス効果のあるヨガクラス' },
      { id: 2, name: 'ピラティス', color_class: 'bg-purple-500', description: 'コア強化に特化したピラティス' },
      { id: 3, name: 'ズンバ', color_class: 'bg-red-500', description: 'ダンスフィットネス' },
      { id: 4, name: 'HIIT', color_class: 'bg-orange-500', description: '高強度インターバルトレーニング' }
    ])

    // インストラクター
    await supabase.from('instructors').upsert([
      {
        id: 1,
        name: '田中 美香',
        email: 'mika.tanaka@studio.com',
        phone: '090-1234-5678',
        specialties: ['ヨガ', 'ピラティス'],
        bio: 'ヨガインストラクター歴10年のベテラン講師'
      },
      {
        id: 2,
        name: '佐藤 健太',
        email: 'kenta.sato@studio.com',
        phone: '090-2345-6789',
        specialties: ['HIIT', 'ズンバ'],
        bio: 'エネルギッシュなレッスンが人気の講師'
      },
      {
        id: 3,
        name: '山田 さくら',
        email: 'sakura.yamada@studio.com',
        phone: '090-3456-7890',
        specialties: ['ピラティス', 'ヨガ'],
        bio: '丁寧な指導で初心者にも人気'
      }
    ])

    // 顧客
    await supabase.from('customers').upsert([
      {
        id: 1,
        name: 'テストユーザー1',
        line_id: 'U1234567890abcdef',
        phone: '090-1111-1111',
        email: 'test1@example.com',
        preferred_programs: [1, 2]
      },
      {
        id: 2,
        name: 'テストユーザー2',
        line_id: 'U2234567890abcdef',
        phone: '090-2222-2222',
        email: 'test2@example.com',
        preferred_programs: [3, 4]
      },
      {
        id: 3,
        name: 'テストユーザー3',
        line_id: 'U3234567890abcdef',
        phone: '090-3333-3333',
        email: 'test3@example.com',
        preferred_programs: [1]
      }
    ])

    console.log('✅ シードデータ投入完了')
    return true
  } catch (error) {
    console.error('❌ シードデータ投入エラー:', error)
    return false
  }
}

async function main() {
  console.log('🔄 Supabaseデータベースセットアップ開始')
  
  const tablesCreated = await createTables()
  if (!tablesCreated) {
    process.exit(1)
  }
  
  const seedInserted = await insertSeedData()
  if (!seedInserted) {
    process.exit(1)
  }
  
  console.log('🎉 セットアップ完了!')
  console.log('Supabaseダッシュボードでテーブルを確認してください')
}

main().catch(console.error)