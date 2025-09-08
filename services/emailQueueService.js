const mongoose = require('mongoose');
const EmailQueue = require('../model/EmailQueue');
const emailService = require('./emailService');
const { createLog } = require('../controllers/systemLogController');
require('dotenv').config();

class EmailQueueService {
  constructor() {
    this.isProcessing = false;
    this.batchSize = parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE) || 10;
    this.maxConcurrency = parseInt(process.env.EMAIL_QUEUE_MAX_CONCURRENCY) || 5;
    this.retryDelays = [0, 60000, 300000, 900000]; // 0ms, 1min, 5min, 15min

    this.startProcessor();
  }

  // Add email to queue
  async addToQueue(emailData) {
    try {
      const emailId = emailData.emailId || `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const queueItem = new EmailQueue({
        emailId,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        template: emailData.template,
        templateData: emailData.templateData,
        priority: emailData.priority || 'normal',
        metadata: emailData.metadata || {},
        maxAttempts: emailData.maxAttempts || 3
      });

      await queueItem.save();

      await createLog('info', `Email queued: ${emailId}`, 'system', null, null, {
        emailId,
        recipient: emailData.to,
        priority: emailData.priority
      });

      return { success: true, emailId };
    } catch (error) {
      console.error('Error adding email to queue:', error);
      return { success: false, error: error.message };
    }
  }

  // Add multiple emails to queue
  async addBulkToQueue(emails) {
    try {
      const queueItems = emails.map(emailData => ({
        emailId: emailData.emailId || `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        template: emailData.template,
        templateData: emailData.templateData,
        priority: emailData.priority || 'normal',
        metadata: emailData.metadata || {},
        maxAttempts: emailData.maxAttempts || 3
      }));

      const result = await EmailQueue.insertMany(queueItems);

      await createLog('info', `Bulk emails queued: ${result.length}`, 'system', null, null, {
        count: result.length,
        emailIds: result.map(item => item.emailId)
      });

      return { success: true, count: result.length, emailIds: result.map(item => item.emailId) };
    } catch (error) {
      console.error('Error adding bulk emails to queue:', error);
      return { success: false, error: error.message };
    }
  }

  // Process queue
  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Get emails ready for processing
      const emailsToProcess = await EmailQueue
        .find({
          status: { $in: ['queued', 'failed'] },
          nextAttemptAt: { $lte: new Date() }
        })
        .sort({ priority: -1, createdAt: 1 })
        .limit(this.batchSize)
        .exec();

      // Filter out emails that have exceeded max attempts
      const validEmails = emailsToProcess.filter(email => email.attempts < email.maxAttempts);

      if (emailsToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing ${validEmails.length} emails from queue...`);

      // Process emails in batches with concurrency control
      const batches = [];
      for (let i = 0; i < validEmails.length; i += this.maxConcurrency) {
        batches.push(validEmails.slice(i, i + this.maxConcurrency));
      }

      for (const batch of batches) {
        const promises = batch.map(email => this.processEmail(email));
        await Promise.allSettled(promises);

        // Small delay between batches to avoid rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual email
  async processEmail(queueItem) {
    try {
      // Update status to processing
      await EmailQueue.findByIdAndUpdate(queueItem._id, {
        status: 'processing',
        attempts: queueItem.attempts + 1,
        updatedAt: new Date()
      });

      let emailData = {
        to: queueItem.to,
        subject: queueItem.subject,
        html: queueItem.html,
        text: queueItem.text,
        emailType: 'queued'
      };

      // If using template, render it
      if (queueItem.template && queueItem.templateData) {
        const { subject, html } = emailService.renderTemplate(queueItem.template, queueItem.templateData);
        emailData.subject = subject;
        emailData.html = html;
      }

      // Send email
      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        // Mark as sent
        await EmailQueue.findByIdAndUpdate(queueItem._id, {
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        });

        await createLog('info', `Email sent from queue: ${queueItem.emailId}`, 'system', null, null, {
          emailId: queueItem.emailId,
          messageId: result.messageId,
          recipient: queueItem.to
        });
      } else {
        throw new Error('Email sending failed');
      }

    } catch (error) {
      console.error(`Error processing email ${queueItem.emailId}:`, error);

      // Calculate next retry time
      const nextDelay = this.retryDelays[queueItem.attempts] || 3600000; // 1 hour default
      const nextAttemptAt = new Date(Date.now() + nextDelay);

      // Update with failure
      const updateData = {
        status: queueItem.attempts >= queueItem.maxAttempts ? 'failed' : 'queued',
        nextAttemptAt,
        errorMessage: error.message,
        updatedAt: new Date()
      };

      await EmailQueue.findByIdAndUpdate(queueItem._id, updateData);

      await createLog('error', `Email failed from queue: ${queueItem.emailId}`, 'system', null, null, {
        emailId: queueItem.emailId,
        recipient: queueItem.to,
        attempt: queueItem.attempts + 1,
        error: error.message
      });
    }
  }

  // Start queue processor
  startProcessor() {
    // Process queue every 30 seconds
    setInterval(() => {
      this.processQueue();
    }, 30000);

    console.log('Email queue processor started');
  }

  // Get queue statistics
  async getQueueStats() {
    try {
      const stats = await EmailQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        total: 0,
        queued: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      return result;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { error: error.message };
    }
  }

  // Cancel email
  async cancelEmail(emailId) {
    try {
      const result = await EmailQueue.findOneAndUpdate(
        { emailId, status: { $in: ['queued', 'failed'] } },
        { status: 'cancelled', updatedAt: new Date() }
      );

      if (result) {
        await createLog('info', `Email cancelled: ${emailId}`, 'system', null, null, {
          emailId,
          recipient: result.to
        });
        return { success: true };
      } else {
        return { success: false, error: 'Email not found or already processed' };
      }
    } catch (error) {
      console.error('Error cancelling email:', error);
      return { success: false, error: error.message };
    }
  }

  // Retry failed emails
  async retryFailedEmails() {
    try {
      // First get all failed emails
      const failedEmails = await EmailQueue.find({ status: 'failed' });

      // Filter emails that haven't exceeded max attempts
      const retryableEmails = failedEmails.filter(email => email.attempts < email.maxAttempts);

      // Update them to queued status
      const emailIds = retryableEmails.map(email => email._id);
      const result = await EmailQueue.updateMany(
        { _id: { $in: emailIds } },
        {
          status: 'queued',
          nextAttemptAt: new Date(),
          updatedAt: new Date()
        }
      );

      await createLog('info', `Retried ${result.modifiedCount} failed emails`, 'system', null, null, {
        count: result.modifiedCount
      });

      return { success: true, count: result.modifiedCount };
    } catch (error) {
      console.error('Error retrying failed emails:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean old processed emails (older than 30 days)
  async cleanOldEmails(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await EmailQueue.deleteMany({
        status: { $in: ['sent', 'cancelled'] },
        createdAt: { $lt: cutoffDate }
      });

      await createLog('info', `Cleaned ${result.deletedCount} old emails`, 'system', null, null, {
        count: result.deletedCount,
        days
      });

      return { success: true, count: result.deletedCount };
    } catch (error) {
      console.error('Error cleaning old emails:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailQueueService();