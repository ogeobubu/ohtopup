require('dotenv').config();
const mongoose = require("mongoose");
const { Provider, NetworkProvider } = require("../model/Provider");

const seedNetworkProviders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ohtopup");

    console.log("Connected to MongoDB");

    // Get the providers
    const vtpassProvider = await Provider.findOne({ name: "vtpass" });
    const clubkonnectProvider = await Provider.findOne({ name: "clubkonnect" });

    if (!vtpassProvider) {
      console.log("❌ VTPass provider not found. Please run seedProviders.js first.");
      return;
    }

    console.log("Found providers:");
    console.log("📊 VTPass:", vtpassProvider._id);
    if (clubkonnectProvider) {
      console.log("📊 Clubkonnect:", clubkonnectProvider._id);
    }

    // Define network providers for VTPass
    const vtpassNetworks = [
      {
        name: "mtn",
        displayName: "MTN",
        serviceType: "data",
        serviceId: "mtn-data",
        priority: 1
      },
      {
        name: "airtel",
        displayName: "Airtel",
        serviceType: "data",
        serviceId: "airtel-data",
        priority: 2
      },
      {
        name: "glo",
        displayName: "Glo",
        serviceType: "data",
        serviceId: "glo-data",
        priority: 3
      },
      {
        name: "9mobile",
        displayName: "9mobile",
        serviceType: "data",
        serviceId: "9mobile-data",
        priority: 4
      }
    ];

    // Define network providers for Clubkonnect (if available)
    const clubkonnectNetworks = clubkonnectProvider ? [
      {
        name: "mtn",
        displayName: "MTN",
        serviceType: "data",
        serviceId: "01", // Clubkonnect uses numeric codes
        priority: 1
      },
      {
        name: "glo",
        displayName: "Glo",
        serviceType: "data",
        serviceId: "02",
        priority: 2
      },
      {
        name: "9mobile",
        displayName: "9mobile",
        serviceType: "data",
        serviceId: "03",
        priority: 3
      },
      {
        name: "airtel",
        displayName: "Airtel",
        serviceType: "data",
        serviceId: "04",
        priority: 4
      }
    ] : [];

    // Seed VTPass network providers
    console.log("\n🌐 Seeding VTPass network providers...");
    for (const network of vtpassNetworks) {
      const existing = await NetworkProvider.findOne({
        name: network.name,
        provider: vtpassProvider._id,
        serviceType: network.serviceType
      });

      if (existing) {
        console.log(`⚠️  ${network.displayName} (${network.serviceType}) already exists for VTPass`);
      } else {
        const networkProvider = new NetworkProvider({
          ...network,
          provider: vtpassProvider._id,
          isActive: true
        });
        await networkProvider.save();
        console.log(`✅ Created ${network.displayName} (${network.serviceType}) for VTPass`);
      }
    }

    // Seed Clubkonnect network providers (if provider exists)
    if (clubkonnectProvider) {
      console.log("\n🌐 Seeding Clubkonnect network providers...");
      for (const network of clubkonnectNetworks) {
        const existing = await NetworkProvider.findOne({
          name: network.name,
          provider: clubkonnectProvider._id,
          serviceType: network.serviceType
        });

        if (existing) {
          console.log(`⚠️  ${network.displayName} (${network.serviceType}) already exists for Clubkonnect`);
        } else {
          const networkProvider = new NetworkProvider({
            ...network,
            provider: clubkonnectProvider._id,
            isActive: true
          });
          await networkProvider.save();
          console.log(`✅ Created ${network.displayName} (${network.serviceType}) for Clubkonnect`);
        }
      }
    }

    console.log("\n✅ Network providers seeding completed!");

    // Display summary
    const totalNetworkProviders = await NetworkProvider.countDocuments();
    console.log(`📊 Total network providers in database: ${totalNetworkProviders}`);

    const activeNetworkProviders = await NetworkProvider.find({ isActive: true })
      .populate('provider', 'name displayName')
      .sort({ provider: 1, priority: 1 });

    console.log("\n📋 Active Network Providers:");
    activeNetworkProviders.forEach(np => {
      console.log(`  - ${np.displayName} (${np.serviceType}) -> ${np.provider.displayName} (Service ID: ${np.serviceId})`);
    });

  } catch (error) {
    console.error("❌ Error seeding network providers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the seeding function
if (require.main === module) {
  seedNetworkProviders();
}

module.exports = seedNetworkProviders;