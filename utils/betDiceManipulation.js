/**
 * Bet Dice Game Manipulation Algorithm
 *
 * This module provides a sophisticated algorithm for controlling bet dice game outcomes
 * with configurable parameters for win probability, outcome biases, and difficulty-based manipulation.
 *
 * Features:
 * - Difficulty-specific manipulation settings
 * - Pseudo-random number generation with optional seeding
 * - Multiple manipulation modes (fair, biased, fixed, custom probability)
 * - Configurable win probabilities per difficulty level
 * - Secure access controls with admin-only manipulation
 * - Comprehensive logging and auditing
 * - Error handling and validation
 */

const crypto = require('crypto');
const { createLog } = require('../controllers/systemLogController');

/**
 * Bet Dice Manipulation Modes
 */
const BET_DICE_MANIPULATION_MODES = {
  FAIR: 'fair',           // No manipulation, pure random
  BIASED_WIN: 'biased_win',     // Bias towards wins
  BIASED_LOSS: 'biased_loss',   // Bias towards losses
  FIXED_WIN: 'fixed_win',       // Always win
  FIXED_LOSS: 'fixed_loss',     // Always lose
  CUSTOM_PROBABILITY: 'custom_probability', // Custom win probability
  DIFFICULTY_BASED: 'difficulty_based' // Different probabilities per difficulty
};

/**
 * Difficulty Levels
 */
const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
  LEGENDARY: 'legendary'
};

/**
 * Bet Dice Manipulation Engine Class
 */
class BetDiceManipulationEngine {
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
   * Generate multiple dice rolls
   * @param {number} count - Number of dice to roll
   * @returns {Array} Array of dice values
   */
  generateDiceRolls(count) {
    const dice = [];
    for (let i = 0; i < count; i++) {
      dice.push(this.generateDiceRoll());
    }
    return dice;
  }

  /**
   * Apply manipulation to bet dice game based on configuration
   * @param {Object} config - Manipulation configuration
   * @param {string} difficulty - Game difficulty level
   * @param {number} diceCount - Number of dice
   * @param {string} userId - User ID for logging
   * @param {Object} req - Request object for logging
   * @returns {Object} Manipulated dice results
   */
  async applyManipulation(config, difficulty, diceCount, userId, req) {
    try {
      // Validate configuration
      this.validateConfig(config);

      const mode = config.mode || BET_DICE_MANIPULATION_MODES.FAIR;
      let dice, isWin, manipulationType;

      switch (mode) {
        case BET_DICE_MANIPULATION_MODES.FAIR:
          ({ dice, isWin } = this.generateFairBetDiceRoll(difficulty, diceCount));
          manipulationType = 'fair';
          break;

        case BET_DICE_MANIPULATION_MODES.BIASED_WIN:
          ({ dice, isWin } = this.generateBiasedWinBetDiceRoll(difficulty, diceCount, config.bias || 0.8));
          manipulationType = 'biased_win';
          break;

        case BET_DICE_MANIPULATION_MODES.BIASED_LOSS:
          ({ dice, isWin } = this.generateBiasedLossBetDiceRoll(difficulty, diceCount, config.bias || 0.8));
          manipulationType = 'biased_loss';
          break;

        case BET_DICE_MANIPULATION_MODES.FIXED_WIN:
          ({ dice, isWin } = this.generateFixedWinBetDiceRoll(difficulty, diceCount));
          manipulationType = 'fixed_win';
          break;

        case BET_DICE_MANIPULATION_MODES.FIXED_LOSS:
          ({ dice, isWin } = this.generateFixedLossBetDiceRoll(difficulty, diceCount));
          manipulationType = 'fixed_loss';
          break;

        case BET_DICE_MANIPULATION_MODES.CUSTOM_PROBABILITY:
          ({ dice, isWin } = this.generateCustomProbabilityBetDiceRoll(difficulty, diceCount, config.winProbability || 0.0278));
          manipulationType = 'custom_probability';
          break;

        case BET_DICE_MANIPULATION_MODES.DIFFICULTY_BASED:
          ({ dice, isWin } = this.generateDifficultyBasedBetDiceRoll(difficulty, diceCount, config));
          manipulationType = 'difficulty_based';
          break;

        default:
          ({ dice, isWin } = this.generateFairBetDiceRoll(difficulty, diceCount));
          manipulationType = 'fair';
      }

      // Log manipulation if not fair mode
      if (mode !== BET_DICE_MANIPULATION_MODES.FAIR) {
        await this.logManipulation({
          userId,
          difficulty,
          diceCount,
          mode,
          manipulationType,
          config,
          result: { dice, isWin },
          timestamp: new Date()
        }, req);
      }

      return {
        dice,
        isWin,
        manipulationApplied: mode !== BET_DICE_MANIPULATION_MODES.FAIR,
        manipulationType
      };

    } catch (error) {
      console.error('Error in bet dice manipulation:', error);

      // Log error
      await createLog(
        'error',
        `Bet dice manipulation error: ${error.message}`,
        'game',
        userId,
        'system',
        {
          error: error.message,
          config,
          difficulty,
          diceCount,
          timestamp: new Date()
        },
        req
      );

      // Fallback to fair roll
      const { dice, isWin } = this.generateFairBetDiceRoll(difficulty, diceCount);
      return {
        dice,
        isWin,
        manipulationApplied: false,
        manipulationType: 'fair_fallback',
        error: error.message
      };
    }
  }

