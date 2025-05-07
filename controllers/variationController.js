const axios = require("axios");
const mongoose = require("mongoose");
const Variation = require("../model/Variation");

const getPartyVariations = async (req, res) => {
  const { serviceID } = req.query;

  if (!serviceID) {
    return res.status(400).json({ 
      success: false,
      message: "serviceID is required" 
    });
  }

  try {
    const VTPASS_URL = process.env.VTPASS_URL;
    const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
    const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;

    const response = await axios.get(
      `${VTPASS_URL}/api/service-variations?serviceID=${serviceID}`,
      {
        headers: {
          "api-key": VTPASS_API_KEY,
          "public-key": VTPASS_PUBLIC_KEY,
        },
      }
    );

    const activeVariations = await Variation.find({ serviceID, isActive: true });

    const combinedVariations = response.data.content.variations?.map(
      (variation) => {
        const isActive = activeVariations.some(
          (active) => active.variation_code === variation.variation_code
        );
        return {
          ...variation,
          isActive,
        };
      }
    );

    res.status(200).json({
      success: true,
      data: combinedVariations
    });
  } catch (error) {
    console.error("Error fetching party variations:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching party variations",
      error: error.message 
    });
  }
};

const saveVariations = async (req, res) => {
  const { variations, serviceID } = req.body;

  if (!Array.isArray(variations)) {
    return res.status(400).json({ 
      success: false,
      message: "Variations must be an array." 
    });
  }

  if (!serviceID) {
    return res.status(400).json({ 
      success: false,
      message: "serviceID is required" 
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deactivate all variations for this service
    await Variation.updateMany(
      { serviceID },
      { isActive: false },
      { session }
    );

    const savedVariations = [];

    for (const v of variations) {
      if (!v.variation_code || !v.name || !v.variation_amount || typeof v.fixedPrice === 'undefined') {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Each variation must have code, name, amount, and price."
        });
      }

      const filter = { 
        variation_code: v.variation_code, 
        serviceID 
      };
      
      const update = {
        name: v.name,
        variation_amount: v.variation_amount,
        fixedPrice: v.fixedPrice,
        serviceID,
        isActive: true
      };

      const options = { 
        upsert: true, 
        new: true, 
        session 
      };

      const updatedVariation = await Variation.findOneAndUpdate(
        filter,
        update,
        options
      );

      savedVariations.push(updatedVariation);
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      data: savedVariations
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error saving variations:", error);
    res.status(500).json({ 
      success: false,
      message: "Error saving variations",
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const getVariations = async (req, res) => {
  const { serviceID } = req.query;

  try {
    const query = { isActive: true };

    if (serviceID) {
      query.serviceID = serviceID;
    }

    const variations = await Variation.find(query);

    res.status(200).json({
      success: true,
      data: variations
    });
  } catch (error) {
    console.error("Error retrieving variations:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving variations",
      error: error.message 
    });
  }
};

const toggleVariation = async (req, res) => {
  const { variation_code, serviceID } = req.query;

  if (!variation_code || !serviceID) {
    return res.status(400).json({ 
      success: false,
      message: "variation_code and serviceID are required." 
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const variation = await Variation.findOne({ 
      variation_code, 
      serviceID 
    }).session(session);

    if (!variation) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: "Variation not found." 
      });
    }

    variation.isActive = !variation.isActive;
    await variation.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: variation
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error toggling variation:", error);
    res.status(500).json({ 
      success: false,
      message: "Error toggling variation",
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

const getSavedVariationsForPricing = async (req, res) => {
  try {
    const savedVariations = await Variation.find({ isActive: true });

    const pricingData = savedVariations.map(variation => ({
      id: variation._id,
      name: variation.name,
      price: variation.fixedPrice,
      dataLimit: variation.variation_amount,
      variationCode: variation.variation_code,
    }));

    res.status(200).json({
      success: true,
      data: pricingData
    });
  } catch (error) {
    console.error("Error retrieving saved variations:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving saved variations",
      error: error.message 
    });
  }
};

module.exports = {
  getPartyVariations,
  getVariations,
  saveVariations,
  toggleVariation,
  getSavedVariationsForPricing
};