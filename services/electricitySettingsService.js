const ElectricitySettings = require("../model/ElectricitySettings");

class ElectricitySettingsService {
  // Get all electricity settings
  async getAllSettings() {
    try {
      const settings = await ElectricitySettings.find({ isActive: true }).sort({ createdAt: -1 });
      return {
        success: true,
        data: settings
      };
    } catch (error) {
      console.error("Error fetching electricity settings:", error);
      return {
        success: false,
        error: "Failed to fetch electricity settings"
      };
    }
  }

  // Get global electricity settings
  async getGlobalSettings() {
    try {
      const globalSettings = await ElectricitySettings.findOne({
        type: "global",
        isActive: true
      });

      if (!globalSettings) {
        // Create default global settings if not exists
        const defaultSettings = new ElectricitySettings({
          type: "global",
          settings: {
            electricityCommissionRate: 0
          }
        });
        await defaultSettings.save();
        return {
          success: true,
          data: defaultSettings
        };
      }

      return {
        success: true,
        data: globalSettings
      };
    } catch (error) {
      console.error("Error fetching global electricity settings:", error);
      return {
        success: false,
        error: "Failed to fetch global electricity settings"
      };
    }
  }

  // Get disco-specific settings
  async getDiscoSettings(disco) {
    try {
      const discoSettings = await ElectricitySettings.findOne({
        type: "disco",
        disco: disco,
        isActive: true
      });

      return {
        success: true,
        data: discoSettings
      };
    } catch (error) {
      console.error(`Error fetching ${disco} electricity settings:`, error);
      return {
        success: false,
        error: `Failed to fetch ${disco} electricity settings`
      };
    }
  }

  // Get commission rate for a specific disco (with fallback to global)
  async getCommissionRate(disco = null) {
    try {
      let commissionRate = 0;

      // First try to get disco-specific rate
      if (disco) {
        const discoResult = await this.getDiscoSettings(disco);
        if (discoResult.success && discoResult.data) {
          commissionRate = discoResult.data.settings.electricityCommissionRate;
        }
      }

      // If no disco-specific rate or disco is null, use global rate
      if (commissionRate === 0) {
        const globalResult = await this.getGlobalSettings();
        if (globalResult.success && globalResult.data) {
          commissionRate = globalResult.data.settings.electricityCommissionRate;
        }
      }

      return {
        success: true,
        commissionRate: commissionRate
      };
    } catch (error) {
      console.error("Error getting commission rate:", error);
      return {
        success: false,
        error: "Failed to get commission rate",
        commissionRate: 0
      };
    }
  }

  // Get amount limits for a specific disco (with fallback to global)
  async getAmountLimits(disco = null) {
    try {
      let minAmount = 1000;
      let maxAmount = 50000;

      // First try to get disco-specific limits
      if (disco) {
        const discoResult = await this.getDiscoSettings(disco);
        if (discoResult.success && discoResult.data) {
          minAmount = discoResult.data.settings.minAmount;
          maxAmount = discoResult.data.settings.maxAmount;
        }
      }

      // If no disco-specific limits, use global limits
      if (minAmount === 1000 && maxAmount === 50000) {
        const globalResult = await this.getGlobalSettings();
        if (globalResult.success && globalResult.data) {
          minAmount = globalResult.data.settings.minAmount;
          maxAmount = globalResult.data.settings.maxAmount;
        }
      }

      return {
        success: true,
        minAmount: minAmount,
        maxAmount: maxAmount
      };
    } catch (error) {
      console.error("Error getting amount limits:", error);
      return {
        success: false,
        error: "Failed to get amount limits",
        minAmount: 1000,
        maxAmount: 50000
      };
    }
  }

  // Get all available discos for users (formatted for frontend)
  async getAllDiscosForUsers() {
    try {
      const discoSettings = await ElectricitySettings.find({
        type: "disco",
        isActive: true
      }).sort({ createdAt: -1 });

      // Get global settings for fallback
      const globalSettings = await this.getGlobalSettings();
      const globalCommissionRate = globalSettings.success ? globalSettings.data.settings.electricityCommissionRate : 0;
      const globalMinAmount = globalSettings.success ? globalSettings.data.settings.minAmount : 1000;
      const globalMaxAmount = globalSettings.success ? globalSettings.data.settings.maxAmount : 50000;

      const discos = discoSettings.map(setting => {
        const discoData = setting.toObject();
        return {
          disco: discoData.disco,
          serviceID: `${discoData.disco}-electric`,
          displayName: discoData.settings.displayName || `${discoData.disco.charAt(0).toUpperCase() + discoData.disco.slice(1)} Electric`,
          commissionRate: discoData.settings.electricityCommissionRate || globalCommissionRate,
          minAmount: discoData.settings.minAmount || globalMinAmount,
          maxAmount: discoData.settings.maxAmount || globalMaxAmount,
          isActive: true
        };
      });

      return {
        success: true,
        discos: discos
      };
    } catch (error) {
      console.error("Error getting all discos for users:", error);
      return {
        success: false,
        error: "Failed to get available discos",
        discos: []
      };
    }
  }

