// Script to clean up duplicate transactions in the database
// Run with: node scripts/cleanup-duplicate-transactions.js

require("dotenv").config();
const mongoose = require("mongoose");
const Transaction = require("../model/Transaction");

async function cleanupDuplicateTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log("Connected to MongoDB");

    // Find all transactions
    const allTransactions = await Transaction.find({}).sort({ createdAt: -1 });

    console.log(`Found ${allTransactions.length} total transactions`);

    // Group by reference to find duplicates
    const transactionsByReference = {};
    const duplicates = [];

    allTransactions.forEach(tx => {
      if (!transactionsByReference[tx.reference]) {
        transactionsByReference[tx.reference] = [];
      }
      transactionsByReference[tx.reference].push(tx);
    });

    // Find references with multiple transactions
    Object.keys(transactionsByReference).forEach(reference => {
      if (transactionsByReference[reference].length > 1) {
        // Keep the most recent transaction, mark others for deletion
        const sorted = transactionsByReference[reference].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Keep the first (most recent), delete the rest
        for (let i = 1; i < sorted.length; i++) {
          duplicates.push(sorted[i]._id);
        }

        console.log(`Reference ${reference}: ${sorted.length} duplicates found`);
      }
    });

    if (duplicates.length === 0) {
      console.log("No duplicate transactions found!");
      return;
    }

    console.log(`Found ${duplicates.length} duplicate transactions to remove`);

    // Remove duplicates
    const result = await Transaction.deleteMany({ _id: { $in: duplicates } });
    console.log(`Removed ${result.deletedCount} duplicate transactions`);

    // Verify cleanup
    const remainingTransactions = await Transaction.find({});
    console.log(`Remaining transactions: ${remainingTransactions.length}`);

  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupDuplicateTransactions();
}

module.exports = { cleanupDuplicateTransactions };