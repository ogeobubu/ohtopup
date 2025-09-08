import React, { useState } from "react";
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { unsubscribeNewsletter } from "../api";
import Navbar from "./landing/navbar";
import Footer from "./landing/footer";

const Unsubscribe = () => {
  const mutation = useMutation({
    mutationFn: unsubscribeNewsletter,
    onSuccess: () => {
      toast.success("Successfully unsubscribed from newsletter!");
      formik.resetForm();
    },
    onError: (error) => {
      console.error("Error unsubscribing from newsletter:", error);
      toast.error("Error unsubscribing from newsletter. Please try again.");
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
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Unsubscribe from Newsletter
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address to unsubscribe from our newsletter.
            </p>
          </div>
          <form onSubmit={formik.handleSubmit} className="mt-8 space-y-6">
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                {...formik.getFieldProps('email')}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white ${formik.touched.email && formik.errors.email ? 'border-red-500' : ''}`}
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
              ) : null}
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={mutation.isPending || !formik.isValid || !formik.dirty}
              >
                {mutation.isPending ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            </div>
          </form>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Changed your mind? <a href="/" className="font-medium text-blue-600 hover:text-blue-500">Go back to homepage</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Unsubscribe;