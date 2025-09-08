const Reward = require("../model/Reward");
const UserReward = require("../model/UserReward");
const User = require("../model/User");
const Settings = require("../model/Settings");
const { createLog } = require("./systemLogController");

// Get all rewards
const getAllRewards = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const rewards = await Reward.find(query)
      .sort({ rank: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Reward.countDocuments(query);

    res.status(200).json({
      rewards,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ message: "Error fetching rewards" });
  }
};

// Get reward by ID
const getRewardById = async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await Reward.findById(id);

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    res.status(200).json(reward);
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({ message: "Error fetching reward" });
  }
};

// Create new reward
const createReward = async (req, res) => {
  try {
    const rewardData = req.body;

    // Check if reward for this rank already exists
    const existingReward = await Reward.findOne({
      rank: rewardData.rank,
      type: rewardData.type,
      isActive: true
    });

    if (existingReward) {
      return res.status(400).json({
        message: `A ${rewardData.type} reward already exists for rank ${rewardData.rank}`
      });
    }

    const reward = new Reward(rewardData);
    await reward.save();

    res.status(201).json({
      message: "Reward created successfully",
      reward
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({ message: "Error creating reward" });
  }
};

// Update reward
const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const reward = await Reward.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    res.status(200).json({
      message: "Reward updated successfully",
      reward
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    res.status(500).json({ message: "Error updating reward" });
  }
};

// Delete reward
const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;

    const reward = await Reward.findByIdAndDelete(id);

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    res.status(200).json({
      message: "Reward deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({ message: "Error deleting reward" });
  }
};

// Assign reward to user
const assignRewardToUser = async (req, res) => {
  try {
    const { userId, rewardId } = req.body;

    // Validate that userId is a valid ObjectId
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format. User ID must be a valid ObjectId."
      });
    }

    // Validate that rewardId is a valid ObjectId
    if (!rewardId || !/^[0-9a-fA-F]{24}$/.test(rewardId)) {
      return res.status(400).json({
        message: "Invalid reward ID format. Reward ID must be a valid ObjectId."
      });
    }

    const user = await User.findById(userId);
    const reward = await Reward.findById(rewardId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }

    // Check if user already has this reward
    const existingUserReward = await UserReward.findOne({
      user: userId,
      reward: rewardId,
      status: { $in: ['assigned', 'redeemed'] }
    });

    if (existingUserReward) {
      return res.status(400).json({ message: "User already has this reward" });
    }

    // Generate unique redemption code
    const redemptionCode = generateRedemptionCode();

    const userReward = new UserReward({
      user: userId,
      reward: rewardId,
      redemptionCode,
      rewardSnapshot: {
        name: reward.name,
        type: reward.type,
        value: reward.value,
        unit: reward.unit,
      },
      expiresAt: reward.validUntil,
    });

    await userReward.save();

    // Log the reward assignment
    await createLog(
      'info',
      `Reward assigned: ${reward.name} assigned to ${user.username}`,
      'reward',
      req.user?.id,
      req.user?.email,
      {
        rewardId: rewardId,
        rewardName: reward.name,
        userId: userId,
        userUsername: user.username,
        redemptionCode: redemptionCode,
        timestamp: new Date()
      },
      req
    );

    res.status(201).json({
      message: "Reward assigned successfully",
      userReward
    });
  } catch (error) {
    // Log error to system logs
    await createLog(
      'error',
      `Failed to assign reward: ${error.message}`,
      'reward',
      req.user?.id,
      req.user?.email,
      {
        userId: userId,
        rewardId: rewardId,
        errorType: 'assign_reward_failed',
        errorStack: error.stack
      },
      req
    );

    res.status(500).json({
      message: "Unable to assign reward at this time. Please try again later."
    });
  }
};

