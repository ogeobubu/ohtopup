require('dotenv').config();
const mongoose = require("mongoose");
const { Provider, NetworkProvider } = require("../model/Provider");

const updateServiceIds = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ohtopup");

    console.log("Connected to MongoDB");

    // Get the VTPass provider
    const vtpassProvider = await Provider.findOne({ name: "vtpass" });
    if (!vtpassProvider) {
      console.log("❌ VTPass provider not found");
      return;
    }

    console.log("Found VTPass provider:", vtpassProvider._id);

    // Correct service ID mappings for VTPass
    const serviceIdUpdates = {
      'mtn': 'mtn',
      'airtel': 'airtel',
      'glo': 'glo',
      '9mobile': 'etisalat'
    };

    // Update each network provider
    for (const [networkName, correctServiceId] of Object.entries(serviceIdUpdates)) {
      const networkProvider = await NetworkProvider.findOne({
        name: networkName,
        provider: vtpassProvider._id,
        serviceType: 'data'
      });

      if (networkProvider) {
        const oldServiceId = networkProvider.serviceId;
        if (oldServiceId !== correctServiceId) {
          networkProvider.serviceId = correctServiceId;
          await networkProvider.save();
          console.log(`✅ Updated ${networkName}: ${oldServiceId} -> ${correctServiceId}`);
        } else {
          console.log(`⚠️  ${networkName} already has correct serviceId: ${correctServiceId}`);
        }
      } else {
        console.log(`❌ ${networkName} network provider not found`);
      }
    }

    console.log("\n✅ Service ID updates completed!");

    // Display current state
    const updatedProviders = await NetworkProvider.find({
      provider: vtpassProvider._id,
      serviceType: 'data'
    }).sort({ priority: 1 });

    console.log("\n📋 Current VTPass Network Providers:");
    updatedProviders.forEach(np => {
      console.log(`  - ${np.displayName}: ${np.serviceId}`);
    });

  } catch (error) {
    console.error("❌ Error updating service IDs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the update function
if (require.main === module) {
  updateServiceIds();
}

module.exports = updateServiceIds;