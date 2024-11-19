const generateConfirmationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateRandomAccountNumber = (bankCode) => {
  // Generate a random 10-digit account number
  // The first 3 digits should match the bank code
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${bankCode}${randomDigits.toString().slice(3)}`;
};

module.exports = {
  generateConfirmationCode,
  generateRandomAccountNumber
};