  // Update global electricity settings
  async updateGlobalSettings(settings) {
    try {
      const updatedSettings = await ElectricitySettings.findOneAndUpdate(
        { type: "global" },
        {
          settings: {
            electricityCommissionRate: settings.electricityCommissionRate,
            minAmount: settings.minAmount,
            maxAmount: settings.maxAmount
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      return {
        success: true,
        data: updatedSettings
      };
    } catch (error) {
      console.error("Error updating global electricity settings:", error);
      return {
        success: false,
        error: "Failed to update global electricity settings"
      };
    }
  }

  // Update disco-specific settings
  async updateDiscoSettings(disco, settings) {
    try {
      const updatedSettings = await ElectricitySettings.findOneAndUpdate(
        { type: "disco", disco: disco },
        {
          settings: {
            electricityCommissionRate: settings.commissionRate,
            minAmount: settings.minAmount,
            maxAmount: settings.maxAmount,
            displayName: settings.displayName
          }
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      return {
        success: true,
        data: updatedSettings
      };
    } catch (error) {
      console.error(`Error updating ${disco} electricity settings:`, error);
      return {
        success: false,
        error: `Failed to update ${disco} electricity settings`
      };
    }
  }

  // Bulk update electricity settings
  async bulkUpdateSettings(settingsData) {
    try {
      const results = [];

      // Update global settings
      if (settingsData.global) {
        const globalResult = await this.updateGlobalSettings(settingsData.global);
        results.push({ type: "global", ...globalResult });
      }

      // Update disco-specific settings
      if (settingsData.discos) {
        for (const [disco, settings] of Object.entries(settingsData.discos)) {
          const discoResult = await this.updateDiscoSettings(disco, settings);
          results.push({ type: "disco", disco, ...discoResult });
        }
      }

      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error("Error bulk updating electricity settings:", error);
      return {
        success: false,
        error: "Failed to bulk update electricity settings"
      };
    }
  }

  // Reset all settings to defaults
  async resetToDefaults() {
    try {
      const defaultSettings = [
        {
          type: "global",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000
          }
        },
        {
          type: "disco",
          disco: "ikeja",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Ikeja Electric (IKEDC)'
          }
        },
        {
          type: "disco",
          disco: "eko",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Eko Electric (EKEDC)'
          }
        },
        {
          type: "disco",
          disco: "abuja",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Abuja Electric (AEDC)'
          }
        },
        {
          type: "disco",
          disco: "ibadan",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Ibadan Electric (IBEDC)'
          }
        },
        {
          type: "disco",
          disco: "enugu",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Enugu Electric (EEDC)'
          }
        },
        {
          type: "disco",
          disco: "port",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Port Harcourt Electric (PHED)'
          }
        },
        {
          type: "disco",
          disco: "kano",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Kano Electric (KEDCO)'
          }
        },
        {
          type: "disco",
          disco: "jos",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Jos Electric (JED)'
          }
        },
        {
          type: "disco",
          disco: "kaduna",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Kaduna Electric (KAEDCO)'
          }
        },
        {
          type: "disco",
          disco: "benin",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Benin Electric (BEDC)'
          }
        },
        {
          type: "disco",
          disco: "yola",
          settings: {
            electricityCommissionRate: 5,
            minAmount: 1000,
            maxAmount: 50000,
            displayName: 'Yola Electric (YED)'
          }
        }
      ];

      const results = [];

      for (const setting of defaultSettings) {
        const result = await ElectricitySettings.findOneAndUpdate(
          { type: setting.type, disco: setting.disco },
          setting,
          { upsert: true, setDefaultsOnInsert: true, new: true }
        );
        results.push(result);
      }

      return {
        success: true,
        message: "Electricity settings reset to defaults",
        results: results
      };
    } catch (error) {
      console.error("Error resetting electricity settings to defaults:", error);
      return {
        success: false,
        error: "Failed to reset electricity settings to defaults"
      };
    }
  }

  // Initialize default settings
  async initializeDefaultSettings() {
    try {
      const defaultSettings = [
        {
          type: "global",
          settings: { electricityCommissionRate: 0 }
        },
        {
          type: "disco",
          disco: "ikeja",
          settings: { electricityCommissionRate: 0 }
        },
        {
          type: "disco",
          disco: "eko",
          settings: { electricityCommissionRate: 0 }
        },
        {
          type: "disco",
          disco: "abuja",
          settings: { electricityCommissionRate: 0 }
        }
      ];

      for (const setting of defaultSettings) {
        await ElectricitySettings.findOneAndUpdate(
          { type: setting.type, disco: setting.disco },
          setting,
          { upsert: true, setDefaultsOnInsert: true }
        );
      }

      return {
        success: true,
        message: "Default electricity settings initialized"
      };
    } catch (error) {
      console.error("Error initializing default electricity settings:", error);
      return {
        success: false,
        error: "Failed to initialize default electricity settings"
      };
    }
  }
}

module.exports = new ElectricitySettingsService();