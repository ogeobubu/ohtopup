const checkWalletForDebit = (wallet, amount) => {
    if (!wallet.isActive) {
      throw { status: 400, message: "Wallet is disabled. Transactions cannot be made." };
    }
  
    if (wallet.balance < amount) {
      throw { status: 400, message: "Insufficient funds in wallet." };
    }
  };
  
  const debitWallet = async (wallet, amount) => {
    wallet.balance -= amount;
    await wallet.save();
    return wallet;
  };
  
  
  module.exports = {
    checkWalletForDebit,
    debitWallet,
  };