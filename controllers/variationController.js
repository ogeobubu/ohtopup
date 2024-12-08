const axios = require("axios");
const Variation = require("../model/Variation");

const getPartyVariations = async (req, res) => {
  const { serviceID } = req.query;

  const VTPASS_URL = process.env.VTPASS_URL;
  const VTPASS_API_KEY = process.env.VTPASS_API_KEY;
  const VTPASS_PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY;
  const VTPASS_SECRET_KEY = process.env.VTPASS_SECRET_KEY;

  const response = await axios.get(
    `${VTPASS_URL}/api/service-variations?serviceID=${serviceID}`,
    {
      headers: {
        "api-key": `${VTPASS_API_KEY}`,
        "public-key": `${VTPASS_PUBLIC_KEY}`,
      },
    }
  );

  const activeVariations = await Variation.find({ serviceID, isActive: true });

  const combinedVariations = response.data.content.varations?.map(
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

  res.status(200).json(combinedVariations);
};

const saveVariations = async (req, res) => {
  const { variations, serviceID } = req.body;

  if (!Array.isArray(variations) || variations.length === 0) {
    return res
      .status(400)
      .json({ message: "Variations must be a non-empty array." });
  }

  try {
    await Variation.updateMany(
      { isActive: true, serviceID },
      { isActive: false }
    );

    const savedVariations = [];

    for (const v of variations) {
      if (
        !v.variation_code ||
        !v.name ||
        !v.variation_amount ||
        typeof v.fixedPrice === "undefined"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Each variation must have a code, name, amount, and price.",
          });
      }

      const existingVariation = await Variation.findOne({
        variation_code: v.variation_code,
        serviceID,
      });

      if (existingVariation) {
        existingVariation.name = v.name;
        existingVariation.variation_amount = v.variation_amount;
        existingVariation.fixedPrice = v.fixedPrice;
        existingVariation.isActive = false;
        const updatedVariation = await existingVariation.save();
        savedVariations.push(updatedVariation);
      } else {
        const newVariation = new Variation({
          variation_code: v.variation_code,
          name: v.name,
          variation_amount: v.variation_amount,
          fixedPrice: v.fixedPrice,
          serviceID,
          isActive: true,
        });

        const savedVariation = await newVariation.save();
        savedVariations.push(savedVariation);
      }
    }

    res.status(201).json(savedVariations);
  } catch (error) {
    console.error("Error saving variations:", error);
    res.status(500).json({ message: "Error saving variations" });
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

    if (variations.length > 0) {
      res.status(200).json(variations);
    } else {
      res
        .status(404)
        .json({ message: "No variations found for the provided service ID." });
    }
  } catch (error) {
    console.error("Error retrieving variations:", error);
    res.status(500).json({ message: "Error retrieving variations" });
  }
};

const toggleVariation = async (req, res) => {
  const { variation_code } = req.query;

  console.log(variation_code);

  try {
    const variation = await Variation.findOne({ variation_code });

    if (!variation) {
      return res.status(404).json({ message: "Variation not found." });
    }
    variation.isActive = !variation.isActive;

    await variation.save();

    res
      .status(200)
      .json({ message: "Variation toggled successfully.", variation });
  } catch (error) {
    console.error("Error toggling variation:", error);
    res.status(500).json({ message: "Error toggling variation" });
  }
};

const getSavedVariationsForPricing = async (req, res) => {
  try {
    const savedVariations = await Variation.find({ isActive: true });

    if (savedVariations.length > 0) {
      const pricingData = savedVariations.map(variation => ({
        id: variation._id,
        name: variation.name,
        price: variation.fixedPrice,
        dataLimit: variation.variation_amount,
        variationCode: variation.variation_code,
      }));

      res.status(200).json(pricingData);
    } else {
      res.status(404).json({ message: "No active pricing plans found." });
    }
  } catch (error) {
    console.error("Error retrieving saved variations:", error);
    res.status(500).json({ message: "Error retrieving saved variations" });
  }
};

module.exports = {
  getPartyVariations,
  getVariations,
  saveVariations,
  toggleVariation,
  getVariations,
  getSavedVariationsForPricing
};
