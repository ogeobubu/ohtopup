const Utility = require("../model/Utility");
const Notification = require("../model/Notification");
const User = require("../model/User");
const walletService = require("./walletService");
const {
  sendTransactionEmailNotification,
  sendTransactionEmailAdminNotification
} = require("../controllers/email/sendTransactionEmailNotification");

const processPaymentApiResponse = (
  vtpassResponseData,
  requestedAmount,
  userId,
  requestId,
  serviceId,
  contactValue,
  optionalFields = {}
) => {
  const transactionData = vtpassResponseData?.content?.transactions;

  if (!transactionData) {
    console.error(
      "Unexpected VTPASS API response structure:",
      vtpassResponseData
    );
    throw {
      status: 502,
      message: "Unexpected response structure from payment gateway.",
    };
  }

  const {
    status: transactionStatus,
    type: transactionType,
    product_name: productName,
    total_amount: totalAmount,
    discount,
    commission: commissionRate,
  } = transactionData;

  const token = optionalFields.token;
  const units = optionalFields.units;
  const subscription_type = optionalFields.subscription_type;

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

    ...(token && { token }),
    ...(units && { units }),
    ...(subscription_type && { subscription_type }),
  });

  return newTransaction;
};

const handlePaymentOutcome = async (
  transaction,
  wallet,
  requestedAmount,
  userId,
  contactValue
) => {
  if (transaction.status === "failed") {
    console.warn(
      `VTPASS transaction ${transaction.requestId} failed. Status: ${transaction.status}. Product: ${transaction.product_name}`
    );
    await transaction.save();

    const notification = new Notification({
      userId: userId,
      title: `Transaction Failed: ${transaction.product_name}`,
      message: `Your transaction for ${transaction.product_name} (${contactValue}) failed. Amount: ${transaction.amount}.`,
      createdAt: new Date(),
      link: "/transactions",
    });
    notification
      .save()
      .catch((notifErr) =>
        console.error(
          "Failed to save failed transaction notification:",
          notifErr
        )
      );

    return {
      status: 400,
      message: "Transaction failed at payment gateway.",
      transactionDetails: {
        status: transaction.status,
        product_name: transaction.product_name,
        requestId: transaction.requestId,
        contact: contactValue,
        ...(transaction.token && { token: transaction.token }),
        ...(transaction.units && { units: transaction.units }),
        ...(transaction.subscription_type && {
          subscription_type: transaction.subscription_type,
        }),
      },
    };
  }

  try {
    await walletService.debitWallet(wallet, requestedAmount);

    await transaction.save();

    const notificationStatus =
      transaction.status === "delivered" ? "Successful" : "Pending";

    const user = await User.findById(userId);
    if (user && user.emailNotificationsEnabled) {
      await sendTransactionEmailNotification(user.email, user.username, {
        product_name: transaction.product_name,
        status: notificationStatus,
        amount: transaction.amount,
      });
    }

    await sendTransactionEmailAdminNotification(process.env.EMAIL_USER, "Admin", {
      product_name: transaction.product_name,
      status: notificationStatus,
      amount: transaction.amount,
    });

    const notification = new Notification({
      userId: userId,
      title: `Transaction ${notificationStatus}: ${transaction.product_name}`,
      message: `Your transaction for ${
        transaction.product_name
      } (${contactValue}) is ${notificationStatus.toLowerCase()}. Amount: ${
        transaction.amount
      }.`,
      createdAt: new Date(),
      link: "/transactions",
    });
    notification
      .save()
      .catch((notifErr) =>
        console.error(
          `Failed to save ${notificationStatus.toLowerCase()} transaction notification:`,
          notifErr
        )
      );

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
        ...(transaction.token && { token: transaction.token }),
        ...(transaction.units && { units: transaction.units }),
        ...(transaction.subscription_type && {
          subscription_type: transaction.subscription_type,
        }),
      },
      newBalance: wallet.balance,
    };
  } catch (dbError) {
    console.error("Database error after successful VTPASS API call:", dbError);
    console.error("Original DB Error details:", dbError);

    if (transaction && transaction._id) {
      transaction.localStatus = "review_needed";
      transaction.localErrorMessage = dbError.message;
      transaction
        .save()
        .catch((saveErr) =>
          console.error("Failed to mark transaction for review:", saveErr)
        );
    }

    throw {
      status: 500,
      message:
        "Transaction processed by payment gateway, but experienced a system error saving details. Contact support for reconciliation.",
    };
  }
};

module.exports = {
  processPaymentApiResponse,
  handlePaymentOutcome,
};
