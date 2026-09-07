const generateConfirmationCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateRandomAccountNumber = (bankCode) => {
  const randomDigits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${bankCode}${randomDigits.toString().slice(3)}`;
};

function generateRequestId() {
  const options = {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', options).formatToParts(new Date()).map(p => [p.type, p.value]));
  const dateStr = `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`;
  const requestId = dateStr + require('crypto').randomBytes(8).toString('hex');

  return requestId;
}

const generateUniqueReferralCode = async () => {
  let code;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (await User.findOne({ referralCode: code }));
  
  return code;
};

module.exports = {
  generateConfirmationCode,
  generateRandomAccountNumber,
  generateRequestId,
  generateUniqueReferralCode
};
