require('dotenv').config();
const mongoose = require('mongoose');
const Tutorial = require('../model/Tutorial');

async function createSampleTutorials() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ohtopup');

    // Clear existing tutorials
    await Tutorial.deleteMany({});

    const sampleTutorials = [
      {
        title: "Creating Your OhTopUp Account",
        description: "Learn how to sign up and verify your account in just a few simple steps. This comprehensive guide will walk you through the entire registration process.",
        category: "getting-started",
        duration: "5 min",
        difficulty: "Beginner",
        type: "text",
        steps: [
          "Navigate to the OhTopUp website and click on the Sign Up button in the top right corner",
          "Enter your email address and create a strong password (at least 8 characters with numbers and symbols)",
          "Provide your phone number for account verification and two-factor authentication",
          "Check your email for a verification code and enter it in the provided field",
          "Set up your security PIN for quick transactions and account protection",
          "Complete your profile by adding your full name and any additional information requested",
          "Verify your phone number by entering the SMS code sent to your device",
          "Congratulations! Your account is now active and ready to use"
        ],
        popular: true,
        isActive: true,
        order: 1
      },
      {
        title: "Recharging Airtime Instantly",
        description: "Step-by-step guide to recharge your mobile phone across all networks. Learn how to top up your phone credit quickly and securely.",
        category: "payments",
        duration: "4 min",
        difficulty: "Beginner",
        type: "text",
        steps: [
          "Log in to your OhTopUp account and navigate to the Utilities section",
          "Click on 'Airtime' from the available utility options",
          "Select your mobile network provider (MTN, Glo, Airtel, or 9mobile)",
          "Enter the phone number you want to recharge",
          "Choose the amount you want to recharge (from ₦100 to ₦50,000)",
          "Review your order details and click 'Proceed to Payment'",
          "Complete payment using your preferred method (Card, Bank Transfer, or Wallet)",
          "Receive instant confirmation and airtime credit on your phone"
        ],
        popular: true,
        isActive: true,
        order: 2
      },
      {
        title: "Purchasing Data Bundles",
        description: "Learn how to buy data plans for seamless internet connectivity. Choose from various data packages for all networks.",
        category: "payments",
        duration: "6 min",
        difficulty: "Beginner",
        type: "text",
        steps: [
          "Access your OhTopUp dashboard and click on 'Data' in the Utilities menu",
          "Select your preferred network provider from the available options",
          "Browse through available data plans (Daily, Weekly, Monthly packages)",
          "Choose the data amount and validity period that suits your needs",
          "Enter the phone number where you want the data delivered",
          "Review the plan details including price and data amount",
          "Complete payment using card, bank transfer, or wallet balance",
          "Receive instant data activation confirmation via SMS"
        ],
        popular: true,
        isActive: true,
        order: 3
      },
      {
        title: "Paying Electricity Bills Online",
        description: "Complete guide to paying electricity bills and getting tokens instantly. Never miss a payment deadline again.",
        category: "payments",
        duration: "7 min",
        difficulty: "Intermediate",
        type: "text",
        steps: [
          "Go to the Utilities section and select 'Electricity' from the options",
          "Choose your electricity distribution company (Disco) from the list",
          "Enter your meter number (found on your electricity bill)",
          "Select the amount you want to pay (minimum and maximum limits apply)",
          "Verify your meter details and customer information",
          "Choose your payment method and complete the transaction",
          "Receive your electricity token instantly via SMS and email",
          "Use the token to recharge your electricity meter"
        ],
        popular: false,
        isActive: true,
        order: 4
      },
      {
        title: "Managing Your Wallet Balance",
        description: "Learn to add funds, withdraw money, and track your balance. Master wallet management for seamless transactions.",
        category: "account",
        duration: "8 min",
        difficulty: "Beginner",
        type: "text",
        steps: [
          "Navigate to the Wallet section from your dashboard",
          "Click 'Add Funds' to deposit money into your wallet",
          "Choose your payment method (Card, Bank Transfer, or USSD)",
          "Enter the amount you want to add and complete the transaction",
          "Monitor your wallet balance and transaction history",
          "Set up automatic funding alerts and spending limits",
          "Learn about wallet security features and best practices",
          "Explore wallet-to-wallet transfers and gift card options"
        ],
        popular: true,
        isActive: true,
        order: 5
      },
      {
        title: "Playing Dice Games",
        description: "Master the art of dice rolling games and maximize your winnings. Learn strategies and game mechanics.",
        category: "gaming",
        duration: "10 min",
        difficulty: "Intermediate",
        type: "text",
        steps: [
          "Access the Games section from your dashboard",
          "Choose 'Dice Game' from the available gaming options",
          "Understand the game rules and payout structure",
          "Set your bet amount within the allowed limits",
          "Learn about different betting options and multipliers",
          "Practice with demo mode to understand game mechanics",
          "Start with small bets and gradually increase as you gain experience",
          "Monitor your winnings and manage your gaming budget responsibly"
        ],
        popular: true,
        isActive: true,
        order: 6
      }
    ];

    for (const tutorialData of sampleTutorials) {
      const tutorial = new Tutorial(tutorialData);
      await tutorial.save();
      console.log(`✅ Created tutorial: ${tutorial.title}`);
    }

    console.log(`\n🎉 Successfully created ${sampleTutorials.length} sample tutorials!`);
    console.log('📖 You can now view these tutorials in the admin panel at /admin/tutorials');
    console.log('👥 Users can see them on the tutorial page at /tutorials');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating sample tutorials:', error.message);
  }
}

createSampleTutorials();