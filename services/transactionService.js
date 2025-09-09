const Utility = require("../model/Utility");
const Notification = require("../model/Notification");
const User = require("../model/User");
const walletService = require("./walletService");
const { createLog } = require("../controllers/systemLogController");
const {
  sendTransactionEmailNotification
} = require("../controllers/email/sendTransactionEmailNotification");

const processPaymentApiResponse = async (
  apiResponseData,
  requestedAmount,
  userId,
  requestId,
  serviceId,
  contactValue,
  optionalFields = {}
) => {
  // Extract enhanced data purchase details from optionalFields
  const {
    provider,
    network,
    dataPlan,
    dataAmount,
    validity,
    transactionType = 'data',
    commissionAmount,
    adjustedAmount
  } = optionalFields;
  let transactionData;

  // Handle different response structures based on provider
  if (apiResponseData?.content?.transactions) {
    // VTPass response structure (data, airtime, cable)
    transactionData = apiResponseData.content.transactions;
  } else if (apiResponseData?.code === "000" && apiResponseData?.content) {
    // VTPass electricity response structure
    transactionData = {
      status: apiResponseData.content.transactions?.status || 'delivered',
      type: transactionType,
      product_name: apiResponseData.content.transactions?.product_name || 'Electricity Purchase',
      total_amount: apiResponseData.amount || requestedAmount,
      discount: 0,
      commission: apiResponseData.content.transactions?.commission || 0,
    };
  } else if (apiResponseData?.success !== undefined && apiResponseData?.status !== undefined) {
    // Clubkonnect response structure - check for both success and status properties
    const mappedStatus = mapClubkonnectStatus(apiResponseData.status) || 'pending';

    transactionData = {
      status: mappedStatus,
      type: transactionType || 'data',
      product_name: `${transactionType === 'data' ? 'Data Plan' : transactionType === 'airtime' ? 'Airtime' : 'Service'} (${contactValue})`,
      total_amount: requestedAmount,
      discount: 0,
      commission: 0,
      // Store original Clubkonnect status for better error handling
      providerStatus: apiResponseData.status,
      providerResponse: apiResponseData.rawResponse || apiResponseData,
    };
  } else {
    // Fallback for other structures
    transactionData = apiResponseData;
  }

  if (!transactionData) {
    await createLog(
      'error',
      'Payment gateway returned unexpected response structure',
      'payment',
      userId,
      null,
      {
        requestId,
        serviceId,
        hasTransactionData: false,
        responseKeys: Object.keys(apiResponseData || {}),
        responseStructure: apiResponseData ? JSON.stringify(apiResponseData).substring(0, 500) : 'No response data'
      }
    );

    throw {
      status: 502,
      message: "Payment gateway communication error. Please try again or contact support.",
    };
  }

  const {
    status: transactionStatus,
    type: transactionDataType,
    product_name: productName,
    total_amount: totalAmount,
    discount,
    commission: commissionRate,
  } = transactionData;

  // Provide fallback values for required fields if missing from API response
  const getProductNameFallback = (type) => {
    switch (type) {
      case 'data': return 'Data Plan Purchase';
      case 'airtime': return 'Airtime Purchase';
      case 'cable': return 'Cable TV Purchase';
      case 'electricity': return 'Electricity Purchase';
      default: return 'Service Purchase';
    }
  };
  const finalProductName = productName || getProductNameFallback(transactionType);
  const finalTotalAmount = totalAmount || requestedAmount;
  const finalCommissionRate = commissionRate || 0;
  const finalDiscount = discount !== undefined ? discount : 0;

  console.log('Transaction Data Extraction:', {
    original: {
      productName,
      totalAmount,
      commissionRate,
      discount,
      transactionStatus,
      transactionDataType
    },
    fallback: {
      finalProductName,
      finalTotalAmount,
      finalCommissionRate,
      finalDiscount,
      transactionType
    }
  });

  const token = optionalFields.token;
  const units = optionalFields.units;
  const subscription_type = optionalFields.subscription_type;

  const paymentMethod = "api";

  const newTransaction = new Utility({
    requestId: requestId,
    serviceID: serviceId,
    status: transactionStatus,
    type: transactionDataType || transactionType || 'data', // Use transactionType from optionalFields if available
    product_name: finalProductName,
    amount: requestedAmount,
    phone: contactValue,
    revenue: finalTotalAmount,
    user: userId,
    transactionDate: new Date(),
    discount: finalDiscount,
    commissionRate: commissionAmount ? (commissionAmount / requestedAmount) * 100 : finalCommissionRate, // Store as percentage
    paymentMethod,

    // Enhanced data purchase fields
    ...(provider && { provider }),
    ...(network && { network }),
    ...(dataPlan && { dataPlan }),
    ...(dataAmount && { dataAmount }),
    ...(validity && { validity }),
    ...(apiResponseData?.status && { providerStatus: apiResponseData.status }),
    ...(apiResponseData && { providerResponse: apiResponseData }),
    transactionType,

    // Enhanced VTPass error details for admin debugging
    ...(apiResponseData?.code && { vtpassResponseCode: apiResponseData.code }),
    ...(apiResponseData?.response_description && { vtpassResponseDescription: apiResponseData.response_description }),
    ...(apiResponseData?.content?.transactions?.transactionId && { vtpassTransactionId: apiResponseData.content.transactions.transactionId }),
    ...(apiResponseData?.content?.transactions?.status && { vtpassTransactionStatus: apiResponseData.content.transactions.status }),
    ...(apiResponseData?.requestId && { vtpassRequestId: apiResponseData.requestId }),

    // Commission fields for airtime
    ...(commissionAmount && { commissionAmount }),
    ...(adjustedAmount && { adjustedAmount }),

    ...(token && { token }),
    ...(units && { units }),
    ...(subscription_type && { subscription_type }),
  });

  console.log('Transaction Service - Created transaction object:', {
    id: newTransaction._id,
    requestId: newTransaction.requestId,
    type: newTransaction.type,
    product_name: newTransaction.product_name,
    status: newTransaction.status,
    amount: newTransaction.amount,
    user: newTransaction.user,
    transactionType: newTransaction.transactionType
  });

  // Ensure the transaction is a proper Mongoose model instance
  console.log('Transaction Service - Checking transaction object:', {
    isMongooseModel: newTransaction instanceof Utility,
    hasSaveMethod: typeof newTransaction.save === 'function',
    constructorName: newTransaction.constructor.name,
    prototype: Object.getPrototypeOf(newTransaction)
  });

  if (!(newTransaction instanceof Utility)) {
    console.error('Transaction Service - Transaction is not a Mongoose model instance!');
    console.error('Transaction object details:', newTransaction);
    throw new Error('Failed to create valid transaction object');
  }

  // Verify save method exists
  if (typeof newTransaction.save !== 'function') {
    console.error('Transaction Service - Transaction object missing save method!');
    console.error('Transaction object keys:', Object.keys(newTransaction));
    console.error('Transaction object prototype:', Object.getPrototypeOf(newTransaction));
    throw new Error('Transaction object is corrupted');
  }

  console.log('Transaction Service - Transaction validation passed');
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
    // Generate user-friendly error message based on provider
    const errorDetails = transaction.provider === 'vtpass'
      ? getVTPassErrorDetails(transaction)
      : getClubkonnectErrorDetails(transaction);

    // Log failed transaction without revealing 3rd party API name
    await createLog(
      'warning',
      `Payment transaction ${transaction.requestId} failed: ${errorDetails.providerStatus || 'Unknown error'}`,
      'payment',
      userId,
      null,
      {
        requestId: transaction.requestId,
        serviceID: transaction.serviceID,
        amount: transaction.amount,
        status: transaction.status,
        productName: transaction.product_name,
        contact: contactValue,
        providerStatus: errorDetails.providerStatus,
        errorType: errorDetails.errorType
      }
    );

    await transaction.save();

    // Log failed transaction with detailed error info
    await createLog(
      'error',
      `Transaction failed: ${transaction.product_name} for ${contactValue} - ${errorDetails.message}`,
      'transaction',
      userId,
      null,
      {
        requestId: transaction.requestId,
        serviceID: transaction.serviceID,
        amount: transaction.amount,
        status: transaction.status,
        contact: contactValue,
        productName: transaction.product_name,
        providerStatus: errorDetails.providerStatus,
        errorType: errorDetails.errorType,
        userMessage: errorDetails.userMessage,
        canRetry: errorDetails.canRetry
      }
    );

    const notification = new Notification({
      userId: userId,
      title: `Transaction Failed: ${transaction.product_name}`,
      message: `${errorDetails.userMessage} Amount: ${transaction.amount}. ${errorDetails.canRetry ? 'Please try again.' : 'Contact support if this persists.'}`,
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
      message: errorDetails.userMessage,
      errorDetails: {
        type: errorDetails.errorType,
        canRetry: errorDetails.canRetry,
        providerStatus: errorDetails.providerStatus
      },
      transactionDetails: {
        status: transaction.status,
        product_name: transaction.product_name,
        requestId: transaction.requestId,
        contact: contactValue,
        // Enhanced data purchase fields
        ...(transaction.provider && { provider: transaction.provider }),
        ...(transaction.network && { network: transaction.network }),
        ...(transaction.dataPlan && { dataPlan: transaction.dataPlan }),
        ...(transaction.dataAmount && { dataAmount: transaction.dataAmount }),
        ...(transaction.validity && { validity: transaction.validity }),
        ...(transaction.transactionType && { transactionType: transaction.transactionType }),
        ...(transaction.token && { token: transaction.token }),
        ...(transaction.units && { units: transaction.units }),
        ...(transaction.subscription_type && {
          subscription_type: transaction.subscription_type,
        }),
        // Include VTPass error details for admin debugging
        ...(transaction.vtpassResponseCode && { vtpassResponseCode: transaction.vtpassResponseCode }),
        ...(transaction.vtpassResponseDescription && { vtpassResponseDescription: transaction.vtpassResponseDescription }),
        ...(transaction.vtpassTransactionId && { vtpassTransactionId: transaction.vtpassTransactionId }),
        ...(transaction.vtpassTransactionStatus && { vtpassTransactionStatus: transaction.vtpassTransactionStatus }),
        ...(transaction.vtpassRequestId && { vtpassRequestId: transaction.vtpassRequestId }),
        ...(transaction.providerResponse && { providerResponse: transaction.providerResponse }),
      },
    };
  }

  try {
    await walletService.debitWallet(wallet, requestedAmount);

    console.log('Transaction Service - About to save transaction:', {
      id: transaction._id,
      requestId: transaction.requestId,
      type: transaction.type,
      status: transaction.status,
      product_name: transaction.product_name,
      amount: transaction.amount,
      revenue: transaction.revenue,
      commissionRate: transaction.commissionRate,
      user: transaction.user
    });

    try {
      await transaction.save();
      console.log('Transaction Service - Transaction saved successfully:', {
        id: transaction._id,
        requestId: transaction.requestId,
        type: transaction.type,
        status: transaction.status
      });
    } catch (saveError) {
      console.error('Transaction Service - Failed to save transaction:', {
        error: saveError.message,
        validationErrors: saveError.errors,
        transactionData: {
          requestId: transaction.requestId,
          type: transaction.type,
          product_name: transaction.product_name,
          amount: transaction.amount,
          revenue: transaction.revenue,
          commissionRate: transaction.commissionRate,
          user: transaction.user
        }
      });
      throw saveError; // Re-throw to be handled by error handler
    }

    // Log successful transaction
    const logLevel = transaction.status === "delivered" ? 'info' : 'warning';
    const logMessage = transaction.status === "delivered"
      ? `Transaction completed: ${transaction.product_name} for ${contactValue}`
      : `Transaction pending: ${transaction.product_name} for ${contactValue}`;

    await createLog(
      logLevel,
      logMessage,
      'transaction',
      userId,
      null,
      {
        requestId: transaction.requestId,
        serviceID: transaction.serviceID,
        amount: transaction.amount,
        status: transaction.status,
        contact: contactValue,
        productName: transaction.product_name,
        revenue: transaction.revenue,
        discount: transaction.discount
      }
    );

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

    // Admin notification email removed to prevent timeout delays

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
        // Enhanced data purchase fields
        ...(transaction.provider && { provider: transaction.provider }),
        ...(transaction.network && { network: transaction.network }),
        ...(transaction.dataPlan && { dataPlan: transaction.dataPlan }),
        ...(transaction.dataAmount && { dataAmount: transaction.dataAmount }),
        ...(transaction.validity && { validity: transaction.validity }),
        ...(transaction.transactionType && { transactionType: transaction.transactionType }),
        ...(transaction.token && { token: transaction.token }),
        ...(transaction.units && { units: transaction.units }),
        ...(transaction.subscription_type && {
          subscription_type: transaction.subscription_type,
        }),
        // Include VTPass error details for admin debugging
        ...(transaction.vtpassResponseCode && { vtpassResponseCode: transaction.vtpassResponseCode }),
        ...(transaction.vtpassResponseDescription && { vtpassResponseDescription: transaction.vtpassResponseDescription }),
        ...(transaction.vtpassTransactionId && { vtpassTransactionId: transaction.vtpassTransactionId }),
        ...(transaction.vtpassTransactionStatus && { vtpassTransactionStatus: transaction.vtpassTransactionStatus }),
        ...(transaction.vtpassRequestId && { vtpassRequestId: transaction.vtpassRequestId }),
        ...(transaction.providerResponse && { providerResponse: transaction.providerResponse }),
      },
      newBalance: wallet.balance,
    };
  } catch (dbError) {
    // Log database error without revealing 3rd party API name
    await createLog(
      'error',
      `Database error after successful payment processing: ${dbError.message}`,
      'transaction',
      userId,
      null,
      {
        requestId: transaction.requestId,
        serviceID: transaction.serviceID,
        amount: transaction.amount,
        contact: contactValue,
        productName: transaction.product_name,
        dbError: dbError.message,
        needsReview: true
      }
    );

    // Log database error for transaction that needs review
    await createLog(
      'error',
      `Transaction database error: ${transaction.product_name} for ${contactValue}`,
      'transaction',
      userId,
      null,
      {
        requestId: transaction.requestId,
        serviceID: transaction.serviceID,
        amount: transaction.amount,
        status: transaction.status,
        contact: contactValue,
        productName: transaction.product_name,
        error: dbError.message,
        needsReview: true
      }
    );

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

// Helper function to map Clubkonnect status to valid enum values
function mapClubkonnectStatus(clubkonnectStatus) {
  if (!clubkonnectStatus) return 'pending';

  const statusMap = {
    'INVALID_MOBILENETWORK': 'failed',
    'INVALID_DATAPLAN': 'failed',
    'INSUFFICIENT_BALANCE': 'failed',
    'ORDER_RECEIVED': 'pending',
    'ORDER_COMPLETED': 'delivered',
    'ORDER_FAILED': 'failed',
    'ORDER_CANCELLED': 'failed',
    'PENDING': 'pending',
    'SUCCESS': 'delivered',
    'FAILED': 'failed'
  };

  return statusMap[clubkonnectStatus] || 'pending';
}

// Helper function to get detailed error information for VTPass failures
function getVTPassErrorDetails(transaction) {
  const providerStatus = transaction.providerStatus || 'UNKNOWN_ERROR';
  const providerResponse = transaction.providerResponse || {};

  // Check VTPass response code first
  const responseCode = providerResponse.code;
  const responseDescription = providerResponse.response_description;
  const transactionStatus = providerResponse.content?.transactions?.status;

  console.log('VTPass Error Analysis:', {
    responseCode,
    responseDescription,
    transactionStatus,
    providerStatus
  });

  // Handle VTPass response codes
  if (responseCode !== "000") {
    // Non-success response codes
    const errorMap = {
      '001': {
        message: 'Transaction pending',
        userMessage: 'Your transaction is being processed. Please wait a few minutes.',
        errorType: 'transaction_pending',
        canRetry: false
      },
      '002': {
        message: 'Invalid request parameters',
        userMessage: 'Invalid request parameters. Please check your input and try again.',
        errorType: 'invalid_request',
        canRetry: true
      },
      '003': {
        message: 'Service temporarily unavailable',
        userMessage: 'The airtime service is temporarily unavailable. Please try again in a few minutes.',
        errorType: 'service_unavailable',
        canRetry: true
      },
      '004': {
        message: 'Insufficient balance',
        userMessage: 'Service temporarily unavailable due to provider balance. Please try again later.',
        errorType: 'provider_balance',
        canRetry: false
      },
      '005': {
        message: 'Transaction failed',
        userMessage: 'Your airtime purchase could not be completed. Please try again.',
        errorType: 'transaction_failed',
        canRetry: true
      },
      '016': {
        message: 'Transaction failed',
        userMessage: 'Your airtime purchase failed. This could be due to insufficient funds or network issues. Please try again.',
        errorType: 'transaction_failed',
        canRetry: true
      },
      '017': {
        message: 'Transaction declined',
        userMessage: 'Your airtime purchase was declined. Please check your account balance and try again.',
        errorType: 'transaction_declined',
        canRetry: true
      },
      '018': {
        message: 'Transaction timeout',
        userMessage: 'Your transaction timed out. Please try again.',
        errorType: 'transaction_timeout',
        canRetry: true
      },
      '019': {
        message: 'Service unavailable',
        userMessage: 'The airtime service is temporarily unavailable. Please try again in a few minutes.',
        errorType: 'service_unavailable',
        canRetry: true
      },
      '020': {
        message: 'Invalid amount',
        userMessage: 'The purchase amount is invalid. Please check the amount and try again.',
        errorType: 'invalid_amount',
        canRetry: true
      }
    };

    return errorMap[responseCode] || {
      message: responseDescription || 'Transaction failed',
      userMessage: responseDescription || 'Your airtime purchase failed. Please try again or contact support if the issue persists.',
      errorType: 'transaction_failed',
      canRetry: true,
      providerStatus: responseCode
    };
  }

  // Handle transaction status for successful response codes
  if (transactionStatus !== "delivered") {
    const statusMap = {
      'failed': {
        message: 'Transaction failed',
        userMessage: 'Your airtime purchase failed. Please try again.',
        errorType: 'transaction_failed',
        canRetry: true
      },
      'pending': {
        message: 'Transaction pending',
        userMessage: 'Your transaction is being processed. Please wait a few minutes.',
        errorType: 'transaction_pending',
        canRetry: false
      },
      'processing': {
        message: 'Transaction processing',
        userMessage: 'Your transaction is being processed. Please wait.',
        errorType: 'transaction_processing',
        canRetry: false
      }
    };

    return statusMap[transactionStatus] || {
      message: `Transaction status: ${transactionStatus}`,
      userMessage: 'Your transaction status is unclear. Please contact support if you have concerns.',
      errorType: 'unknown_status',
      canRetry: false,
      providerStatus: transactionStatus
    };
  }

  // Fallback for other error conditions
  return {
    message: 'Transaction failed',
    userMessage: 'Your airtime purchase failed. Please try again or contact support if the issue persists.',
    errorType: 'transaction_failed',
    canRetry: true,
    providerStatus
  };
}

// Helper function to get detailed error information for Clubkonnect failures
function getClubkonnectErrorDetails(transaction) {
  const providerStatus = transaction.providerStatus || 'UNKNOWN_ERROR';

  const errorMap = {
    'INVALID_MOBILENETWORK': {
      message: 'Invalid mobile network detected',
      userMessage: 'The phone number provided is not valid for this network. Please check the number and try again.',
      errorType: 'invalid_network',
      canRetry: true
    },
    'INVALID_DATAPLAN': {
      message: 'Invalid data plan selected',
      userMessage: 'The selected data plan is not available. Please choose a different plan.',
      errorType: 'invalid_plan',
      canRetry: true
    },
    'INSUFFICIENT_BALANCE': {
      message: 'Provider balance insufficient',
      userMessage: 'Service temporarily unavailable due to provider balance. Please try again later.',
      errorType: 'provider_balance',
      canRetry: false
    },
    'ORDER_FAILED': {
      message: 'Order processing failed',
      userMessage: 'Your data purchase could not be completed. Please try again.',
      errorType: 'order_failed',
      canRetry: true
    },
    'ORDER_CANCELLED': {
      message: 'Order was cancelled',
      userMessage: 'Your data purchase was cancelled. Please try again.',
      errorType: 'order_cancelled',
      canRetry: true
    },
    'FAILED': {
      message: 'Transaction failed',
      userMessage: 'Your data purchase failed. Please try again.',
      errorType: 'transaction_failed',
      canRetry: true
    }
  };

  return errorMap[providerStatus] || {
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    errorType: 'unknown_error',
    canRetry: true,
    providerStatus
  };
}

module.exports = {
  processPaymentApiResponse,
  handlePaymentOutcome,
  mapClubkonnectStatus,
  getVTPassErrorDetails,
  getClubkonnectErrorDetails,
};
