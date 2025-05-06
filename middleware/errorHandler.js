const handleServiceError = (err, res) => {
    console.error("Caught Error:", err); // Always log the full error on the server
  
    let status = 500; // Default to Internal Server Error
    let message = "An unexpected error occurred.";
    let details = null; // To potentially include more specific API error details
  
    // Handle custom errors thrown by services ({ status, message, details? })
    if (err.status && err.message) {
      status = err.status;
      message = err.message;
      details = err.details; // Pass through any specific details
    }
    // Handle Axios errors (e.g., from vtpassService)
    else if (err.isAxiosError) {
        // Axios errors already handled and re-thrown in vtpassService
        // with status, message, details structure, but as a fallback:
         status = err.response?.status || (err.request ? 504 : 500); // Use API status, 504 for no response, 500 otherwise
         message = err.response?.data?.message || err.message || "Error communicating with payment gateway.";
         details = err.response?.data; // Include API response data
  
         // You could add specific VTPASS error code mapping here if needed,
         // but vtpassService already maps major HTTP/network errors.
         // For specific VTPASS *business* codes (like 018, 027 etc. within a 2xx response),
         // vtpassService or transactionService should ideally throw
         // an error with a mapped message and a relevant status (like 400 or 424).
         // Our custom error structure { status, message, details } handles this.
  
    }
    // Handle other unexpected errors (e.g., Mongoose errors during saves)
    else {
      // Default 500 is already set
      // message = "An unexpected server error occurred."; // Could make this more generic
      // The console.error above logs the specific technical error (e.g., Mongoose validation error)
    }
  
     if (process.env.NODE_ENV === 'production' && status === 500 && !err.details) {
         message = "An internal server error occurred.";
         details = undefined; // Ensure details is not sent for generic 500
     }
  
  
    res.status(status).json({
      message,
      ...details && { details }, // Conditionally include details if they exist
    });
  };
  
  module.exports = {
    handleServiceError,
  };