  /**
   * Generate fair bet dice roll (no manipulation)
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @returns {Object} Fair dice results
   */
  generateFairBetDiceRoll(difficulty, diceCount) {
    const dice = this.generateDiceRolls(diceCount);
    const isWin = this.checkWinCondition(difficulty, dice, diceCount);
    return { dice, isWin };
  }

  /**
   * Generate biased win roll for bet dice
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @param {number} bias - Bias factor (0-1, higher = more likely to win)
   * @returns {Object} Biased dice results
   */
  generateBiasedWinBetDiceRoll(difficulty, diceCount, bias = 0.8) {
    if (!this.generator) {
      this.initializeGenerator();
    }

    const random = this.generator();

    if (random < bias) {
      // Force a win
      const dice = this.generateWinningDiceRoll(difficulty, diceCount);
      return { dice, isWin: true };
    } else {
      // Generate fair losing roll
      let dice, isWin;
      do {
        dice = this.generateDiceRolls(diceCount);
        isWin = this.checkWinCondition(difficulty, dice, diceCount);
      } while (isWin);

      return { dice, isWin: false };
    }
  }

  /**
   * Generate biased loss roll for bet dice
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @param {number} bias - Bias factor (0-1, higher = more likely to lose)
   * @returns {Object} Biased dice results
   */
  generateBiasedLossBetDiceRoll(difficulty, diceCount, bias = 0.8) {
    if (!this.generator) {
      this.initializeGenerator();
    }

    const random = this.generator();

    if (random < bias) {
      // Force a loss
      let dice, isWin;
      do {
        dice = this.generateDiceRolls(diceCount);
        isWin = this.checkWinCondition(difficulty, dice, diceCount);
      } while (isWin);

      return { dice, isWin: false };
    } else {
      // Allow fair win
      const dice = this.generateDiceRolls(diceCount);
      const isWin = this.checkWinCondition(difficulty, dice, diceCount);
      return { dice, isWin };
    }
  }

  /**
   * Generate fixed win roll for bet dice
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @returns {Object} Fixed win results
   */
  generateFixedWinBetDiceRoll(difficulty, diceCount) {
    const dice = this.generateWinningDiceRoll(difficulty, diceCount);
    return { dice, isWin: true };
  }

  /**
   * Generate fixed loss roll for bet dice
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @returns {Object} Fixed loss results
   */
  generateFixedLossBetDiceRoll(difficulty, diceCount) {
    let dice, isWin;
    do {
      dice = this.generateDiceRolls(diceCount);
      isWin = this.checkWinCondition(difficulty, dice, diceCount);
    } while (isWin);

    return { dice, isWin: false };
  }

