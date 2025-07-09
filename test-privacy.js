// Privacy controls test script
// Run this in your browser console or as a Node.js script

const testPrivacyControls = async () => {
  console.log('🔐 Testing Privacy Controls...\n')
  
  // Test 1: Public data access (should work)
  console.log('Test 1: Public data access')
  try {
    const response = await fetch('/api/public/schedules')
    if (response.ok) {
      console.log('✅ Public schedules accessible')
    } else {
      console.log('❌ Public schedules not accessible')
    }
  } catch (error) {
    console.log('❌ Error accessing public data:', error.message)
  }
  
  // Test 2: Protected data access without auth (should fail)
  console.log('\nTest 2: Protected data access without auth')
  try {
    const response = await fetch('/api/customers')
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Customer data properly protected')
    } else {
      console.log('❌ Customer data not protected')
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  // Test 3: Dashboard access without auth (should redirect)
  console.log('\nTest 3: Dashboard access without auth')
  try {
    const response = await fetch('/dashboard')
    if (response.redirected || response.status === 401) {
      console.log('✅ Dashboard properly protected')
    } else {
      console.log('❌ Dashboard not protected')
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  console.log('\n🏁 Privacy control tests completed')
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testPrivacyControls()
} else {
  // Node.js environment
  console.log('Run this script in a browser console for full testing')
}