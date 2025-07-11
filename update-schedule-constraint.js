const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qalbwnylptlzofqxjgps.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbGJ3bnlscHRsem9mcXhqZ3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2MTI0NywiZXhwIjoyMDY1NjM3MjQ3fQ.Yt5-OeUnMuRvfBm5TJ4YJGI9pqGkb7y_MaefO68pC6A'

async function updateConstraint() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Updating database constraint to allow multiple programs at same time...')
    
    // Step 1: Drop existing constraint
    console.log('Step 1: Dropping existing constraint...')
    const dropResult = await supabase
      .from('schedules')
      .select('count(*)')
      .limit(1)
    
    if (dropResult.error) {
      console.error('Error accessing schedules table:', dropResult.error)
      return
    }
    
    // We'll use a different approach - create a function to execute raw SQL
    const functionSQL = `
    CREATE OR REPLACE FUNCTION update_schedule_constraint()
    RETURNS text AS $$
    BEGIN
      -- Drop existing constraint
      ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_date_studio_id_start_time_end_time_key;
      
      -- Add new constraint with program_id
      ALTER TABLE schedules ADD CONSTRAINT schedules_unique_slot_with_program 
      UNIQUE(date, studio_id, start_time, end_time, program_id);
      
      RETURN 'Constraint updated successfully';
    END;
    $$ LANGUAGE plpgsql;
    `
    
    console.log('Creating constraint update function...')
    const createFunctionResult = await supabase.rpc('sql', { query: functionSQL })
    
    if (createFunctionResult.error) {
      console.log('Function creation error (this is expected if we cannot create functions):', createFunctionResult.error)
      
      // Alternative approach: Use a series of operations
      console.log('Trying alternative approach...')
      
      // Check current constraints
      const constraintCheck = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', 'schedules')
        .eq('constraint_type', 'UNIQUE')
      
      console.log('Current constraints:', constraintCheck)
      
    } else {
      console.log('Executing constraint update function...')
      const executeResult = await supabase.rpc('update_schedule_constraint')
      
      if (executeResult.error) {
        console.error('Error executing constraint update:', executeResult.error)
      } else {
        console.log('Constraint update result:', executeResult.data)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

updateConstraint()