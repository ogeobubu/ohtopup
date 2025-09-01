
import React, { useEffect, useState } from "react";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { joinWaitlist } from "../../api";

const ComingSoon = () => {
  const savedCountdownDate = localStorage.getItem("countdownDate");
  const countdownDate = savedCountdownDate
    ? new Date(savedCountdownDate)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  useEffect(() => {
    if (!savedCountdownDate) {
      localStorage.setItem("countdownDate", countdownDate);
    }
  }, [countdownDate, savedCountdownDate]);

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = countdownDate - now;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mutation = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: () => {
      toast.success("Successfully added to the waitlist!");
      formik.resetForm();
    },
    onError: (error) => {
      console.error("Error adding to waitlist:", error);
      toast.error("Error joining waitlist. Please try again.");
    },
  });

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  return (
    <div className="bg-blue-500 text-white">
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            We are launching in 2 weeks!
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl mt-4">
            Your One-Stop VTU Business Solution
          </h2>

          <div className="mt-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl">Launch Countdown</h2>
            <div className="flex justify-center mt-4">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div className="mx-2 md:mx-4 text-center" key={unit}>
                  <span className="text-5xl md:text-6xl lg:text-7xl font-bold">{value}</span>
                  <div className="text-sm md:text-lg text-gray-300">{unit.charAt(0).toUpperCase() + unit.slice(1)}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="mt-8 flex flex-col md:flex-row justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              {...formik.getFieldProps('email')}
              className={`p-2 rounded-l outline-none w-full md:w-64 text-gray-700 ${formik.touched.email && formik.errors.email ? 'border-red-500' : ''}`}
            />
            <button
              type="submit"
              className="bg-white text-blue-500 p-2 rounded-r mt-2 md:mt-0 md:ml-2"
              disabled={mutation.isLoading || !formik.isValid || !formik.dirty} // Disable button while loading or if the form is invalid
            >
              {mutation.isLoading ? 'Joining...' : 'Join our waitlist'}
            </button>
          </form>
          {formik.touched.email && formik.errors.email ? (
            <div className="text-red-500 mt-2">{formik.errors.email}</div>
          ) : null}
        </div>
      </div>

      {/* Other sections remain unchanged */}
      <div className="bg-white text-blue-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
            What We Offer
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                Airtime & Data
              </h3>
              <p className="text-gray-500">
                Purchase airtime and data easily from your mobile device.
              </p>
            </div>
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                Utility Payments
              </h3>
              <p className="text-gray-500">
                Pay for electricity and other utilities with just a few clicks.
              </p>
            </div>
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                TV Subscriptions
              </h3>
              <p className="text-gray-500">
                Subscribe to your favorite TV channels effortlessly.
              </p>
            </div>
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                Gift Points
              </h3>
              <p className="text-gray-500">
                Get giveaway points that can be converted to money!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white text-blue-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
            Secure Transactions
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                Easy Deposits
              </h3>
              <p className="text-gray-500">
                Deposit money into your account quickly and securely.
              </p>
            </div>
            <div className="p-4 border rounded shadow">
              <h3 className="text-xl md:text-2xl font-semibold text-blue-600">
                Fast Withdrawals
              </h3>
              <p className="text-gray-500">
                Withdraw your funds anytime with minimal hassle.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-500 text-white py-8 text-center px-3">
        <h2 className="text-2xl md:text-3xl">Sign up to receive updates from us</h2>
        <form className="mt-4 flex flex-col md:flex-row justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            className="p-2 rounded-l outline-none w-full md:w-64 text-gray-700"
          />
          <button className="bg-white text-blue-500 p-2 rounded-r mt-2 md:mt-0 md:ml-2">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComingSoon;