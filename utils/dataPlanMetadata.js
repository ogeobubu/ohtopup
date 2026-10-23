// Catalogue descriptions are authoritative when imported fields contain codes or
// coarse categories. Never derive allowances or durations from purchase IDs.
const normalizeDataPlanMetadata = ({ name, dataAmount, validity }) => {
  const description = String(name || '');
  const capacities = description.match(/\d+(?:\.\d+)?\s*(?:MB|GB|TB)\b(?:\s+(?:night|weekend|social)(?:[- ]only)?\b)?/gi);
  const explicitAllowance = String(dataAmount || '').trim();
  const data = capacities
    ? capacities.map(value => value.replace(/(\d+(?:\.\d+)?)\s*(MB|GB|TB)/i, (_, amount, unit) => `${amount}${unit.toUpperCase()}`)).join(' + ')
    : /^\d+(?:\.\d+)?\s*(?:MB|GB|TB)$/i.test(explicitAllowance)
      ? explicitAllowance.replace(/\s+/g, '').toUpperCase() : 'Unknown';
  const durationPattern = /\b(\d+)\s*[- ]?\s*(hours?|days?|weeks?|months?)\b/i;
  const duration = description.match(durationPattern) || String(validity || '').match(durationPattern);
  return {
    dataAmount: data,
    validity: duration
      ? `${duration[1]} ${duration[2].toLowerCase().replace(/s$/, '')}${Number(duration[1]) === 1 ? '' : 's'}`
      : 'Unknown',
  };
};

module.exports = { normalizeDataPlanMetadata };
