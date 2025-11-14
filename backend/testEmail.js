// Test email service directly
require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('\n🧪 Testing Email Service...\n');
  
  try {
    // Test sending a welcome email
    console.log('📧 Sending test welcome email...');
    const result = await emailService.sendWelcomeEmail(
      'your-test-email@example.com', // Replace with your actual email
      'Test User'
    );
    
    console.log('\n✅ SUCCESS! Email sent:', result);
    console.log('\n📬 Check your inbox (and spam folder) for the welcome email\n');
  } catch (error) {
    console.error('\n❌ FAILED to send email:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n⚠️  AUTHENTICATION ERROR');
      console.log('Please check:');
      console.log('1. EMAIL_USER is correct in .env file');
      console.log('2. EMAIL_PASSWORD is correct in .env file');
      console.log('3. SMTP access is enabled in Hostinger');
      console.log('4. The email account is active\n');
    }
  }
  
  process.exit(0);
}

testEmail();
