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
  const now = new Intl.DateTimeFormat("en-GB", options).format(new Date());

  const [day, month, year, hour, minute] = now.replace(/\/|,|:/g, " ").split(" ");
  const dateStr = `${year}${month}${day}${hour}${minute}`;

  const randomStr = Math.random().toString(36).substring(2, 10);

  const requestId = dateStr + randomStr;

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
