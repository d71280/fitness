-- Add RPM45 program to the programs table
INSERT INTO programs (id, name, description, duration, capacity, color, color_class, text_color_class, is_active, created_at, updated_at)
VALUES (
  5,
  'RPM45',
  '高強度サイクリングワークアウト',
  45,
  20,
  '#06B6D4',
  'bg-cyan-500',
  'text-white',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration = EXCLUDED.duration,
  capacity = EXCLUDED.capacity,
  color = EXCLUDED.color,
  color_class = EXCLUDED.color_class,
  text_color_class = EXCLUDED.text_color_class,
  updated_at = NOW();