const mongoose = require('mongoose');

const emailPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Transaction notifications
  transactionEmails: {
    type: Boolean,
    default: true
  },

  // Marketing and promotional emails
  promotionalEmails: {
    type: Boolean,
    default: true
  },

  // Newsletter subscriptions
  newsletterEmails: {
    type: Boolean,
    default: true
  },

  // Security notifications (password changes, login alerts)
  securityEmails: {
    type: Boolean,
    default: true
  },

  // Account updates (balance changes, profile updates)
  accountEmails: {
    type: Boolean,
    default: true
  },

  // System announcements and maintenance notifications
  systemEmails: {
    type: Boolean,
    default: true
  },

  // Referral program notifications
  referralEmails: {
    type: Boolean,
    default: true
  },

  // Weekly/Monthly summary emails
  summaryEmails: {
    type: Boolean,
    default: false
  },

  // Email frequency preferences
  emailFrequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly', 'monthly'],
    default: 'immediate'
  },

  // Unsubscribe token for security
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },

  // Bounce tracking
  bounceCount: {
    type: Number,
    default: 0
  },

  lastBounceAt: {
    type: Date
  },

  // Complaint tracking
  complaintCount: {
    type: Number,
    default: 0
  },

  lastComplaintAt: {
    type: Date
  },

  // Email verification status
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerifiedAt: {
    type: Date
  },

  verificationToken: {
    type: String,
    unique: true,
    sparse: true
  },

  verificationTokenExpires: {
    type: Date
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
emailPreferencesSchema.index({ userId: 1 });
emailPreferencesSchema.index({ unsubscribeToken: 1 });
emailPreferencesSchema.index({ verificationToken: 1 });
emailPreferencesSchema.index({ emailFrequency: 1 });

// Pre-save middleware
emailPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
emailPreferencesSchema.methods.generateUnsubscribeToken = function() {
  this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
  return this.unsubscribeToken;
};

emailPreferencesSchema.methods.generateVerificationToken = function() {
  this.verificationToken = require('crypto').randomBytes(32).toString('hex');
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.verificationToken;
};

emailPreferencesSchema.methods.canReceiveEmail = function(emailType) {
  switch (emailType) {
    case 'transaction':
      return this.transactionEmails;
    case 'promotional':
      return this.promotionalEmails;
    case 'newsletter':
      return this.newsletterEmails;
    case 'security':
      return this.securityEmails;
    case 'account':
      return this.accountEmails;
    case 'system':
      return this.systemEmails;
    case 'referral':
      return this.referralEmails;
    case 'summary':
      return this.summaryEmails;
    default:
      return true; // Default to allowing unknown email types
  }
};

emailPreferencesSchema.methods.recordBounce = function() {
  this.bounceCount += 1;
  this.lastBounceAt = new Date();

  // If too many bounces, disable emails
  if (this.bounceCount >= 3) {
    this.transactionEmails = false;
    this.promotionalEmails = false;
    this.newsletterEmails = false;
  }

  return this.save();
};

emailPreferencesSchema.methods.recordComplaint = function() {
  this.complaintCount += 1;
  this.lastComplaintAt = new Date();

  // If complaint received, disable promotional emails
  if (this.complaintCount >= 1) {
    this.promotionalEmails = false;
    this.newsletterEmails = false;
  }

  return this.save();
};

emailPreferencesSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerifiedAt = new Date();
  this.verificationToken = undefined;
  this.verificationTokenExpires = undefined;
  return this.save();
};

// Static methods
emailPreferencesSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

emailPreferencesSchema.statics.findByUnsubscribeToken = function(token) {
  return this.findOne({ unsubscribeToken: token });
};

emailPreferencesSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() }
  });
};

emailPreferencesSchema.statics.getUsersForEmailType = function(emailType, frequency = 'immediate') {
  const query = { isEmailVerified: true };

  // Add email type filter
  switch (emailType) {
    case 'transaction':
      query.transactionEmails = true;
      break;
    case 'promotional':
      query.promotionalEmails = true;
      break;
    case 'newsletter':
      query.newsletterEmails = true;
      break;
    case 'security':
      query.securityEmails = true;
      break;
    case 'account':
      query.accountEmails = true;
      break;
    case 'system':
      query.systemEmails = true;
      break;
    case 'referral':
      query.referralEmails = true;
      break;
    case 'summary':
      query.summaryEmails = true;
      query.emailFrequency = frequency;
      break;
  }

  // Exclude users with too many bounces
  query.bounceCount = { $lt: 3 };

  return this.find(query).populate('userId', 'email firstName lastName');
};

emailPreferencesSchema.statics.createDefaultPreferences = function(userId) {
  return this.create({ userId });
};

module.exports = mongoose.model('EmailPreferences', emailPreferencesSchema);