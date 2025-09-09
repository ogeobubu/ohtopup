const Tutorial = require("../model/Tutorial");
const User = require("../model/User");
const { createLog } = require("./systemLogController");

// Get all tutorials for users (public)
const getAllTutorials = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isActive: true };

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tutorials = await Tutorial.find(query)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      message: "Tutorials fetched successfully",
      tutorials,
      total: tutorials.length
    });
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    res.status(500).json({ message: "Error fetching tutorials" });
  }
};

// Get tutorial by ID
const getTutorialById = async (req, res) => {
  try {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id)
      .populate('createdBy', 'name email');

    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    res.status(200).json({
      message: "Tutorial fetched successfully",
      tutorial
    });
  } catch (error) {
    console.error("Error fetching tutorial:", error);
    res.status(500).json({ message: "Error fetching tutorial" });
  }
};

// Admin: Get all tutorials (including inactive)
const getAllTutorialsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, isActive } = req.query;

    let query = {};

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const tutorials = await Tutorial.find(query)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tutorial.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      message: "Tutorials fetched successfully",
      tutorials,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    res.status(500).json({ message: "Error fetching tutorials" });
  }
};

// Admin: Create new tutorial
const createTutorial = async (req, res) => {
  try {
    const { title, description, category, duration, difficulty, type, steps, videoUrl, popular, order } = req.body;

    // Validate required fields
    if (!title || !description || !category || !duration) {
      return res.status(400).json({
        message: "Title, description, category, and duration are required"
      });
    }

    // Get the admin user
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const tutorial = new Tutorial({
      title,
      description,
      category,
      duration,
      difficulty: difficulty || 'Beginner',
      type: type || 'text',
      steps: steps || [],
      videoUrl,
      popular: popular || false,
      order: order || 0,
      createdBy: admin._id
    });

    await tutorial.save();

    // Log the creation
    await createLog(
      'info',
      `Tutorial created: ${title}`,
      'tutorial',
      req.user.id,
      req.user.email,
      {
        tutorialId: tutorial._id,
        title,
        category
      },
      req
    );

    res.status(201).json({
      message: "Tutorial created successfully",
      tutorial
    });
  } catch (error) {
    console.error("Error creating tutorial:", error);
    res.status(500).json({ message: "Error creating tutorial" });
  }
};

// Admin: Update tutorial
const updateTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tutorial = await Tutorial.findById(id);

    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        tutorial[key] = updateData[key];
      }
    });

    await tutorial.save();

    // Log the update
    await createLog(
      'info',
      `Tutorial updated: ${tutorial.title}`,
      'tutorial',
      req.user.id,
      req.user.email,
      {
        tutorialId: tutorial._id,
        title: tutorial.title,
        changes: Object.keys(updateData)
      },
      req
    );

    res.status(200).json({
      message: "Tutorial updated successfully",
      tutorial
    });
  } catch (error) {
    console.error("Error updating tutorial:", error);
    res.status(500).json({ message: "Error updating tutorial" });
  }
};

// Admin: Delete tutorial
const deleteTutorial = async (req, res) => {
  try {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);

    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    await Tutorial.findByIdAndDelete(id);

    // Log the deletion
    await createLog(
      'info',
      `Tutorial deleted: ${tutorial.title}`,
      'tutorial',
      req.user.id,
      req.user.email,
      {
        tutorialId: id,
        title: tutorial.title
      },
      req
    );

    res.status(200).json({
      message: "Tutorial deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting tutorial:", error);
    res.status(500).json({ message: "Error deleting tutorial" });
  }
};

// Admin: Toggle tutorial active status
const toggleTutorialStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const tutorial = await Tutorial.findById(id);

    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    tutorial.isActive = !tutorial.isActive;
    await tutorial.save();

    // Log the status change
    await createLog(
      'info',
      `Tutorial ${tutorial.isActive ? 'activated' : 'deactivated'}: ${tutorial.title}`,
      'tutorial',
      req.user.id,
      req.user.email,
      {
        tutorialId: tutorial._id,
        title: tutorial.title,
        isActive: tutorial.isActive
      },
      req
    );

    res.status(200).json({
      message: `Tutorial ${tutorial.isActive ? 'activated' : 'deactivated'} successfully`,
      tutorial
    });
  } catch (error) {
    console.error("Error toggling tutorial status:", error);
    res.status(500).json({ message: "Error toggling tutorial status" });
  }
};

// Get tutorial categories
const getTutorialCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'all', name: 'All Tutorials' },
      { id: 'getting-started', name: 'Getting Started' },
      { id: 'payments', name: 'Payments' },
      { id: 'gaming', name: 'Gaming' },
      { id: 'account', name: 'Account Management' },
      { id: 'support', name: 'Support' }
    ];

    res.status(200).json({
      message: "Categories fetched successfully",
      categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

module.exports = {
  getAllTutorials,
  getTutorialById,
  getAllTutorialsAdmin,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleTutorialStatus,
  getTutorialCategories
};