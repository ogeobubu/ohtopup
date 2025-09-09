/**
 * Test script for Dice Manipulation Algorithm
 *
 * This script tests all manipulation modes to ensure they work correctly.
 * Run with: node utils/testDiceManipulation.js
 */

const { diceManipulationEngine, MANIPULATION_MODES } = require('./diceManipulation');

async function testManipulationMode(mode, config, testName, iterations = 1000) {
  console.log(`\n=== Testing ${testName} ===`);
  console.log(`Mode: ${mode}`);
  console.log(`Config:`, config);

  let wins = 0;
  let losses = 0;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    try {
      const result = await diceManipulationEngine.applyManipulation(
        { mode, ...config },
        'test-user-' + i,
        { user: { id: 'test-user-' + i } }
      );

      results.push(result);
      if (result.isWin) wins++;
      else losses++;

    } catch (error) {
      console.error(`Error in iteration ${i}:`, error.message);
    }
  }

  const winRate = (wins / iterations) * 100;
  console.log(`Results: ${wins} wins, ${losses} losses`);
  console.log(`Win Rate: ${winRate.toFixed(2)}%`);
  console.log(`Expected: ${getExpectedWinRate(mode, config)}%`);

  return { wins, losses, winRate, results };
}

function getExpectedWinRate(mode, config) {
  switch (mode) {
    case MANIPULATION_MODES.FAIR:
      return 2.78;
    case MANIPULATION_MODES.BIASED_WIN:
      return (config.bias * 100) || 50;
    case MANIPULATION_MODES.BIASED_LOSS:
      return ((1 - (config.bias || 0.5)) * 2.78);
    case MANIPULATION_MODES.FIXED_WIN:
      return 100;
    case MANIPULATION_MODES.FIXED_LOSS:
      return 0;
    case MANIPULATION_MODES.CUSTOM_PROBABILITY:
      return (config.winProbability * 100) || 2.78;
    case MANIPULATION_MODES.SPECIFIC_DICE:
      return (config.targetDice1 === 6 && config.targetDice2 === 6) ? 100 : 0;
    default:
      return 2.78;
  }
}

async function runAllTests() {
  console.log('🎲 Dice Manipulation Algorithm Test Suite');
  console.log('==========================================');

  const testResults = [];

  // Test 1: Fair Play
  const fairResult = await testManipulationMode(
    MANIPULATION_MODES.FAIR,
    {},
    'Fair Play Mode',
    10000
  );
  testResults.push({ name: 'Fair Play', ...fairResult });

  // Test 2: Biased Win (80% bias)
  const biasedWinResult = await testManipulationMode(
    MANIPULATION_MODES.BIASED_WIN,
    { bias: 0.8 },
    'Biased Win (80%)',
    5000
  );
  testResults.push({ name: 'Biased Win 80%', ...biasedWinResult });

  // Test 3: Biased Loss (70% bias)
  const biasedLossResult = await testManipulationMode(
    MANIPULATION_MODES.BIASED_LOSS,
    { bias: 0.7 },
    'Biased Loss (70%)',
    5000
  );
  testResults.push({ name: 'Biased Loss 70%', ...biasedLossResult });

  // Test 4: Fixed Win
  const fixedWinResult = await testManipulationMode(
    MANIPULATION_MODES.FIXED_WIN,
    {},
    'Fixed Win Mode',
    100
  );
  testResults.push({ name: 'Fixed Win', ...fixedWinResult });

  // Test 5: Fixed Loss
  const fixedLossResult = await testManipulationMode(
    MANIPULATION_MODES.FIXED_LOSS,
    {},
    'Fixed Loss Mode',
    100
  );
  testResults.push({ name: 'Fixed Loss', ...fixedLossResult });

  // Test 6: Custom Probability (10%)
  const customProbResult = await testManipulationMode(
    MANIPULATION_MODES.CUSTOM_PROBABILITY,
    { winProbability: 0.1 },
    'Custom Probability (10%)',
    5000
  );
  testResults.push({ name: 'Custom 10%', ...customProbResult });

  // Test 7: Specific Dice (6,6 - should always win)
  const specificWinResult = await testManipulationMode(
    MANIPULATION_MODES.SPECIFIC_DICE,
    { targetDice1: 6, targetDice2: 6 },
    'Specific Dice (6,6)',
    100
  );
  testResults.push({ name: 'Specific Win', ...specificWinResult });

  // Test 8: Specific Dice (1,1 - should always lose)
  const specificLossResult = await testManipulationMode(
    MANIPULATION_MODES.SPECIFIC_DICE,
    { targetDice1: 1, targetDice2: 1 },
    'Specific Dice (1,1)',
    100
  );
  testResults.push({ name: 'Specific Loss', ...specificLossResult });

  // Test 9: Seeded generation (should be reproducible)
  console.log('\n=== Testing Seeded Generation ===');
  diceManipulationEngine.initializeGenerator('test-seed-123');

  const seededResults1 = [];
  for (let i = 0; i < 10; i++) {
    const result = await diceManipulationEngine.applyManipulation(
      { mode: MANIPULATION_MODES.FAIR },
      'seeded-test',
      { user: { id: 'seeded-test' } }
    );
    seededResults1.push(`${result.dice1},${result.dice2}`);
  }

  // Reset and run again with same seed
  diceManipulationEngine.initializeGenerator('test-seed-123');
  const seededResults2 = [];
  for (let i = 0; i < 10; i++) {
    const result = await diceManipulationEngine.applyManipulation(
      { mode: MANIPULATION_MODES.FAIR },
      'seeded-test',
      { user: { id: 'seeded-test' } }
    );
    seededResults2.push(`${result.dice1},${result.dice2}`);
  }

  const reproducible = JSON.stringify(seededResults1) === JSON.stringify(seededResults2);
  console.log('Seeded results reproducible:', reproducible);
  console.log('First run:', seededResults1.join(' | '));
  console.log('Second run:', seededResults2.join(' | '));

  // Summary
  console.log('\n=== Test Summary ===');
  console.log('Test Name'.padEnd(20), 'Wins'.padEnd(8), 'Losses'.padEnd(8), 'Win Rate'.padEnd(10), 'Expected'.padEnd(10), 'Status');
  console.log('-'.repeat(80));

  testResults.forEach(result => {
    const expected = getExpectedWinRate(
      Object.keys(MANIPULATION_MODES).find(key => MANIPULATION_MODES[key] === result.name.toLowerCase().replace(/[^a-z]/g, '_')) ||
      MANIPULATION_MODES.FAIR,
      {}
    );
    const status = Math.abs(result.winRate - expected) < 5 ? '✅ PASS' : '❌ FAIL';
    console.log(
      result.name.padEnd(20),
      result.wins.toString().padEnd(8),
      result.losses.toString().padEnd(8),
      `${result.winRate.toFixed(2)}%`.padEnd(10),
      `${expected.toFixed(2)}%`.padEnd(10),
      status
    );
  });

  console.log('\nSeeded Generation:', reproducible ? '✅ PASS' : '❌ FAIL');

  console.log('\n🎲 Test suite completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testManipulationMode,
  runAllTests
};