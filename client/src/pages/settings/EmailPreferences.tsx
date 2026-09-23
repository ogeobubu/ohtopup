import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/forms/button';

type Prefs = {
  transactionEmails: boolean;
  promotionalEmails: boolean;
  newsletterEmails: boolean;
  securityEmails: boolean;
  accountEmails: boolean;
  systemEmails: boolean;
  referralEmails: boolean;
  summaryEmails: boolean;
  emailFrequency: string;
};

const panel = "mb-6 rounded-lg border border-line bg-paper p-6";
const row = "flex items-center justify-between gap-6 border-b border-line py-4 last:border-b-0";
const toggle =
  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors peer-checked:bg-accent bg-line after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']";

const EmailPreferences = () => {
  const [preferences, setPreferences] = useState<Prefs>({
    transactionEmails: true,
    promotionalEmails: true,
    newsletterEmails: true,
    securityEmails: true,
    accountEmails: true,
    systemEmails: true,
    referralEmails: true,
    summaryEmails: true,
    emailFrequency: 'immediate',
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
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

  const handlePreferenceChange = (key: keyof Prefs, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(preferences),
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
    if (
      window.confirm(
        'Are you sure you want to unsubscribe from all emails? You can change this later.'
      )
    ) {
      const updatedPreferences = {
        ...preferences,
        transactionEmails: false,
        promotionalEmails: false,
        newsletterEmails: false,
        securityEmails: false,
        accountEmails: false,
        systemEmails: false,
        referralEmails: false,
        summaryEmails: false,
      };

      setPreferences(updatedPreferences);

      try {
        const response = await fetch('/api/email/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(updatedPreferences),
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
      </div>
    );
  }

  const notificationItems: Array<{ key: keyof Prefs; title: string; desc: string }> = [
    {
      key: 'transactionEmails',
      title: 'Transaction Emails',
      desc: 'Receive notifications about your purchases, payments, and transaction status updates',
    },
    {
      key: 'promotionalEmails',
      title: 'Promotional Emails',
      desc: 'Receive special offers, discounts, and promotional content',
    },
    {
      key: 'newsletterEmails',
      title: 'Newsletter',
      desc: 'Stay updated with our latest news, tips, and industry insights',
    },
    {
      key: 'securityEmails',
      title: 'Security Alerts',
      desc: 'Important security notifications and login alerts (recommended to keep enabled)',
    },
    {
      key: 'accountEmails',
      title: 'Account Updates',
      desc: 'Notifications about account changes, profile updates, and important announcements',
    },
    {
      key: 'referralEmails',
      title: 'Referral Program',
      desc: 'Updates about your referral earnings and program notifications',
    },
    {
      key: 'summaryEmails',
      title: 'Weekly Summary',
      desc: 'Receive a weekly summary of your account activity and earnings',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl p-2">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-ink">Email Preferences</h1>
        <p className="text-muted">Manage your email notification preferences and subscription settings.</p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-md border p-4 ${
            message.includes('success') || message.includes('updated')
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-danger/40 bg-danger/10 text-danger'
          }`}
        >
          {message}
        </div>
      )}

      <div className={panel}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Email Notifications</h2>
            <p className="text-muted">Choose which emails you&apos;d like to receive</p>
          </div>
          <button
            onClick={handleUnsubscribeAll}
            className="rounded-md border border-danger/40 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
          >
            Unsubscribe from All
          </button>
        </div>

        <div>
          {notificationItems.map((item) => (
            <div key={item.key} className={row}>
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-ink">{item.title}</h3>
                <p className="text-muted">{item.desc}</p>
              </div>
              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={preferences[item.key] as boolean}
                  onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                />
                <div className={toggle} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={panel}>
        <h2 className="mb-1 text-xl font-semibold text-ink">Email Frequency</h2>
        <p className="mb-4 text-muted">Choose how often you&apos;d like to receive emails</p>

        <div className="space-y-3">
          {[
            { value: 'immediate', title: 'Immediate', desc: 'Receive emails as soon as events occur' },
            { value: 'daily', title: 'Daily Digest', desc: 'Receive a daily summary of all activities' },
            { value: 'weekly', title: 'Weekly Summary', desc: 'Receive a weekly summary of your account activity' },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="frequency"
                value={opt.value}
                checked={preferences.emailFrequency === opt.value}
                onChange={(e) => handlePreferenceChange('emailFrequency', e.target.value)}
                className="mt-1"
              />
              <div>
                <span className="font-medium">{opt.title}</span>
                <p className="text-sm text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences} onSuccess={() => {}} variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      <div className="mt-8 rounded-lg bg-bg p-6">
        <h3 className="mb-2 text-lg font-medium text-ink">Privacy & Unsubscribe</h3>
        <p className="mb-4 text-muted">
          You can unsubscribe from any email by clicking the unsubscribe link at the bottom of our emails.
          We respect your privacy and will never sell your email address to third parties.
        </p>
        <div className="text-sm text-muted">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>For support, contact us at support@ohtopup.com</p>
        </div>
      </div>
    </div>
  );
};

export default EmailPreferences;
