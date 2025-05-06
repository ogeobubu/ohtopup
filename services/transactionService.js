const Utility = require('../model/Utility');
const Notification = require('../model/Notification');
const walletService = require('./walletService');


const processPaymentApiResponse = (responseData, requestedAmount, userId, requestId, serviceId, contactValue) => {
  const transactionData = responseData?.content?.transactions;

  if (!transactionData) {
     console.error("Unexpected VTPASS API response structure:", responseData);
    throw { status: 502, message: "Unexpected response structure from payment gateway." };
  }

  const {
    status: transactionStatus,
    type: transactionType,
    product_name: productName,
    total_amount: totalAmount,
    discount,
    commission: commissionRate,
  } = transactionData;

  const paymentMethod = "api";

  const newTransaction = new Utility({
    requestId: requestId,
    serviceID: serviceId,
    status: transactionStatus,
    type: transactionType,
    product_name: productName,
    amount: requestedAmount,
    phone: contactValue,
    revenue: totalAmount,
    user: userId,
    transactionDate: new Date(),
    discount,
    commissionRate,
    paymentMethod,
  });

  return newTransaction;
};

const handlePaymentOutcome = async (transaction, wallet, requestedAmount, userId, contactValue) => {
  if (transaction.status === "failed") {
    console.warn(`VTPASS transaction ${transaction.requestId} failed. Status: ${transaction.status}`);
    await transaction.save();
     const notification = new Notification({
        userId: userId,
        title: `Transaction Failed: ${transaction.product_name}`,
        message: `Your transaction for ${transaction.product_name} (${contactValue}) failed. Amount: ${transaction.amount}.`,
        createdAt: new Date(),
        link: "/transactions",
      });
     notification.save().catch(notifErr => console.error("Failed to save failed transaction notification:", notifErr));


    return {
      status: 400,
      message: "Transaction failed at payment gateway.",
      transactionDetails: {
         status: transaction.status,
         product_name: transaction.product_name,
         requestId: transaction.requestId,
         contact: contactValue 
      },
    };
  }


  try {
      await walletService.debitWallet(wallet, requestedAmount);
      await transaction.save();

      const notificationStatus = transaction.status === "delivered" ? "Successful" : "Pending";
      const notification = new Notification({
        userId: userId,
        title: `Transaction ${notificationStatus}: ${transaction.product_name}`,
        message: `Your transaction for ${transaction.product_name} (${contactValue}) is ${notificationStatus.toLowerCase()}. Amount: ${transaction.amount}.`,
        createdAt: new Date(),
        link: "/transactions",
      });
      notification.save().catch(notifErr => console.error(`Failed to save ${notificationStatus.toLowerCase()} transaction notification:`, notifErr));

      const responseStatus = transaction.status === "delivered" ? 201 : 202;

      return {
        status: responseStatus,
        message: `Transaction ${notificationStatus.toLowerCase()}!`,
        transactionDetails: {
          requestId: transaction.requestId,
          status: transaction.status,
          product_name: transaction.product_name,
          amount: transaction.amount,
          contact: contactValue, 
          transactionDate: transaction.transactionDate,
        },
        newBalance: wallet.balance,
      };

  } catch (dbError) {
      console.error("Database error after successful VTPASS API call:", dbError);
       console.error("Original DB Error details:", dbError);
       if (transaction && transaction._id) { 
           transaction.localStatus = 'review_needed'; 
           transaction.localError = dbError.message; 
           transaction.save().catch(saveErr => console.error("Failed to mark transaction for review:", saveErr));
       }


      throw { status: 500, message: "Transaction processed by payment gateway, but experienced a system error saving details. Contact support." };
  }
};


module.exports = {
  processPaymentApiResponse,
  handlePaymentOutcome,
};