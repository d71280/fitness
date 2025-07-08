-- Fix recurring_group_id field type from UUID to TEXT
-- This allows more flexible ID formats for recurring schedule groups

ALTER TABLE schedules ALTER COLUMN recurring_group_id TYPE TEXT;