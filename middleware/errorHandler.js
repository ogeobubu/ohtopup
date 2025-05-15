const handleServiceError = (err, req, res, next) => {
    console.error("Caught Error:", err);

    let status = 500;
    let message = "An unexpected error occurred.";
    let details = null;

    if (err.status && err.message) {
      status = err.status;
      message = err.message;
      details = err.details;
    }
    else if (err.isAxiosError) {
         status = err.response?.status || (err.request ? 504 : 500);
         message = err.response?.data?.message || err.message || "Error communicating with payment gateway.";
         details = err.response?.data;
    }
    else {

    }

     if (process.env.NODE_ENV === 'production' && status === 500 && !err.details) {
         message = "An internal server error occurred.";
         details = undefined;
     }


    res.status(status).json({
      message,
      ...details && { details },
    });
  };

  module.exports = {
    handleServiceError,
  };