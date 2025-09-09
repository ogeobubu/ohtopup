/**
 * Dice Game Manipulation Algorithm
 *
 * This module provides a robust algorithm for controlling dice game outcomes
 * with configurable parameters for win probability, outcome biases, and fixed results.
 *
 * Features:
 * - Pseudo-random number generation with optional seeding
 * - Multiple manipulation modes (fair, biased, fixed)
 * - Configurable win probabilities and outcome biases
 * - Secure access controls with admin-only manipulation
 * - Comprehensive logging and auditing
 * - Error handling and validation
 */

const crypto = require('crypto');
const { createLog } = require('../controllers/systemLogController');

/**
 * Dice Manipulation Modes
 */
const MANIPULATION_MODES = {
  FAIR: 'fair',           // No manipulation, pure random
  BIASED_WIN: 'biased_win',     // Bias towards wins
  BIASED_LOSS: 'biased_loss',   // Bias towards losses
  FIXED_WIN: 'fixed_win',       // Always win
  FIXED_LOSS: 'fixed_loss',     // Always lose
  CUSTOM_PROBABILITY: 'custom_probability', // Custom win probability
  SPECIFIC_DICE: 'specific_dice' // Force specific dice values
};

/**
 * Dice Manipulation Engine Class
 */
class DiceManipulationEngine {
  constructor() {
    this.seed = null;
    this.generator = null;
  }

  /**
   * Initialize the pseudo-random number generator
   * @param {string} seed - Optional seed for reproducible results
   */
  initializeGenerator(seed = null) {
    if (seed) {
      this.seed = seed;
      // Use crypto for better randomness with seed
      this.generator = this.createSeededGenerator(seed);
    } else {
      this.generator = Math.random;
    }
    return this.generator;
  }

  /**
   * Create a seeded pseudo-random number generator
   * @param {string} seed - Seed string
   * @returns {function} Seeded random function
   */
  createSeededGenerator(seed) {
    let hash = crypto.createHash('sha256').update(seed).digest('hex');
    let index = 0;

    return () => {
      if (index >= hash.length - 8) {
        // Regenerate hash when we run out of entropy
        hash = crypto.createHash('sha256').update(hash).digest('hex');
        index = 0;
      }

      const chunk = hash.substr(index, 8);
      index += 8;

      // Convert hex chunk to number between 0 and 1
      return parseInt(chunk, 16) / 0xFFFFFFFF;
    };
  }

  /**
   * Generate random dice roll (1-6)
   * @returns {number} Random number between 1 and 6
   */
  generateDiceRoll() {
    if (!this.generator) {
      this.initializeGenerator();
    }
    return Math.floor(this.generator() * 6) + 1;
  }

