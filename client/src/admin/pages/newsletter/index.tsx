import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { sendNewsletter, getNewsletterSubscribers } from "../../../api";
import { getNewsletterStats, getNewsletterActivity } from "../../api";
import { FaUsers, FaPaperPlane, FaEnvelope, FaChartLine, FaMagic } from 'react-icons/fa';

const NewsletterAdmin = () => {
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: getNewsletterSubscribers,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["newsletter-stats"],
    queryFn: getNewsletterStats,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["newsletter-activity"],
    queryFn: () => getNewsletterActivity(5),
  });

  useEffect(() => {
    if (subscribersData?.subscribers) {
      setSubscriberCount(subscribersData.subscribers.length);
    }
  }, [subscribersData]);

  const mutation = useMutation({
    mutationFn: sendNewsletter,
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.subscriberCount} subscribers!`);
      formik.resetForm();
    },
    onError: (error) => {
      console.error("Error sending newsletter:", error);
      toast.error("Error sending newsletter. Please try again.");
    },
  });

  const formik = useFormik({
    initialValues: {
      subject: '',
      content: '',
    },
    validationSchema: Yup.object({
      subject: Yup.string()
        .required('Subject is required')
        .max(200, 'Subject must be less than 200 characters'),
      content: Yup.string()
        .required('Content is required')
        .min(10, 'Content must be at least 10 characters'),
    }),
    onSubmit: (values) => {
      mutation.mutate(values);
    },
  });

  const insertTemplate = (template) => {
    const templates = {
      welcome: `Welcome to OhTopUp! 🎉

We're excited to have you join our community of smart utility managers.

Here's what you can expect:
• Instant top-ups for airtime, data, TV, and electricity
• Competitive pricing with transparent fees
• 24/7 customer support
• Exclusive deals and promotions

Get started today and experience the difference!

Best regards,
The OhTopUp Team`,
      update: `What's New at OhTopUp! 🚀

We're constantly improving to serve you better. Here's what's new:

✨ New Features
🔧 System Improvements
🎁 Special Offers

Stay tuned for more updates!

Best,
OhTopUp Team`,
      promotion: `Exclusive Offer Just for You! 🎁

As a valued subscriber, we're offering you:

🎯 Special Discount: 10% off your next 3 transactions
⏰ Limited Time: Valid for the next 7 days
🚀 Instant Activation: Apply code WELCOME10 at checkout

Don't miss out on this exclusive offer!

Cheers,
OhTopUp Team`
    };

    formik.setFieldValue('content', templates[template]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Newsletter Center
          </h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-300">
            Connect with your audience and keep them engaged
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscribers</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? '...' : (statsData?.activeSubscribers || subscriberCount)}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-2 md:p-3 rounded-lg">
                <FaUsers className="text-blue-600 dark:text-blue-400 text-lg md:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Subscribers</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? '...' : (statsData?.totalSubscribers || subscribersData?.subscribers?.length || 0)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-2 md:p-3 rounded-lg">
                <FaEnvelope className="text-green-600 dark:text-green-400 text-lg md:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">New This Month</p>
                <p className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white">
                  {statsLoading ? '...' : (statsData?.newSubscribers || 0)}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-2 md:p-3 rounded-lg">
                <FaChartLine className="text-purple-600 dark:text-purple-400 text-lg md:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-sm md:text-lg font-semibold text-green-600 dark:text-green-400">
                  {mutation.isPending ? 'Sending...' : 'Ready'}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-2 md:p-3 rounded-lg">
                <FaPaperPlane className="text-green-600 dark:text-green-400 text-lg md:text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Newsletter Composer */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                    Compose Newsletter
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => insertTemplate('welcome')}
                      className="px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Welcome
                    </button>
                    <button
                      onClick={() => insertTemplate('update')}
                      className="px-2 md:px-3 py-1 text-xs md:text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => insertTemplate('promotion')}
                      className="px-2 md:px-3 py-1 text-xs md:text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      Promotion
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={formik.handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...formik.getFieldProps('subject')}
                    className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${formik.touched.subject && formik.errors.subject ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter an engaging subject line..."
                  />
                  {formik.touched.subject && formik.errors.subject ? (
                    <div className="text-red-500 text-xs md:text-sm mt-1">{formik.errors.subject}</div>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Keep it under 60 characters for better open rates
                  </p>
                </div>

                <div>
                  <label htmlFor="content" className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Newsletter Content <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="content"
                      rows={10}
                      {...formik.getFieldProps('content')}
                      className={`w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-vertical ${formik.touched.content && formik.errors.content ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Write your newsletter content here... Use emojis and formatting to make it engaging!"
                    />
                    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 text-xs text-gray-400">
                      {formik.values.content.length} characters
                    </div>
                  </div>
                  {formik.touched.content && formik.errors.content ? (
                    <div className="text-red-500 text-xs md:text-sm mt-1">{formik.errors.content}</div>
                  ) : null}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tip: Personalize your content and include clear calls-to-action
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {previewMode ? 'Edit' : 'Preview'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                    {formik.isValid && formik.dirty ? (
                      <span className="text-green-600 dark:text-green-400">✓ Ready to send</span>
                    ) : (
                      <span>Please fill in all required fields</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={mutation.isPending || !formik.isValid || !formik.dirty}
                    className="w-full sm:w-auto px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    <FaPaperPlane className="text-xs md:text-sm" />
                    <span>
                      {mutation.isPending ? 'Sending Newsletter...' : `Send to ${subscriberCount} Subscribers`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center">
                <FaMagic className="mr-2 text-purple-600 text-sm md:text-base" />
                Newsletter Tips
              </h3>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xs md:text-sm">✓</span>
                  Use attention-grabbing subject lines
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xs md:text-sm">✓</span>
                  Keep content concise and valuable
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xs md:text-sm">✓</span>
                  Include clear calls-to-action
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xs md:text-sm">✓</span>
                  Personalize when possible
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 text-xs md:text-sm">✓</span>
                  Test send to yourself first
                </li>
              </ul>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
                Recent Activity
              </h3>
              <div className="space-y-2 md:space-y-3">
                {activityLoading ? (
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">Loading activity...</div>
                ) : activityData?.activity?.length > 0 ? (
                  activityData.activity.map((item, index) => (
                    <div key={index} className="flex items-center text-xs md:text-sm">
                      <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-blue-500 rounded-full mr-2 md:mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        New subscriber: {item.email}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">No recent activity</div>
                )}
                {statsData && (
                  <>
                    <div className="flex items-center text-xs md:text-sm">
                      <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full mr-2 md:mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        {statsData.newSubscribers || 0} new subscribers this month
                      </span>
                    </div>
                    <div className="flex items-center text-xs md:text-sm">
                      <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-purple-500 rounded-full mr-2 md:mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">
                        {statsData.activeSubscribers || 0} active subscribers
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdmin;