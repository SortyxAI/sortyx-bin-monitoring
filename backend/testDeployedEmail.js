// Test script to check email service on deployed backend
const BACKEND_URL = 'https://sortyx-bin-monitoring-2.onrender.com';

async function testEmailService() {
  console.log('🧪 Testing Email Service on:', BACKEND_URL);
  console.log('─'.repeat(60));

  try {
    // Test 1: Check if backend is alive
    console.log('\n1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/`);
    if (healthResponse.ok) {
      console.log('✅ Backend is responding');
    } else {
      console.log('⚠️ Backend returned status:', healthResponse.status);
    }

    // Test 2: Send a test welcome email
    console.log('\n2️⃣ Testing welcome email endpoint...');
    const welcomeResponse = await fetch(`${BACKEND_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        userName: 'Test User'
      })
    });

    const welcomeData = await welcomeResponse.json();
    
    if (welcomeResponse.ok) {
      console.log('✅ Welcome email endpoint is working');
      console.log('📧 Response:', welcomeData);
    } else {
      console.log('❌ Welcome email failed');
      console.log('Error:', welcomeData);
    }

    // Test 3: Send a test alert email
    console.log('\n3️⃣ Testing alert email endpoint...');
    const alertResponse = await fetch(`${BACKEND_URL}/api/send-alert-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        userName: 'Test User',
        alertDetails: {
          binName: 'Test Bin',
          alertType: 'Fill Level Warning',
          message: 'Bin is 80% full',
          severity: 'warning'
        }
      })
    });

    const alertData = await alertResponse.json();
    
    if (alertResponse.ok) {
      console.log('✅ Alert email endpoint is working');
      console.log('📧 Response:', alertData);
    } else {
      console.log('❌ Alert email failed');
      console.log('Error:', alertData);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('🎯 Email service test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testEmailService();
