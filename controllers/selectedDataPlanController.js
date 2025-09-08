const SelectedDataPlan = require("../model/SelectedDataPlan");
const { Provider } = require("../model/Provider");

// Get all selected data plans for admin
const getAllSelectedPlans = async (req, res) => {
  try {
    const { network, provider, isActive } = req.query;

    let query = {};

    if (network) query.network = network;
    if (provider) query.providerName = provider;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const selectedPlans = await SelectedDataPlan.find(query)
      .populate('provider', 'name displayName isActive')
      .sort({ priority: -1, network: 1, amount: 1 })
      .lean();

    // Get total count
    const totalCount = await SelectedDataPlan.countDocuments(query);

    res.status(200).json({
      message: "Selected data plans retrieved successfully",
      selectedPlans,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching selected plans:", error);
    res.status(500).json({
      message: "Error fetching selected plans",
      error: error.message
    });
  }
};

// Get selected data plans for users (only active and visible plans)
const getSelectedPlansForUsers = async (req, res) => {
  try {
    const { network } = req.query;

    let query = {
      isActive: true,
      isVisible: true
    };

    if (network) query.network = network;

    const selectedPlans = await SelectedDataPlan.find(query)
      .populate('provider', 'name displayName isActive')
      .sort({ priority: -1, network: 1, amount: 1 })
      .lean();

    // Group by network for easier frontend handling
    const groupedPlans = selectedPlans.reduce((acc, plan) => {
      const network = plan.network.toUpperCase();
      if (!acc[network]) {
        acc[network] = [];
      }
      acc[network].push({
        ...plan,
        finalPrice: plan.adminPrice || plan.amount,
        discountAmount: plan.discount > 0 ? (plan.amount * plan.discount / 100) : 0
      });
      return acc;
    }, {});

    res.status(200).json({
      message: "Selected data plans retrieved successfully",
      plans: groupedPlans,
      totalPlans: selectedPlans.length,
    });
  } catch (error) {
    console.error("Error fetching selected plans for users:", error);
    res.status(500).json({
      message: "Error fetching selected plans",
      error: error.message
    });
  }
};

// Select/Add a data plan
const selectDataPlan = async (req, res) => {
  try {
    const {
      providerId,
      providerName,
      planId,
      serviceId,
      name,
      displayName,
      amount,
      dataAmount,
      validity,
      network,
      planType = "Regular"
    } = req.body;

    // Validate required fields
    if (!providerId || !planId || !serviceId || !name || !amount || !network) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    // Check if provider exists and is active
    const provider = await Provider.findById(providerId);
    if (!provider || !provider.isActive) {
      return res.status(404).json({
        message: "Provider not found or not active"
      });
    }

    // Check if plan is already selected
    const existingPlan = await SelectedDataPlan.findOne({
      provider: providerId,
      planId: planId
    });

    if (existingPlan) {
      return res.status(400).json({
        message: "Plan is already selected"
      });
    }

    // Normalize network name to match enum values
    const normalizeNetwork = (networkValue) => {
      const normalized = networkValue.toLowerCase();
      switch (normalized) {
        case 'mtn':
          return 'MTN';
        case 'airtel':
        case 'airtel':
          return 'Airtel';
        case 'glo':
          return 'Glo';
        case '9mobile':
        case '9_mobile':
        case '9 mobile':
          return '9mobile';
        default:
          return networkValue; // Return as-is if no match
      }
    };

    // Normalize plan type to match enum values
    const normalizePlanType = (planTypeValue) => {
      const normalized = planTypeValue.toLowerCase();
      switch (normalized) {
        case 'sme':
          return 'SME';
        case 'regular':
          return 'Regular';
        case 'direct':
          return 'Direct';
        case 'awoof':
          return 'Awoof';
        case 'daily':
          return 'Daily';
        case 'weekly':
          return 'Weekly';
        case 'monthly':
          return 'Monthly';
        default:
          return 'Regular'; // Default to Regular if no match
      }
    };

    // Create new selected plan
    const selectedPlan = new SelectedDataPlan({
      provider: providerId,
      providerName,
      planId,
      serviceId,
      name,
      displayName: displayName || name,
      amount: parseFloat(amount),
      dataAmount,
      validity,
      network: normalizeNetwork(network),
      planType: normalizePlanType(planType),
      selectedBy: req.user?.id || "admin"
    });

    await selectedPlan.save();
    await selectedPlan.populate('provider', 'name displayName isActive');

    res.status(201).json({
      message: "Data plan selected successfully",
      selectedPlan
    });
  } catch (error) {
    console.error("Error selecting data plan:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "This plan is already selected"
      });
    }

    res.status(500).json({
      message: "Error selecting data plan",
      error: error.message
    });
  }
};

