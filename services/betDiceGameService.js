const crypto = require('crypto');
const { BetDiceGame, BetDiceGameSettings } = require('../model/BetDiceGame');
const User = require('../model/User');
const Wallet = require('../model/Wallet');
const accounting = require('./accountingService');
const { toKobo } = require('../utils/money');

const QUOTE_TTL_MS = 2 * 60 * 1000;
const fail = (status, message) => Object.assign(new Error(message), { status });
const money = kobo => kobo / 100;
const sign = value => crypto.createHmac('sha256', process.env.JWT_SECRET).update(value).digest('base64url');

const settings = async () => {
  const existing = await BetDiceGameSettings.findOne();
  return existing || BetDiceGameSettings.create({});
};
const target = difficulty => ({ easy: 'any_double', medium: 'double_4_plus', hard: 'double_5_plus', expert: 'double_6', legendary: 'three_of_kind' }[difficulty]);
const isWinner = (difficulty, dice) => ({
  easy: () => dice[0] === dice[1],
  medium: () => dice[0] === dice[1] && dice[0] >= 4,
  hard: () => dice[0] === dice[1] && dice[0] >= 5,
  expert: () => dice[0] === 6 && dice[1] === 6,
  legendary: () => dice.length >= 3 && dice.every(value => value === dice[0]),
}[difficulty]?.() || false);

const validateSelection = (config, { betAmount, difficulty, diceCount }) => {
  let betAmountKobo;
  try { betAmountKobo = toKobo(betAmount); } catch { throw fail(400, 'Bet amount must have at most two decimal places'); }
  const level = config.difficultyLevels?.[difficulty];
  if (!config.gameEnabled) throw fail(400, 'Bet Dice game is currently disabled');
  if (config.maintenanceMode) throw fail(400, 'Bet Dice game is under maintenance');
  if (!level?.enabled) throw fail(400, 'Difficulty level is not available');
  if (!Number.isInteger(Number(diceCount)) || diceCount < 2 || diceCount > config.maxDiceCount || (difficulty === 'legendary' && diceCount < 3)) throw fail(400, 'Invalid dice count');
  if (betAmountKobo < toKobo(config.minBetAmount) || betAmountKobo > toKobo(config.maxBetAmount)) throw fail(400, `Bet amount must be between ₦${config.minBetAmount} and ₦${config.maxBetAmount}`);
  const oddsHundredths = Math.ceil(level.oddsRange.min * 100);
  const entryFeeKobo = config.entryFee ? toKobo(config.entryFee) : 0;
  return { betAmountKobo, difficulty, diceCount: Number(diceCount), oddsHundredths, entryFeeKobo, probability: level.probability };
};

const issueQuote = async (userId, selection) => {
  const validated = validateSelection(await settings(), selection);
  const payload = { ...validated, userId: String(userId), quoteId: crypto.randomUUID(), expiresAt: Date.now() + QUOTE_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { quoteToken: `${encoded}.${sign(encoded)}`, expiresAt: new Date(payload.expiresAt), odds: payload.oddsHundredths / 100, betAmount: money(payload.betAmountKobo), entryFee: money(payload.entryFeeKobo), totalStake: money(payload.betAmountKobo + payload.entryFeeKobo), potentialPayout: money(Math.round(payload.betAmountKobo * payload.oddsHundredths / 100)) };
};

const verifyQuote = (token, userId) => {
  if (typeof token !== 'string' || token.length > 2000) throw fail(400, 'A valid game quote is required');
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) throw fail(400, 'A valid game quote is required');
  const expected = sign(encoded);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw fail(400, 'Game quote is invalid');
  let quote;
  try { quote = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw fail(400, 'Game quote is invalid'); }
  if (quote.userId !== String(userId)) throw fail(403, 'Game quote belongs to another user');
  if (!Number.isFinite(quote.expiresAt) || quote.expiresAt < Date.now()) throw fail(409, 'Game quote has expired');
  return quote;
};

