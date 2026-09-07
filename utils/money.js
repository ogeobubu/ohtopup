// API amounts are naira; accounting amounts are safe integer kobo.
const toKobo = (value, { allowZero = false } = {}) => {
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '') {
    throw Object.assign(new Error('Invalid amount'), { status: 400 });
  }
  const amount = Number(value);
  const kobo = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(kobo) ||
      Math.abs(amount * 100 - kobo) > 0.000001 || kobo < (allowZero ? 0 : 1)) {
    throw Object.assign(new Error('Amount must be positive with at most two decimal places'), { status: 400 });
  }
  return kobo;
};
module.exports = { toKobo };