  /**
   * Generate roll with custom win probability for bet dice
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @param {number} winProbability - Desired win probability (0-1)
   * @returns {Object} Custom probability results
   */
  generateCustomProbabilityBetDiceRoll(difficulty, diceCount, winProbability = 0.0278) {
    if (!this.generator) {
      this.initializeGenerator();
    }

    const random = this.generator();

    if (random < winProbability) {
      // Force win
      const dice = this.generateWinningDiceRoll(difficulty, diceCount);
      return { dice, isWin: true };
    } else {
      // Generate losing roll
      let dice, isWin;
      do {
        dice = this.generateDiceRolls(diceCount);
        isWin = this.checkWinCondition(difficulty, dice, diceCount);
      } while (isWin);

      return { dice, isWin: false };
    }
  }

  /**
   * Generate difficulty-based manipulation
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @param {Object} config - Configuration with difficulty-specific settings
   * @returns {Object} Difficulty-based results
   */
  generateDifficultyBasedBetDiceRoll(difficulty, diceCount, config) {
    if (!this.generator) {
      this.initializeGenerator();
    }

    // Get difficulty-specific win probability
    const difficultyConfig = config.difficultySettings?.[difficulty];
    const winProbability = difficultyConfig?.winProbability || this.getDefaultWinProbability(difficulty);

    const random = this.generator();

    if (random < winProbability) {
      // Force win
      const dice = this.generateWinningDiceRoll(difficulty, diceCount);
      return { dice, isWin: true };
    } else {
      // Generate losing roll
      let dice, isWin;
      do {
        dice = this.generateDiceRolls(diceCount);
        isWin = this.checkWinCondition(difficulty, dice, diceCount);
      } while (isWin);

      return { dice, isWin: false };
    }
  }