  /**
   * Apply manipulation to dice rolls based on configuration
   * @param {Object} config - Manipulation configuration
   * @param {string} userId - User ID for logging
   * @param {Object} req - Request object for logging
   * @returns {Object} Manipulated dice results
   */
  async applyManipulation(config, userId, req) {
    try {
      // Validate configuration
      this.validateConfig(config);

      const mode = config.mode || MANIPULATION_MODES.FAIR;
      let dice1, dice2, isWin, manipulationType;

      switch (mode) {
        case MANIPULATION_MODES.FAIR:
          ({ dice1, dice2, isWin } = this.generateFairRoll());
          manipulationType = 'fair';
          break;

        case MANIPULATION_MODES.BIASED_WIN:
          ({ dice1, dice2, isWin } = this.generateBiasedWinRoll(config.bias || 0.8));
          manipulationType = 'biased_win';
          break;

        case MANIPULATION_MODES.BIASED_LOSS:
          ({ dice1, dice2, isWin } = this.generateBiasedLossRoll(config.bias || 0.8));
          manipulationType = 'biased_loss';
          break;

        case MANIPULATION_MODES.FIXED_WIN:
          ({ dice1, dice2, isWin } = this.generateFixedWinRoll());
          manipulationType = 'fixed_win';
          break;

        case MANIPULATION_MODES.FIXED_LOSS:
          ({ dice1, dice2, isWin } = this.generateFixedLossRoll());
          manipulationType = 'fixed_loss';
          break;

        case MANIPULATION_MODES.CUSTOM_PROBABILITY:
          ({ dice1, dice2, isWin } = this.generateCustomProbabilityRoll(config.winProbability || 0.0278));
          manipulationType = 'custom_probability';
          break;

        case MANIPULATION_MODES.SPECIFIC_DICE:
          ({ dice1, dice2, isWin } = this.generateSpecificDiceRoll(config.targetDice1, config.targetDice2));
          manipulationType = 'specific_dice';
          break;

        default:
          ({ dice1, dice2, isWin } = this.generateFairRoll());
          manipulationType = 'fair';
      }

      // Log manipulation if not fair mode
      if (mode !== MANIPULATION_MODES.FAIR) {
        await this.logManipulation({
          userId,
          mode,
          manipulationType,
          config,
          result: { dice1, dice2, isWin },
          timestamp: new Date()
        }, req);
      }

      return {
        dice1,
        dice2,
        isWin,
        manipulationApplied: mode !== MANIPULATION_MODES.FAIR,
        manipulationType
      };

    } catch (error) {
      console.error('Error in dice manipulation:', error);

      // Log error
      await createLog(
        'error',
        `Dice manipulation error: ${error.message}`,
        'game',
        userId,
        'system',
        {
          error: error.message,
          config,
          timestamp: new Date()
        },
        req
      );

      // Fallback to fair roll
      const { dice1, dice2, isWin } = this.generateFairRoll();
      return {
        dice1,
        dice2,
        isWin,
        manipulationApplied: false,
        manipulationType: 'fair_fallback',
        error: error.message
      };
    }
  }

  /**
   * Generate fair dice roll (no manipulation)
   * @returns {Object} Fair dice results
   */
  generateFairRoll() {
    const dice1 = this.generateDiceRoll();
    const dice2 = this.generateDiceRoll();
    const isWin = dice1 === 6 && dice2 === 6;

    return { dice1, dice2, isWin };
  }

  /**
   * Generate biased win roll
   * @param {number} bias - Bias factor (0-1, higher = more likely to win)
   * @returns {Object} Biased dice results
   */
  generateBiasedWinRoll(bias = 0.8) {
    const random = this.generator();

    if (random < bias) {
      // Force a win (double 6)
      return { dice1: 6, dice2: 6, isWin: true };
    } else {
      // Generate fair losing roll
      let dice1, dice2;
      do {
        dice1 = this.generateDiceRoll();
        dice2 = this.generateDiceRoll();
      } while (dice1 === 6 && dice2 === 6);

      return { dice1, dice2, isWin: false };
    }
  }

  /**
   * Generate biased loss roll
   * @param {number} bias - Bias factor (0-1, higher = more likely to lose)
   * @returns {Object} Biased dice results
   */
  generateBiasedLossRoll(bias = 0.8) {
    const random = this.generator();

    if (random < bias) {
      // Force a loss (not double 6)
      let dice1, dice2;
      do {
        dice1 = this.generateDiceRoll();
        dice2 = this.generateDiceRoll();
      } while (dice1 === 6 && dice2 === 6);

      return { dice1, dice2, isWin: false };
    } else {
      // Allow fair win
      const dice1 = this.generateDiceRoll();
      const dice2 = this.generateDiceRoll();
      const isWin = dice1 === 6 && dice2 === 6;

      return { dice1, dice2, isWin };
    }
  }

  /**
   * Generate fixed win roll
   * @returns {Object} Fixed win results
   */
  generateFixedWinRoll() {
    return { dice1: 6, dice2: 6, isWin: true };
  }

  /**
   * Generate fixed loss roll
   * @returns {Object} Fixed loss results
   */
  generateFixedLossRoll() {
    // Generate any combination except double 6
    let dice1, dice2;
    do {
      dice1 = this.generateDiceRoll();
      dice2 = this.generateDiceRoll();
    } while (dice1 === 6 && dice2 === 6);

    return { dice1, dice2, isWin: false };
  }

