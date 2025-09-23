// Test script for Paystack webhook functionality
// Run with: node test-webhook.js

const axios = require('axios');

async function testWebhook() {
  try {
    console.log('🧪 Testing Paystack Webhook Functionality');
    console.log('========================================\n');

    // You'll need to replace these with actual values
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
    const TEST_REFERENCE = process.env.TEST_REFERENCE || 'txn_test_1234567890';
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your_jwt_token_here';

    console.log(`📡 Testing webhook with reference: ${TEST_REFERENCE}`);
    console.log(`🌐 Server URL: ${BASE_URL}\n`);

    // Test the webhook endpoint
    const response = await axios.post(
      `${BASE_URL}/api/users/test-webhook`,
      { reference: TEST_REFERENCE },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Webhook test successful!');
    console.log('📄 Response:', response.data);
    console.log('\n🎉 Webhook functionality is working correctly.');

  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure the server is running.');
    } else {
      console.error('Error:', error.message);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running on the correct port');
    console.log('2. Check that TEST_REFERENCE exists in the database');
    console.log('3. Verify your AUTH_TOKEN is valid');
    console.log('4. Ensure webhook routes are properly configured');
  }
}

// Instructions
console.log('📋 Webhook Testing Instructions:');
console.log('================================');
console.log('1. Set environment variables:');
console.log('   export BASE_URL=http://localhost:5001');
console.log('   export TEST_REFERENCE=your_transaction_reference');
console.log('   export AUTH_TOKEN=your_jwt_token');
console.log('');
console.log('2. Run this script: node test-webhook.js');
console.log('');
console.log('3. Check server logs for webhook processing details');
console.log('');

// Run the test
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook };