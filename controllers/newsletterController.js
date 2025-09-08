const Newsletter = require("../model/Newsletter");
const newsletterService = require("../services/newsletterService");

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(400).json({ message: "Email is already subscribed" });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();
        return res.status(200).json({ message: "Successfully resubscribed to newsletter" });
      }
    }

    // Create new subscriber
    const newSubscriber = new Newsletter({
      email,
      isActive: true,
    });

    await newSubscriber.save();

    res.status(201).json({ message: "Successfully subscribed to newsletter" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email is already subscribed" });
    }
    res.status(500).json({ message: "Error subscribing to newsletter" });
  }
};

const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({ message: "Email not found in our newsletter list" });
    }

    if (!subscriber.isActive) {
      return res.status(400).json({ message: "Email is already unsubscribed" });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({ message: "Successfully unsubscribed from newsletter" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    res.status(500).json({ message: "Error unsubscribing from newsletter" });
  }
};

const getNewsletterSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true }).select('email subscribedAt');
    res.status(200).json({ subscribers });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({ message: "Error fetching subscribers" });
  }
};

const sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ message: "Subject and content are required" });
    }

    const result = await newsletterService.sendNewsletter(subject, content);

    res.status(200).json(result);
  } catch (error) {
    console.error("Send newsletter error:", error);
    res.status(500).json({ message: error.message || "Error sending newsletter" });
  }
};

const getNewsletterStats = async (req, res) => {
  try {
    const stats = await newsletterService.getNewsletterStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Get newsletter stats error:", error);
    res.status(500).json({ message: "Error fetching newsletter stats" });
  }
};

const getNewsletterActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const activity = await newsletterService.getRecentActivity(limit);
    res.status(200).json({ activity });
  } catch (error) {
    console.error("Get newsletter activity error:", error);
    res.status(500).json({ message: "Error fetching newsletter activity" });
  }
};

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
  getNewsletterSubscribers,
  sendNewsletter,
  getNewsletterStats,
  getNewsletterActivity,
};