  /**
   * Generate roll with custom win probability
   * @param {number} winProbability - Desired win probability (0-1)
   * @returns {Object} Custom probability results
   */
  generateCustomProbabilityRoll(winProbability = 0.0278) {
    const random = this.generator();

    if (random < winProbability) {
      // Force win
      return { dice1: 6, dice2: 6, isWin: true };
    } else {
      // Generate losing roll
      let dice1, dice2;
      do {
        dice1 = this.generateDiceRoll();
        dice2 = this.generateDiceRoll();
      } while (dice1 === 6 && dice2 === 6);

      return { dice1, dice2, isWin: false };
    }
  }

  /**
   * Generate specific dice values
   * @param {number} targetDice1 - Target value for dice 1 (1-6)
   * @param {number} targetDice2 - Target value for dice 2 (1-6)
   * @returns {Object} Specific dice results
   */
  generateSpecificDiceRoll(targetDice1, targetDice2) {
    // Validate target values
    const dice1 = (targetDice1 >= 1 && targetDice1 <= 6) ? targetDice1 : this.generateDiceRoll();
    const dice2 = (targetDice2 >= 1 && targetDice2 <= 6) ? targetDice2 : this.generateDiceRoll();
    const isWin = dice1 === 6 && dice2 === 6;

    return { dice1, dice2, isWin };
  }

  /**
   * Validate manipulation configuration
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration: must be an object');
    }

    const { mode, bias, winProbability, targetDice1, targetDice2 } = config;

    if (mode && !Object.values(MANIPULATION_MODES).includes(mode)) {
      throw new Error(`Invalid manipulation mode: ${mode}`);
    }

    if (bias !== undefined && (bias < 0 || bias > 1)) {
      throw new Error('Bias must be between 0 and 1');
    }

    if (winProbability !== undefined && (winProbability < 0 || winProbability > 1)) {
      throw new Error('Win probability must be between 0 and 1');
    }

    if (targetDice1 !== undefined && (targetDice1 < 1 || targetDice1 > 6)) {
      throw new Error('Target dice 1 must be between 1 and 6');
    }

    if (targetDice2 !== undefined && (targetDice2 < 1 || targetDice2 > 6)) {
      throw new Error('Target dice 2 must be between 1 and 6');
    }
  }

  /**
   * Log manipulation for auditing
   * @param {Object} logData - Data to log
   * @param {Object} req - Request object
   */
  async logManipulation(logData, req) {
    try {
      await createLog(
        'warning', // Use warning level for manipulations
        `Dice game manipulation applied: ${logData.manipulationType}`,
        'game_manipulation',
        logData.userId,
        'system',
        {
          ...logData,
          manipulationDetails: {
            mode: logData.mode,
            config: logData.config,
            result: logData.result
          }
        },
        req
      );
    } catch (logError) {
      console.error('Failed to log manipulation:', logError);
      // Don't throw error to avoid breaking the game
    }
  }

  /**
   * Get available manipulation modes
   * @returns {Object} Available modes
   */
  getAvailableModes() {
    return MANIPULATION_MODES;
  }

  /**
   * Calculate theoretical win probability for given configuration
   * @param {Object} config - Configuration
   * @returns {number} Theoretical win probability
   */
  calculateTheoreticalProbability(config) {
    const mode = config.mode || MANIPULATION_MODES.FAIR;

    switch (mode) {
      case MANIPULATION_MODES.FAIR:
        return 1/36; // ~0.0278

      case MANIPULATION_MODES.BIASED_WIN:
        return config.bias || 0.8;

      case MANIPULATION_MODES.BIASED_LOSS:
        return (1 - (config.bias || 0.8)) * (1/36);

      case MANIPULATION_MODES.FIXED_WIN:
        return 1.0;

      case MANIPULATION_MODES.FIXED_LOSS:
        return 0.0;

      case MANIPULATION_MODES.CUSTOM_PROBABILITY:
        return config.winProbability || 0.0278;

      case MANIPULATION_MODES.SPECIFIC_DICE:
        // Check if target is a winning combination
        return (config.targetDice1 === 6 && config.targetDice2 === 6) ? 1.0 : 0.0;

      default:
        return 1/36;
    }
  }
}

// Export singleton instance
const diceManipulationEngine = new DiceManipulationEngine();

module.exports = {
  DiceManipulationEngine,
  diceManipulationEngine,
  MANIPULATION_MODES
};