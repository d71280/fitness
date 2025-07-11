const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qalbwnylptlzofqxjgps.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbGJ3bnlscHRsem9mcXhqZ3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2MTI0NywiZXhwIjoyMDY1NjM3MjQ3fQ.Yt5-OeUnMuRvfBm5TJ4YJGI9pqGkb7y_MaefO68pC6A'

async function removeConstraints() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Removing unique constraints from schedules table...')
    
    // Remove all unique constraints
    const queries = [
      'ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_unique_slot;',
      'ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_key;',
      'ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_program_id_key;'
    ]
    
    for (const query of queries) {
      console.log(`Executing: ${query}`)
      const { data, error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.error(`Error executing query: ${query}`, error)
      } else {
        console.log(`Successfully executed: ${query}`)
      }
    }
    
    // Check remaining constraints
    console.log('Checking remaining constraints...')
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `SELECT constraint_name, constraint_type, column_name 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'schedules' 
                AND tc.constraint_type = 'UNIQUE'
            ORDER BY constraint_name, ordinal_position;`
    })
    
    if (error) {
      console.error('Error checking constraints:', error)
    } else {
      console.log('Remaining constraints:', data)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

removeConstraints()