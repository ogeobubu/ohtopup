import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/forms/button';

const EmailPreferences = () => {
  const [preferences, setPreferences] = useState({
    transactionEmails: true,
    promotionalEmails: true,
    newsletterEmails: true,
    securityEmails: true,
    accountEmails: true,
    systemEmails: true,
    referralEmails: true,
    summaryEmails: true,
    emailFrequency: 'immediate'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/email/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage('Email preferences updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (window.confirm('Are you sure you want to unsubscribe from all emails? You can change this later.')) {
      const updatedPreferences = {
        ...preferences,
        transactionEmails: false,
        promotionalEmails: false,
        newsletterEmails: false,
        securityEmails: false,
        accountEmails: false,
        systemEmails: false,
        referralEmails: false,
        summaryEmails: false
      };

      setPreferences(updatedPreferences);

      try {
        const response = await fetch('/api/email/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedPreferences)
        });

        if (response.ok) {
          setMessage('You have been unsubscribed from all emails.');
          setTimeout(() => setMessage(''), 5000);
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
        setMessage('Failed to unsubscribe. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Preferences</h1>
        <p className="text-gray-600">Manage your email notification preferences and subscription settings.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes('success') || message.includes('updated') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-gray-600">Choose which emails you'd like to receive</p>
          </div>
          <button
            onClick={handleUnsubscribeAll}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Unsubscribe from All
          </button>
        </div>

        <div className="space-y-6">
          {/* Transaction Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Transaction Emails</h3>
              <p className="text-gray-600">Receive notifications about your purchases, payments, and transaction status updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.transactionEmails}
                onChange={(e) => handlePreferenceChange('transactionEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Promotional Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Promotional Emails</h3>
              <p className="text-gray-600">Receive special offers, discounts, and promotional content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.promotionalEmails}
                onChange={(e) => handlePreferenceChange('promotionalEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Newsletter Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Newsletter</h3>
              <p className="text-gray-600">Stay updated with our latest news, tips, and industry insights</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.newsletterEmails}
                onChange={(e) => handlePreferenceChange('newsletterEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Security Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
              <p className="text-gray-600">Important security notifications and login alerts (recommended to keep enabled)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.securityEmails}
                onChange={(e) => handlePreferenceChange('securityEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Account Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Account Updates</h3>
              <p className="text-gray-600">Notifications about account changes, profile updates, and important announcements</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.accountEmails}
                onChange={(e) => handlePreferenceChange('accountEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Referral Emails */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Referral Program</h3>
              <p className="text-gray-600">Updates about your referral earnings and program notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.referralEmails}
                onChange={(e) => handlePreferenceChange('referralEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Summary Emails */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Weekly Summary</h3>
              <p className="text-gray-600">Receive a weekly summary of your account activity and earnings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.summaryEmails}
                onChange={(e) => handlePreferenceChange('summaryEmails', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Email Frequency Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Frequency</h2>
        <p className="text-gray-600 mb-4">Choose how often you'd like to receive emails</p>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="frequency"
              value="immediate"
              checked={preferences.emailFrequency === 'immediate'}
              onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value)}
              className="mr-3"
            />
            <div>
              <span className="font-medium">Immediate</span>
              <p className="text-sm text-gray-600">Receive emails as soon as events occur</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="frequency"
              value="daily"
              checked={preferences.emailFrequency === 'daily'}
              onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value)}
              className="mr-3"
            />
            <div>
              <span className="font-medium">Daily Digest</span>
              <p className="text-sm text-gray-600">Receive a daily summary of all activities</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              name="frequency"
              value="weekly"
              checked={preferences.emailFrequency === 'weekly'}
              onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value)}
              className="mr-3"
            />
            <div>
              <span className="font-medium">Weekly Summary</span>
              <p className="text-sm text-gray-600">Receive a weekly summary of your account activity</p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSavePreferences}
          onSuccess={() => {}}
          variant="primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Footer Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy & Unsubscribe</h3>
        <p className="text-gray-600 mb-4">
          You can unsubscribe from any email by clicking the unsubscribe link at the bottom of our emails.
          We respect your privacy and will never sell your email address to third parties.
        </p>
        <div className="text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>For support, contact us at support@ohtopup.com</p>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;