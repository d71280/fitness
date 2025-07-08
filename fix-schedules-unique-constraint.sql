-- 繰り返しスケジュール重複問題の修正
-- 現在の制約: UNIQUE(date, studio_id, start_time, end_time) 
-- 新しい制約: UNIQUE(date, studio_id, start_time, end_time, program_id)
-- これにより、同じ時間・スタジオで異なるプログラムの並行実行が可能になる

-- 1. 既存の制約を削除
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_key;

-- 2. 新しい制約を追加（program_idを含む）
ALTER TABLE schedules ADD CONSTRAINT schedules_unique_slot 
UNIQUE(date, studio_id, start_time, end_time, program_id);

-- 3. 制約確認用クエリ
SELECT 
    constraint_name, 
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'schedules' 
    AND tc.constraint_type = 'UNIQUE'
ORDER BY constraint_name, ordinal_position;