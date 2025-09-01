import React from "react";

const Tutorial = () => {
  const steps = [
    {
      title: "Step 1: Create an Account",
      description: "Visit the registration page and fill out the necessary details to create your account.",
    },
    {
      title: "Step 2: Verify Your Email",
      description: "Check your email for a verification link. Click on the link to verify your account.",
    },
    {
      title: "Step 3: Log In",
      description: "Return to the app and log in using your email and password.",
    },
    {
      title: "Step 4: Add Payment Method",
      description: "Navigate to the settings to add a payment method for seamless transactions.",
    },
    {
      title: "Step 5: Purchase Airtime or Data",
      description: "Go to the 'Buy Airtime' or 'Buy Data' section, select your plan, and complete the payment.",
    },
    {
      title: "Step 6: Manage Your Account",
      description: "You can view your transaction history, manage your profile, and update settings in your account area.",
    },
  ];

  return (
    <section id="tutorial" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          How to Use OhTopUp
        </h3>
        <div className="flex flex-col md:flex-row justify-around flex-wrap">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="shadow-md p-6 rounded-lg m-4 md:w-72 bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
            >
              <h4 className="font-semibold text-lg md:text-xl">{step.title}</h4>
              <p className="text-sm md:text-base">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tutorial;