-- Supabase SQLエディタで実行するコマンド（修正版）
-- 同じ時間帯に複数のプログラムを並行実行可能にするための制約変更

-- 1. 現在の制約を確認
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'schedules' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 2. 既存のユニーク制約を削除
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_key;

-- 3. 新しい制約を追加（program_idを含む）
-- これにより同じ時間・スタジオで異なるプログラムの並行実行が可能になる
ALTER TABLE schedules ADD CONSTRAINT schedules_unique_slot_with_program 
UNIQUE(date, studio_id, start_time, end_time, program_id);

-- 4. 制約変更の確認
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'schedules' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 5. テスト用 - 7月7日の既存スケジュールを確認
SELECT 
    id,
    date,
    start_time,
    end_time,
    program_id,
    studio_id,
    capacity
FROM schedules 
WHERE date = '2025-07-07'
ORDER BY start_time;