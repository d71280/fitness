const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qalbwnylptlzofqxjgps.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbGJ3bnlscHRsem9mcXhqZ3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2MTI0NywiZXhwIjoyMDY1NjM3MjQ3fQ.Yt5-OeUnMuRvfBm5TJ4YJGI9pqGkb7y_MaefO68pC6A'

async function checkConstraints() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('Checking existing schedules...')
    
    // Check what schedules exist for July 7th
    const { data: july7, error: july7Error } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', '2025-07-07')
      .order('start_time')
    
    if (july7Error) {
      console.error('Error fetching July 7 schedules:', july7Error)
    } else {
      console.log('July 7 schedules:', july7)
    }
    
    // Try to insert a test schedule to see what constraint exists
    console.log('\\nTesting constraint by inserting duplicate...')
    const { data: testInsert, error: testError } = await supabase
      .from('schedules')
      .insert({
        date: '2025-07-07',
        start_time: '10:00:00',
        end_time: '11:00:00',
        program_id: 1, // ヨガ
        capacity: 20,
        instructor_id: 1,
        studio_id: 1,
      })
    
    if (testError) {
      console.log('Test constraint error:', testError)
      console.log('Error code:', testError.code)
      console.log('Error details:', testError.details)
    } else {
      console.log('Test insert successful:', testInsert)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkConstraints()