const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const model = GOOGLE_API_KEY
  ? new GoogleGenerativeAI(GOOGLE_API_KEY).getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    })
  : null;

const generateMarketingContent = async (req, res) => {
  if (!model) {
    return res.status(503).json({
      error: "Content generation is not configured",
      details: "GOOGLE_API_KEY is missing from the server environment",
    });
  }

  // Add dynamic elements to ensure variety
  const tones = [
    "exciting",
    "urgent",
    "friendly",
    "professional",
    "conversational",
    "humorous",
    "minimalist",
    "enthusiastic",
  ];
  const angles = [
    "cost savings",
    "time efficiency",
    "24/7 availability",
    "secure payments",
    "instant delivery",
    "no hidden fees",
    "family budgeting",
    "small business benefits",
  ];
  const emojiOptions = ["🔥", "💡", "⚡", "💰", "🚀", "📱", "💳", "👑"];

  const randomTone = tones[Math.floor(Math.random() * tones.length)];
  const randomAngle = angles[Math.floor(Math.random() * angles.length)];
  const randomEmoji =
    emojiOptions[Math.floor(Math.random() * emojiOptions.length)];

  const prompt = `As a social media growth expert, generate FRESH, UNIQUE content with these specifications:

1. TWEET (${randomTone} tone, focus on ${randomAngle}):
- Length: 240-280 characters (leave room for engagement)
- Include: ${randomEmoji} emoji and a clear CTA
- Highlight: ohtopup.name.ng's benefits (Airtime/Data/Electricity/CableTV)
- Avoid generic phrasing - be specific and compelling
- Example structure: "Struggling with [pain point]? [Solution benefit]! [CTA]"

2. FUTURE CONTENT IDEAS (3-5 items):
- Mix of: tips, questions, stats, testimonials, comparisons
- Each should explore different aspects: ${angles.join(", ")}
- Format as bullet points with varied approaches

OUTPUT FORMAT:
=== TWEET ===
[generated tweet here]

=== IDEAS ===
- [Idea 1: specific and actionable]
- [Idea 2: different angle from idea 1]
- [Idea 3: use a question format]
- [etc.]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = await response.text();

    // Parse the structured response
    const tweet = text
      .split("=== TWEET ===")[1]
      ?.split("=== IDEAS ===")[0]
      ?.trim();
    const prompts = text
      .split("=== IDEAS ===")[1]
      ?.trim()
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter((line) => line.length > 0);

    return res.status(200).json({
      content: tweet || "Could not generate tweet",
      futurePrompts: prompts || [],
      metadata: {
        tone: randomTone,
        angle: randomAngle,
        emoji: randomEmoji,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return res.status(500).json({
      error: "Content generation failed",
      details: error.message,
    });
  }
};

module.exports = {
  generateMarketingContent,
};
