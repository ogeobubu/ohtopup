// dbService.js

const User = require('../model/User');
const Wallet = require('../model/Wallet');

const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found." };
  }
  return user;
};

const findWalletByUserId = async (userId) => {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    throw { status: 404, message: "Wallet not found for user." };
  }
  return wallet;
};

module.exports = {
  findUserById,
  findWalletByUserId,
};