// Deselect/Remove a data plan
const deselectDataPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { providerId } = req.body;

    let query = { planId };
    if (providerId) {
      query.provider = providerId;
    }

    const deletedPlan = await SelectedDataPlan.findOneAndDelete(query);

    if (!deletedPlan) {
      return res.status(404).json({
        message: "Selected plan not found"
      });
    }

    res.status(200).json({
      message: "Data plan deselected successfully",
      deletedPlan
    });
  } catch (error) {
    console.error("Error deselecting data plan:", error);
    res.status(500).json({
      message: "Error deselecting data plan",
      error: error.message
    });
  }
};

// Update selected plan settings
const updateSelectedPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { providerId } = req.body;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.planId;
    delete updates.provider;
    delete updates.providerId;

    let query = { planId };
    if (providerId) {
      query.provider = providerId;
    }

    const updatedPlan = await SelectedDataPlan.findOneAndUpdate(
      query,
      {
        ...updates,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    ).populate('provider', 'name displayName isActive');

    if (!updatedPlan) {
      return res.status(404).json({
        message: "Selected plan not found"
      });
    }

    res.status(200).json({
      message: "Selected plan updated successfully",
      selectedPlan: updatedPlan
    });
  } catch (error) {
    console.error("Error updating selected plan:", error);
    res.status(500).json({
      message: "Error updating selected plan",
      error: error.message
    });
  }
};

// Bulk select/deselect plans
const bulkUpdateSelectedPlans = async (req, res) => {
  try {
    const { action, plans } = req.body; // action: 'select' or 'deselect'

    if (!action || !plans || !Array.isArray(plans)) {
      return res.status(400).json({
        message: "Action and plans array are required"
      });
    }

    let results = {
      successful: [],
      failed: []
    };

    if (action === 'select') {
      for (const planData of plans) {
        try {
          const selectedPlan = new SelectedDataPlan({
            ...planData,
            selectedBy: req.user?.id || "admin"
          });
          await selectedPlan.save();
          results.successful.push(planData.planId);
        } catch (error) {
          results.failed.push({
            planId: planData.planId,
            error: error.message
          });
        }
      }
    } else if (action === 'deselect') {
      for (const planId of plans) {
        try {
          await SelectedDataPlan.findOneAndDelete({ planId });
          results.successful.push(planId);
        } catch (error) {
          results.failed.push({
            planId,
            error: error.message
          });
        }
      }
    }

    res.status(200).json({
      message: `Bulk ${action} completed`,
      results
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({
      message: "Error in bulk update",
      error: error.message
    });
  }
};

// Get statistics for selected plans
const getSelectedPlansStats = async (req, res) => {
  try {
    const stats = await SelectedDataPlan.aggregate([
      {
        $match: { isActive: true, isVisible: true }
      },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          totalValue: { $sum: "$amount" },
          networks: { $addToSet: "$network" },
          providers: { $addToSet: "$providerName" },
          planTypes: { $addToSet: "$planType" }
        }
      }
    ]);

    const networkStats = await SelectedDataPlan.aggregate([
      {
        $match: { isActive: true, isVisible: true }
      },
      {
        $group: {
          _id: "$network",
          count: { $sum: 1 },
          totalValue: { $sum: "$amount" }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      message: "Selected plans statistics retrieved successfully",
      stats: stats[0] || {
        totalPlans: 0,
        totalValue: 0,
        networks: [],
        providers: [],
        planTypes: []
      },
      networkStats
    });
  } catch (error) {
    console.error("Error fetching selected plans stats:", error);
    res.status(500).json({
      message: "Error fetching statistics",
      error: error.message
    });
  }
};

module.exports = {
  getAllSelectedPlans,
  getSelectedPlansForUsers,
  selectDataPlan,
  deselectDataPlan,
  updateSelectedPlan,
  bulkUpdateSelectedPlans,
  getSelectedPlansStats,
};