// Get user's rewards
const getUserRewards = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // If no userId in params, get current user's rewards (for regular users)
    // If userId exists, get that specific user's rewards (for admins)
    const targetUserId = userId || req.user?.id;

    // Validate that we have a valid userId
    if (!targetUserId) {
      return res.status(400).json({
        message: "User ID is required. Please provide a valid user ID or ensure you are authenticated."
      });
    }

    // Validate userId format if it's provided as a parameter
    if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format. User ID must be a valid ObjectId."
      });
    }

    const query = { user: targetUserId };
    if (status) query.status = status;

    const userRewards = await UserReward.find(query)
      .populate('reward')
      .sort({ assignedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await UserReward.countDocuments(query);

    res.status(200).json({
      userRewards,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    // Log error to system logs
    await createLog(
      'error',
      `Failed to fetch user rewards: ${error.message}`,
      'reward',
      req.user?.id,
      req.user?.email,
      {
        targetUserId: targetUserId,
        status: status,
        page: page,
        limit: limit,
        errorType: 'fetch_user_rewards_failed',
        errorStack: error.stack
      },
      req
    );

    res.status(500).json({
      message: "Unable to fetch user rewards at this time. Please try again later."
    });
  }
};

// Redeem reward
const redeemReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { redemptionCode } = req.body;
    const currentUserId = req.user.id;

    // Find the user reward
    let query = { _id: rewardId, status: 'assigned' };

    // If redemption code is provided, use it (admin scenario)
    // If not, check if current user owns this reward (user scenario)
    if (redemptionCode) {
      query.redemptionCode = redemptionCode;
    } else {
      query.user = currentUserId;
    }

    const userReward = await UserReward.findOne(query).populate('reward');

    if (!userReward) {
      return res.status(404).json({ message: "Reward not found or already redeemed" });
    }

    // Check if the current user owns this reward (for user redemption)
    if (!redemptionCode && userReward.user.toString() !== currentUserId) {
      return res.status(403).json({ message: "You can only redeem your own rewards" });
    }

    // Check if reward has expired
    if (userReward.expiresAt && userReward.expiresAt < new Date()) {
      userReward.status = 'expired';
      await userReward.save();
      return res.status(400).json({ message: "Reward has expired" });
    }

    // Update reward status
    userReward.status = 'redeemed';
    userReward.redeemedAt = new Date();
    await userReward.save();

    // Update reward redemption count
    await Reward.findByIdAndUpdate(userReward.reward._id, {
      $inc: { currentRedemptions: 1 }
    });

    // Log the reward redemption
    await createLog(
      'info',
      `Reward redeemed: ${userReward.rewardSnapshot?.name} redeemed by ${userReward.user}`,
      'reward',
      req.user?.id,
      req.user?.email,
      {
        rewardId: rewardId,
        rewardName: userReward.rewardSnapshot?.name,
        userId: userReward.user,
        redemptionCode: userReward.redemptionCode,
        timestamp: new Date()
      },
      req
    );

    res.status(200).json({
      message: "Reward redeemed successfully",
      userReward
    });
  } catch (error) {
    // Log error to system logs
    await createLog(
      'error',
      `Failed to redeem reward: ${error.message}`,
      'reward',
      req.user?.id,
      req.user?.email,
      {
        rewardId: rewardId,
        redemptionCode: redemptionCode,
        errorType: 'redeem_reward_failed',
        errorStack: error.stack
      },
      req
    );

    res.status(500).json({
      message: "Unable to redeem reward at this time. Please try again later."
    });
  }
};

// Get reward analytics
const getRewardAnalytics = async (req, res) => {
  try {
    const totalRewards = await Reward.countDocuments();
    const activeRewards = await Reward.countDocuments({ isActive: true });
    const totalRedemptions = await UserReward.countDocuments({ status: 'redeemed' });
    const pendingRedemptions = await UserReward.countDocuments({ status: 'assigned' });

    const rewardTypeStats = await Reward.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalValue: { $sum: "$value" }
        }
      }
    ]);

    const monthlyRedemptions = await UserReward.aggregate([
      {
        $match: { status: 'redeemed' }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$redeemedAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      overview: {
        totalRewards,
        activeRewards,
        totalRedemptions,
        pendingRedemptions,
      },
      rewardTypeStats,
      monthlyRedemptions,
    });
  } catch (error) {
    console.error("Error fetching reward analytics:", error);
    res.status(500).json({ message: "Error fetching reward analytics" });
  }
};

