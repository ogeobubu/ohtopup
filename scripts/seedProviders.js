require('dotenv').config();
const mongoose = require("mongoose");
const { Provider } = require("../model/Provider");

const seedProviders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ohtopup");

    console.log("Connected to MongoDB");

    // Check if providers already exist
    const existingProviders = await Provider.countDocuments();
    if (existingProviders > 0) {
      console.log("Providers already exist. Skipping seeding.");
      return;
    }

    // Seed VTPass provider
    const vtpassProvider = new Provider({
      name: "vtpass",
      displayName: "VTPass",
      description: "Primary API provider for data and airtime services",
      isActive: true,
      isDefault: true,
      credentials: {
        userId: null, // VTPass doesn't use userId
        apiKey: process.env.VTPASS_API_KEY || "your-vtpass-api-key",
        secretKey: process.env.VTPASS_SECRET_KEY || "your-vtpass-secret-key",
        publicKey: process.env.VTPASS_PUBLIC_KEY || "your-vtpass-public-key",
      },
      baseUrl: process.env.VTPASS_URL || "https://sandbox.vtpass.com",
      endpoints: {
        walletBalance: "/api/balance",
        dataPurchase: "/api/pay",
        airtimePurchase: "/api/pay",
        cablePurchase: "/api/pay",
        electricityPurchase: "/api/pay",
        queryTransaction: "/api/requery",
        dataPlans: "/api/service-variations",
        serviceVariations: "/api/service-variations",
      },
      supportedServices: ["data", "airtime", "cable", "electricity"],
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
      },
      healthStatus: "healthy",
      responseTime: 1500, // 1.5 seconds average
      successRate: 98.5,
      totalRequests: 1000,
      successfulRequests: 985,
      failedRequests: 15,
    });

    // Seed Clubkonnect provider
    const clubkonnectProvider = new Provider({
      name: "clubkonnect",
      displayName: "Clubkonnect",
      description: "Alternative API provider for data services",
      isActive: true,
      isDefault: false,
      credentials: {
        userId: process.env.CLUBKONNECT_USER_ID || "CK101254158",
        apiKey: process.env.CLUBKONNECT_API_KEY || "QX5W7B6LK5YI37JA67TRRR59VQ95KS0DM3MBV0EZ5522464O9435X7YNH2N8876U",
      },
      baseUrl: "https://www.nellobytesystems.com",
      endpoints: {
        walletBalance: "/APIWalletBalanceV1.asp",
        dataPurchase: "/APIDatabundleV1.asp",
        airtimePurchase: "/APIAirtimeV1.asp",
        queryTransaction: "/APIQueryV1.asp",
        cancelTransaction: "/APICancelV1.asp",
      },
      supportedServices: ["data"],
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 500,
      },
      healthStatus: "healthy",
      responseTime: 2000, // 2 seconds average
      successRate: 97.2,
      totalRequests: 500,
      successfulRequests: 486,
      failedRequests: 14,
    });

    await vtpassProvider.save();
    await clubkonnectProvider.save();

    console.log("✅ Providers seeded successfully!");
    console.log("📊 VTPass Provider:", vtpassProvider._id);
    console.log("📊 Clubkonnect Provider:", clubkonnectProvider._id);

  } catch (error) {
    console.error("❌ Error seeding providers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
if (require.main === module) {
  seedProviders();
}

module.exports = seedProviders;