const response = (game, wallet, duplicate = false) => {
  const publicGame = {
    id: game._id,
    betAmount: game.betAmount,
    odds: game.odds,
    difficulty: game.difficulty,
    diceCount: game.diceCount,
    dice: game.dice,
    targetCombination: game.targetCombination,
    isWin: game.isWin,
    winnings: game.winnings,
    payout: game.payout,
    gameResult: game.gameResult,
    playedAt: game.playedAt,
  };
  return { message: duplicate ? 'Game result already recorded' : game.isWin ? `Congratulations! You won ₦${game.winnings.toLocaleString()}!` : 'Better luck next time!', game: publicGame, newBalance: wallet.balance, duplicate };
};

const play = async ({ userId, idempotencyKey, quoteToken }) => {
  if (!idempotencyKey || idempotencyKey.length > 128) throw fail(400, 'A valid Idempotency-Key header is required');
  const quote = verifyQuote(quoteToken, userId);
  const operationKey = `${userId}:${idempotencyKey}`;
  const fingerprint = crypto.createHash('sha256').update(quoteToken).digest('hex');
  const existing = await BetDiceGame.findOne({ operationKey }).select('+requestFingerprint');
  if (existing) {
    if (existing.requestFingerprint !== fingerprint) throw fail(409, 'Idempotency-Key was already used with a different quote');
    return response(existing, await Wallet.findOne({ userId }), true);
  }
  const config = await settings();
  validateSelection(config, { betAmount: money(quote.betAmountKobo), difficulty: quote.difficulty, diceCount: quote.diceCount });
  const [user, wallet] = await Promise.all([User.findById(userId), Wallet.findOne({ userId })]);
  if (!user || !wallet) throw fail(404, 'User or wallet not found');
  const start = new Date(); start.setHours(0, 0, 0, 0);
  if (await BetDiceGame.countDocuments({ user: userId, playedAt: { $gte: start } }) >= config.riskManagement.maxDailyBetsPerUser) throw fail(429, 'Daily bet limit reached');
  const dice = Array.from({ length: quote.diceCount }, () => crypto.randomInt(1, 7));
  const won = isWinner(quote.difficulty, dice);
  const winningsKobo = won ? Math.round(quote.betAmountKobo * quote.oddsHundredths / 100) : 0;
  const expectedValueKobo = Math.round((quote.probability / 100) * winningsKobo - (1 - quote.probability / 100) * quote.betAmountKobo);
  const game = new BetDiceGame({ operationKey, requestFingerprint: fingerprint, quoteId: quote.quoteId, user: userId, betAmountKobo: quote.betAmountKobo, betAmount: money(quote.betAmountKobo), entryFeeKobo: quote.entryFeeKobo, oddsHundredths: quote.oddsHundredths, odds: quote.oddsHundredths / 100, difficulty: quote.difficulty, diceCount: quote.diceCount, dice, targetCombination: target(quote.difficulty), isWin: won, winningsKobo, winnings: money(winningsKobo), payout: money(winningsKobo), gameResult: won ? 'win' : 'lose', expectedValueKobo, expectedValue: money(expectedValueKobo), houseEdge: ((quote.betAmountKobo - expectedValueKobo) / quote.betAmountKobo) * 100 });
  try {
    const updatedWallet = await accounting.transact(async session => {
      await accounting.move({ walletId: wallet._id, deltaKobo: -(quote.betAmountKobo + quote.entryFeeKobo), key: `game:${game._id}:entry`, reason: 'Game entry', session });
      if (winningsKobo) await accounting.move({ walletId: wallet._id, deltaKobo: winningsKobo, key: `game:${game._id}:win`, reason: 'Game winnings', session });
      await BetDiceGame.create([game.toObject()], { session });
      return Wallet.findById(wallet._id).session(session);
    });
    return response(game, updatedWallet);
  } catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await BetDiceGame.findOne({ operationKey }).select('+requestFingerprint');
    if (!duplicate || duplicate.requestFingerprint !== fingerprint) throw fail(409, 'Idempotency-Key was already used with a different quote');
    return response(duplicate, await Wallet.findOne({ userId }), true);
  }
};

module.exports = { issueQuote, play, verifyQuote };