  /**
   * Generate a winning dice roll for given difficulty
   * @param {string} difficulty - Difficulty level
   * @param {number} diceCount - Number of dice
   * @returns {Array} Winning dice combination
   */
  generateWinningDiceRoll(difficulty, diceCount) {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        // Any double
        const value = Math.floor(Math.random() * 6) + 1;
        return [value, value];

      case DIFFICULTY_LEVELS.MEDIUM:
        // Double 4 or higher
        const medValue = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
        return [medValue, medValue];

      case DIFFICULTY_LEVELS.HARD:
        // Double 5 or higher
        const hardValue = Math.floor(Math.random() * 2) + 5; // 5 or 6
        return [hardValue, hardValue];

      case DIFFICULTY_LEVELS.EXPERT:
        // Double 6
        return [6, 6];

      case DIFFICULTY_LEVELS.LEGENDARY:
        // Three of a kind (requires 3+ dice)
        if (diceCount < 3) return [6, 6]; // Fallback
        const legValue = Math.floor(Math.random() * 6) + 1;
        return Array(diceCount).fill(legValue);

      default:
        return [6, 6]; // Default to double 6
    }
  }

  /**
   * Check win condition based on difficulty
   * @param {string} difficulty - Difficulty level
   * @param {Array} dice - Dice values
   * @param {number} diceCount - Number of dice
   * @returns {boolean} Whether it's a win
   */
  checkWinCondition(difficulty, dice, diceCount) {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        // Any double
        return dice.length >= 2 && dice[0] === dice[1];

      case DIFFICULTY_LEVELS.MEDIUM:
        // Double 4 or higher
        return dice.length >= 2 && dice[0] === dice[1] && dice[0] >= 4;

      case DIFFICULTY_LEVELS.HARD:
        // Double 5 or higher
        return dice.length >= 2 && dice[0] === dice[1] && dice[0] >= 5;

      case DIFFICULTY_LEVELS.EXPERT:
        // Double 6 only
        return dice.length >= 2 && dice[0] === 6 && dice[1] === 6;

      case DIFFICULTY_LEVELS.LEGENDARY:
        // Three of a kind
        if (diceCount < 3) return false;
        const firstValue = dice[0];
        return dice.every(die => die === firstValue);

      default:
        return false;
    }
  }

  /**
   * Get default win probability for difficulty level
   * @param {string} difficulty - Difficulty level
   * @returns {number} Default win probability
   */
  getDefaultWinProbability(difficulty) {
    const probabilities = {
      [DIFFICULTY_LEVELS.EASY]: 0.1667,     // 16.67%
      [DIFFICULTY_LEVELS.MEDIUM]: 0.0833,   // 8.33%
      [DIFFICULTY_LEVELS.HARD]: 0.0556,     // 5.56%
      [DIFFICULTY_LEVELS.EXPERT]: 0.0278,   // 2.78%
      [DIFFICULTY_LEVELS.LEGENDARY]: 0.0463 // 4.63%
    };
    return probabilities[difficulty] || 0.0278;
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

    const { mode, bias, winProbability, difficultySettings } = config;

    if (mode && !Object.values(BET_DICE_MANIPULATION_MODES).includes(mode)) {
      throw new Error(`Invalid manipulation mode: ${mode}`);
    }

    if (bias !== undefined && (bias < 0 || bias > 1)) {
      throw new Error('Bias must be between 0 and 1');
    }

    if (winProbability !== undefined && (winProbability < 0 || winProbability > 1)) {
      throw new Error('Win probability must be between 0 and 1');
    }

    if (difficultySettings) {
      Object.keys(difficultySettings).forEach(difficulty => {
        const setting = difficultySettings[difficulty];
        if (setting.winProbability !== undefined &&
            (setting.winProbability < 0 || setting.winProbability > 1)) {
          throw new Error(`Invalid win probability for ${difficulty}: must be between 0 and 1`);
        }
      });
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
        `Bet dice game manipulation applied: ${logData.manipulationType}`,
        'bet_dice_manipulation',
        logData.userId,
        'system',
        {
          ...logData,
          manipulationDetails: {
            mode: logData.mode,
            difficulty: logData.difficulty,
            diceCount: logData.diceCount,
            config: logData.config,
            result: logData.result
          }
        },
        req
      );
    } catch (logError) {
      console.error('Failed to log bet dice manipulation:', logError);
      // Don't throw error to avoid breaking the game
    }
  }

  /**
   * Get available manipulation modes
   * @returns {Object} Available modes
   */
  getAvailableModes() {
    return BET_DICE_MANIPULATION_MODES;
  }

  /**
   * Get available difficulty levels
   * @returns {Object} Available difficulty levels
   */
  getAvailableDifficulties() {
    return DIFFICULTY_LEVELS;
  }

  /**
   * Calculate theoretical win probability for given configuration
   * @param {Object} config - Configuration
   * @param {string} difficulty - Difficulty level
   * @returns {number} Theoretical win probability
   */
  calculateTheoreticalProbability(config, difficulty) {
    const mode = config.mode || BET_DICE_MANIPULATION_MODES.FAIR;

    switch (mode) {
      case BET_DICE_MANIPULATION_MODES.FAIR:
        return this.getDefaultWinProbability(difficulty);

      case BET_DICE_MANIPULATION_MODES.BIASED_WIN:
        return config.bias || 0.8;

      case BET_DICE_MANIPULATION_MODES.BIASED_LOSS:
        return (1 - (config.bias || 0.8)) * this.getDefaultWinProbability(difficulty);

      case BET_DICE_MANIPULATION_MODES.FIXED_WIN:
        return 1.0;

      case BET_DICE_MANIPULATION_MODES.FIXED_LOSS:
        return 0.0;

      case BET_DICE_MANIPULATION_MODES.CUSTOM_PROBABILITY:
        return config.winProbability || this.getDefaultWinProbability(difficulty);

      case BET_DICE_MANIPULATION_MODES.DIFFICULTY_BASED:
        const difficultyConfig = config.difficultySettings?.[difficulty];
        return difficultyConfig?.winProbability || this.getDefaultWinProbability(difficulty);

      default:
        return this.getDefaultWinProbability(difficulty);
    }
  }
}

// Export singleton instance
const betDiceManipulationEngine = new BetDiceManipulationEngine();

module.exports = {
  BetDiceManipulationEngine,
  betDiceManipulationEngine,
  BET_DICE_MANIPULATION_MODES,
  DIFFICULTY_LEVELS
};