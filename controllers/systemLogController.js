const SystemLog = require("../model/SystemLog");

// Create a new system log entry
const createLog = async (level, message, category, userId = null, userEmail = null, metadata = {}, req = null) => {
  try {
    const logData = {
      level,
      message,
      category,
      userId,
      userEmail,
      metadata,
    };

    // Add request information if available
    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress;
      logData.userAgent = req.get('User-Agent');
    }

    const log = new SystemLog(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating system log:', error);
    // Don't throw error to avoid breaking the main functionality
  }
};

// Get system logs with pagination and filtering
const getSystemLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      level,
      category,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Add filters
    if (level) query.level = level;
    if (category) query.category = category;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { timestamp: -1 },
      populate: {
        path: 'userId',
        select: 'username email'
      }
    };

    const logs = await SystemLog.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .populate(options.populate.path, options.populate.select);

    const total = await SystemLog.countDocuments(query);

    res.status(200).json({
      logs,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ message: 'Error fetching system logs' });
  }
};

// Get system log statistics
const getLogStats = async (req, res) => {
  try {
    const stats = await SystemLog.aggregate([
      {
        $group: {
          _id: {
            level: '$level',
            category: '$category'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.level',
          categories: {
            $push: {
              category: '$_id.category',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);

    // Get recent logs count (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await SystemLog.countDocuments({
      timestamp: { $gte: yesterday }
    });

    // Get error logs count (last 24 hours)
    const recentErrors = await SystemLog.countDocuments({
      timestamp: { $gte: yesterday },
      level: 'error'
    });

    res.status(200).json({
      stats,
      recentLogs,
      recentErrors
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ message: 'Error fetching log statistics' });
  }
};

// Delete old logs (cleanup function)
const cleanupLogs = async (req, res) => {
  try {
    const { days = 30 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await SystemLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    // Log the cleanup action
    await createLog('info', `Cleaned up ${result.deletedCount} system logs older than ${days} days`, 'system', req.user?.id, req.user?.email, { deletedCount: result.deletedCount }, req);

    res.status(200).json({
      message: `Cleaned up ${result.deletedCount} system logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ message: 'Error cleaning up logs' });
  }
};

module.exports = {
  createLog,
  getSystemLogs,
  getLogStats,
  cleanupLogs,
};