import React, { useState } from "react";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Footer from "./footer";
import Navbar from "./navbar";
import Hero from "./hero";
import Offer from "./offer";
import AdditionalFeature from "./additional_feature";
import Partners from "./partners";
import FAQ from "./faq";
import Rating from "./rating";
import Usecase from "./use-case";
import CTA from "./cta";
import { subscribeNewsletter } from "../../api";

const HomePage = () => {
  const mutation = useMutation({
    mutationFn: subscribeNewsletter,
    onSuccess: () => {
      toast.success("Successfully subscribed to newsletter!");
      formik.resetForm();
    },
    onError: (error) => {
      console.error("Error subscribing to newsletter:", error);
      toast.error("Error subscribing to newsletter. Please try again.");
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
    <div>
      <Navbar />
      <Hero
        heading="Buy Airtime, Data, TV, and Electricity in Seconds"
        subheading="Instant delivery, best prices, and bank‑grade security. Join thousands who top up smarter with OhTopUp."
        buttonText="Create Free Account"
        secondButtonText="Download App"
        href="/create"
      />

      {/* Quick stats */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-xl font-bold text-blue-600 mb-1">Instant</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Real‑time delivery</p>
          </div>
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-xl font-bold text-blue-600 mb-1">Save</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Competitive pricing</p>
          </div>
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-xl font-bold text-blue-600 mb-1">Secure</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bank‑grade protection</p>
          </div>
          <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-4xl mb-2">🕑</div>
            <p className="text-xl font-bold text-blue-600 mb-1">24/7</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Always available</p>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            Popular Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📱</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Airtime Top-up</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Instant recharge for all networks</p>
            </div>
            <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Bundles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">High-speed data at best prices</p>
            </div>
            <div className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📺</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">TV Subscriptions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Watch your favorite shows</p>
            </div>
            <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-gray-800 dark:to-gray-700 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Electricity Bills</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pay bills with ease</p>
            </div>
          </div>
        </div>
      </section>
      <Offer />
      <AdditionalFeature />
      <Partners />
      <FAQ />
      <Usecase />
      <CTA />
      <Rating />

      {/* Newsletter Signup */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h3>
          <p className="text-lg mb-8 max-w-md mx-auto">
            Get the latest news, updates, and exclusive offers delivered to your inbox.
          </p>
          <form onSubmit={formik.handleSubmit} className="flex flex-col md:flex-row justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              {...formik.getFieldProps('email')}
              className={`px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto ${formik.touched.email && formik.errors.email ? 'border-red-500' : ''}`}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-r-lg font-semibold transition mt-2 md:mt-0 md:ml-2 disabled:opacity-50"
              disabled={mutation.isPending || !formik.isValid || !formik.dirty}
            >
              {mutation.isPending ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {formik.touched.email && formik.errors.email ? (
            <div className="text-red-500 mt-2">{formik.errors.email}</div>
          ) : null}
          <p className="text-sm text-gray-400 mt-4">
            We respect your privacy. <a href="/unsubscribe" className="underline hover:text-white">Unsubscribe</a> at any time.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;