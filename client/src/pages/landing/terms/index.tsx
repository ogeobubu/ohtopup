import React from "react";
import Navbar from "../navbar";
import Hero from "../hero";
import Partners from "../partners";
import Footer from "../footer";

const Terms = () => {
  return (
    <>
      <Navbar />
      <Hero
        heading="Terms and Conditions"
        subheading=""
        buttonText="Explore More"
        secondButtonText=""
        href=""
      />
      <div className="container mx-auto py-20 px-4">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
          Terms and Conditions
        </h1>
        <p className="mb-4 text-sm md:text-base">
          <strong>Last Updated: April 27, 2025</strong>
        </p>
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4 text-sm md:text-base">
          By accessing or using the OhTopUp website and services, you agree to comply with these Terms and Conditions. If you do not agree, please do not use our services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">2. Services</h2>
        <p className="mb-4 text-sm md:text-base">
          OhTopUp provides affordable digital utility services tailored for cost-conscious users. We aim to help you save on your monthly utility expenses.
        </p>

        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
        <p className="mb-4 text-sm md:text-base">
          Users must create an account to access certain features. You are responsible for maintaining the confidentiality of your account information and for all activities under your account. Notify us immediately of any unauthorized use of your account.
        </p>

        <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
        <p className="mb-4 text-sm md:text-base">
          All payments for services are due at the time of purchase. We accept various payment methods, which may be subject to change. Prices may vary based on service providers and currency fluctuations.
        </p>

        <h2 className="text-2xl font-semibold mb-4">5. Cancellation and Refund Policy</h2>
        <p className="mb-4 text-sm md:text-base">
          Users can cancel their subscriptions at any time through their account settings. Refunds will be processed according to our refund policy, which is subject to review based on the circumstances.
        </p>

        <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
        <p className="mb-4 text-sm md:text-base">
          You agree not to use our services for any illegal or unauthorized purposes. You must comply with all applicable laws and regulations while using our services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
        <p className="mb-4 text-sm md:text-base">
          All content on the OhTopUp website, including logos, text, graphics, and software, is the property of OhTopUp or its licensors and is protected by copyright and trademark laws.
        </p>

        <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
        <p className="mb-4 text-sm md:text-base">
          OhTopUp shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use our services.
        </p>

        <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
        <p className="mb-4 text-sm md:text-base">
          We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the website. Your continued use of the services constitutes acceptance of the revised terms.
        </p>

        <h2 className="text-2xl font-semibold mb-4">10. Referral Program</h2>
        <p className="mb-4 text-sm md:text-base">
          OhTopUp offers a referral program where users can earn rewards by referring new users to our platform. By participating in the referral program, you agree to the following terms:
        </p>
        <ul className="list-disc list-inside mb-4 text-sm md:text-base space-y-2">
          <li>Referrers earn 500 points when their referred users make their first deposit of ₦1,000 or more</li>
          <li>Referral codes are unique and must be used during the signup process</li>
          <li>Only the first qualifying deposit (₦1,000+) per referred user will trigger the reward</li>
          <li>Points earned through referrals can be redeemed for cash equivalent based on our redemption policy</li>
          <li>Referral rewards are subject to verification and may be withheld if fraudulent activity is suspected</li>
          <li>OhTopUp reserves the right to modify or terminate the referral program at any time</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
        <p className="mb-4 text-sm md:text-base">
          These Terms and Conditions are governed by the laws of Nigeria. Any disputes will be resolved in accordance with applicable Nigerian law.
        </p>

        <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
        <p className="mb-4 text-sm md:text-base">
          For any questions or concerns regarding these Terms and Conditions, please contact us at <a href="mailto:ohtopup@gmail.com" className="text-blue-500">ohtopup@gmail.com</a>.
        </p>
      </div>
      <Partners />
      <Footer />
    </>
  );
};

export default Terms;