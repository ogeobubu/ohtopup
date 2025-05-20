import React, { useState } from "react";

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "To create an account, click on the 'Sign Up' button and fill in the required information."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards, bank transfers, and mobile payments."
    },
    {
      question: "How can I reset my password?",
      answer: "You can reset your password by clicking on the 'Forgot Password?' link on the login page."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption to protect your data and ensure your transactions are secure."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team via the 'Contact Us' section or email us at ohtopup@gmail.com."
    },
    {
      question: "How do I purchase airtime?",
      answer: "To purchase airtime, log in to your account, select 'Buy Airtime', enter the amount, and complete the payment."
    },
    {
      question: "How do I buy data?",
      answer: "To buy data, navigate to the 'Buy Data' section, select your preferred data plan, enter your phone number, and proceed with the payment."
    },
    {
      question: "What are the steps to pay utility bills?",
      answer: "Log in, go to the 'Utility Bills' section, select the type of bill, enter the required details, and confirm your payment."
    },
    {
      question: "How long does a transaction take?",
      answer: "Transactions are usually processed instantly, but some payments may take a few minutes depending on the method used."
    },
    {
      question: "Can I cancel a transaction?",
      answer: "Transactions cannot be canceled once they are processed. Please check your details carefully before confirming."
    },
    {
      question: "I didn't receive the verification email. What should I do?",
      answer: "If you haven't received the verification email, please check your spam or junk folder. If it’s not there, try resending the email or contact our support team for assistance."
    },
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h3>
        <div className="flex flex-col space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <h4 className="font-semibold text-lg md:text-xl text-gray-900 dark:text-white">
                  {faq.question}
                </h4>
                <span className="text-gray-600 dark:text-gray-400">
                  {activeIndex === index ? '-' : '+'}
                </span>
              </div>
              <div
                className={`transition-max-height duration-300 ease-in-out overflow-hidden ${
                  activeIndex === index ? "max-h-40" : "max-h-0"
                }`}
              >
                <div className="p-4 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;