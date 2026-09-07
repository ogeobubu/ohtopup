const validationService = require("../services/validationService");
const dbService = require("../services/dbService");
const walletService = require("../services/walletService");
const vtpassService = require("../services/vtpassService");
const transactionService = require("../services/transactionService");
const electricitySettingsService = require("../services/electricitySettingsService");
const { Provider } = require("../model/Provider");
const { generateRequestId } = require("../utils");
const Utility = require("../model/Utility");

const purchaseElectricity = require('./purchaseController').buy('electricity');

const getElectricitySettings = async (req, res, next) => {
  try {
    const result = await electricitySettingsService.getAllSettings();

    if (result.success) {
      res.status(200).json({
        message: "Electricity settings retrieved successfully",
        data: result.data
      });
    } else {
      res.status(500).json({
        message: result.error || "Failed to retrieve electricity settings"
      });
    }
  } catch (error) {
    console.error("Error getting electricity settings:", error);
    next(error);
  }
};

// Update electricity commission settings
const updateElectricitySettings = async (req, res, next) => {
  try {
    const { global, discos } = req.body;

    if (!global && !discos) {
      return res.status(400).json({
        message: "At least one of global or discos settings must be provided"
      });
    }

    const settingsData = {};
    if (global) settingsData.global = global;
    if (discos) settingsData.discos = discos;

    const result = await electricitySettingsService.bulkUpdateSettings(settingsData);

    if (result.success) {
      res.status(200).json({
        message: "Electricity commission settings updated successfully",
        results: result.results
      });
    } else {
      res.status(500).json({
        message: result.error || "Failed to update electricity settings"
      });
    }
  } catch (error) {
    console.error("Error updating electricity settings:", error);
    next(error);
  }
};

// Get commission rate for a specific disco
const getCommissionRate = async (req, res, next) => {
  try {
    const { disco } = req.params;

    const result = await electricitySettingsService.getCommissionRate(disco);

    if (result.success) {
      res.status(200).json({
        message: "Commission rate retrieved successfully",
        commissionRate: result.commissionRate
      });
    } else {
      res.status(500).json({
        message: result.error || "Failed to retrieve commission rate"
      });
    }
  } catch (error) {
    console.error("Error getting commission rate:", error);
    next(error);
  }
};

// Get all available discos for users (with commission and limits)
const getAvailableDiscos = async (req, res, next) => {
  try {
    const result = await electricitySettingsService.getAllDiscosForUsers();

    if (result.success) {
      res.status(200).json({
        message: "Available discos retrieved successfully",
        discos: result.discos
      });
    } else {
      res.status(500).json({
        message: result.error || "Failed to retrieve available discos"
      });
    }
  } catch (error) {
    console.error("Error getting available discos:", error);
    next(error);
  }
};

const resetElectricitySettings = async (req, res, next) => {
  try {
    const result = await electricitySettingsService.resetToDefaults();

    if (result.success) {
      res.status(200).json({
        message: "Electricity settings reset to defaults successfully",
        results: result.results
      });
    } else {
      res.status(500).json({
        message: result.error || "Failed to reset electricity settings"
      });
    }
  } catch (error) {
    console.error("Error resetting electricity settings:", error);
    next(error);
  }
};

module.exports = {
  purchaseElectricity,
  getElectricitySettings,
  updateElectricitySettings,
  resetElectricitySettings,
  getCommissionRate,
  getAvailableDiscos,
};
