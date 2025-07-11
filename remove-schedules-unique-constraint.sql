-- 重複エラーの完全削除
-- すべてのスケジュール重複制約を削除して、すべてのスケジュールが確実に登録されるようにする

-- 1. 現在のユニーク制約を削除
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_unique_slot;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_key;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_program_id_key;

-- 2. 制約削除の確認
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