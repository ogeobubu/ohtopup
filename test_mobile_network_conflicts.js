// Test mobile app network detection with conflicts
const { detectNetwork } = require('./ohtopup-mobile/utils/networkUtils.ts');

console.log('Testing mobile app network detection with conflict scenarios...\n');

// Test cases for conflict scenarios
const conflictTestCases = [
  // MTN numbers that should conflict with other selected networks
  { phone: '08031234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '08061234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '07031234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '08131234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '08141234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '08161234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '09031234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '09131234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '09161234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },
  { phone: '08011234567', detected: 'mtn', conflictWith: ['airtel', 'glo', '9mobile'] },

  // Airtel numbers
  { phone: '08021234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '08081234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '07081234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '08121234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '09011234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '09021234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '09041234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '09071234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },
  { phone: '09121234567', detected: 'airtel', conflictWith: ['mtn', 'glo', '9mobile'] },

  // Glo numbers
  { phone: '08051234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },
  { phone: '08071234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },
  { phone: '07051234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },
  { phone: '08111234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },
  { phone: '08151234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },
  { phone: '09051234567', detected: 'glo', conflictWith: ['mtn', 'airtel', '9mobile'] },

  // 9Mobile numbers
  { phone: '08091234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
  { phone: '08171234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
  { phone: '08181234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
  { phone: '09081234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
  { phone: '09091234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
  { phone: '09181234567', detected: '9mobile', conflictWith: ['mtn', 'airtel', 'glo'] },
];

let passed = 0;
let failed = 0;

console.log('Testing conflict scenarios...\n');

conflictTestCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.phone} (expected: ${testCase.detected})`);

  const result = detectNetwork(testCase.phone);

  if (result === testCase.detected) {
    console.log(`  ✅ Detected: ${result}`);

    // Test conflicts
    testCase.conflictWith.forEach(conflictNetwork => {
      console.log(`    Testing conflict with ${conflictNetwork}: ${result !== conflictNetwork ? 'WOULD CONFLICT' : 'NO CONFLICT'}`);
    });

    passed++;
  } else {
    console.log(`  ❌ Expected: ${testCase.detected}, Got: ${result}`);
    failed++;
  }

  console.log('');
});

console.log('=== Conflict Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('🎉 All conflict tests passed!');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
}