// Get reward settings
const getRewardSettings = async (req, res) => {
  try {
    let settingsDoc = await Settings.findOne({ type: 'reward' });

    if (!settingsDoc) {
      // Create default settings if they don't exist
      const defaultSettings = {
        autoAssignment: {
          enabled: true,
          rankBased: true,
          achievementBased: true,
          milestoneBased: true,
        },
        notifications: {
          emailEnabled: true,
          pushEnabled: false,
          rewardAssigned: true,
          rewardExpired: true,
          milestoneReached: true,
        },
        redemption: {
          requireVerification: true,
          allowMultipleRedemptions: false,
          expiryNotificationDays: 7,
        },
        ranking: {
          resetFrequency: 'weekly', // weekly, monthly
          pointsPerTransaction: 10,
          bonusMultiplier: 1.5,
          decayRate: 0.1, // points decay per week
        },
        limits: {
          maxRewardsPerUser: 10,
          maxRedemptionsPerDay: 5,
          cooldownPeriodHours: 24,
        }
      };

      settingsDoc = new Settings({
        type: 'reward',
        settings: defaultSettings
      });

      await settingsDoc.save();
    }

    res.status(200).json({
      message: "Reward settings retrieved successfully",
      settings: settingsDoc.settings
    });
  } catch (error) {
    console.error("Error fetching reward settings:", error);
    res.status(500).json({ message: "Error fetching reward settings" });
  }
};

// Update reward settings
const updateRewardSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    // Validate settings structure
    if (!settings) {
      return res.status(400).json({ message: "Settings data is required" });
    }

    // Update or create settings document
    const updatedSettings = await Settings.findOneAndUpdate(
      { type: 'reward' },
      { settings, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Reward settings updated successfully",
      settings: updatedSettings.settings
    });
  } catch (error) {
    console.error("Error updating reward settings:", error);
    res.status(500).json({ message: "Error updating reward settings" });
  }
};

// Reset reward settings to defaults
const resetRewardSettings = async (req, res) => {
  try {
    const defaultSettings = {
      autoAssignment: {
        enabled: true,
        rankBased: true,
        achievementBased: true,
        milestoneBased: true,
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: false,
        rewardAssigned: true,
        rewardExpired: true,
        milestoneReached: true,
      },
      redemption: {
        requireVerification: true,
        allowMultipleRedemptions: false,
        expiryNotificationDays: 7,
      },
      ranking: {
        resetFrequency: 'weekly',
        pointsPerTransaction: 10,
        bonusMultiplier: 1.5,
        decayRate: 0.1,
      },
      limits: {
        maxRewardsPerUser: 10,
        maxRedemptionsPerDay: 5,
        cooldownPeriodHours: 24,
      }
    };

    // Update or create settings document with defaults
    const resetSettings = await Settings.findOneAndUpdate(
      { type: 'reward' },
      { settings: defaultSettings, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Reward settings reset to defaults",
      settings: resetSettings.settings
    });
  } catch (error) {
    console.error("Error resetting reward settings:", error);
    res.status(500).json({ message: "Error resetting reward settings" });
  }
};

// Get reward system statistics
const getRewardSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRewards = await Reward.countDocuments();
    const totalUserRewards = await UserReward.countDocuments();
    const redeemedRewards = await UserReward.countDocuments({ status: 'redeemed' });
    const activeRewards = await Reward.countDocuments({ isActive: true });

    const topRewards = await UserReward.aggregate([
      {
        $group: {
          _id: "$reward",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "rewards",
          localField: "_id",
          foreignField: "_id",
          as: "rewardInfo"
        }
      },
      {
        $unwind: "$rewardInfo"
      },
      {
        $project: {
          name: "$rewardInfo.name",
          type: "$rewardInfo.type",
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      message: "Reward system statistics retrieved successfully",
      stats: {
        totalUsers,
        totalRewards,
        activeRewards,
        totalUserRewards,
        redeemedRewards,
        redemptionRate: totalUserRewards > 0 ? (redeemedRewards / totalUserRewards * 100).toFixed(2) : 0,
        topRewards
      }
    });
  } catch (error) {
    console.error("Error fetching reward system stats:", error);
    res.status(500).json({ message: "Error fetching reward system statistics" });
  }
};

// Bulk update reward status
const bulkUpdateRewardStatus = async (req, res) => {
  try {
    const { rewardIds, isActive } = req.body;

    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({ message: "Reward IDs array is required" });
    }

    const result = await Reward.updateMany(
      { _id: { $in: rewardIds } },
      { isActive, updatedAt: new Date() }
    );

    res.status(200).json({
      message: `${result.modifiedCount} rewards updated successfully`,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk updating rewards:", error);
    res.status(500).json({ message: "Error bulk updating rewards" });
  }
};

// Generate unique redemption code
const generateRedemptionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  assignRewardToUser,
  getUserRewards,
  redeemReward,
  getRewardAnalytics,
  getRewardSettings,
  updateRewardSettings,
  resetRewardSettings,
  getRewardSystemStats,
  bulkUpdateRewardStatus,
};