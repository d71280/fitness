-- Add recurring_group_id field to schedules table for grouping recurring schedules
ALTER TABLE schedules 
ADD COLUMN recurring_group_id TEXT;

-- Add index for better performance when querying by recurring_group_id
CREATE INDEX idx_schedules_recurring_group_id ON schedules(recurring_group_id);

-- Add comment to describe the field
COMMENT ON COLUMN schedules.recurring_group_id IS 'Groups related recurring schedules together for bulk operations';