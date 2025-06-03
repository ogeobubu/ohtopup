const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY not found in environment variables.");
  process.exit(1); // Exit if no API key is found
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const generateMarketingContent = async (req, res) => {
  const prompt = `As an X growth expert, generate the following in a single response:

1. ONE concise and engaging tweet (under 280 characters, aim for brevity) promoting ohtopup.onrender.com. The tweet should encourage sign-ups by emphasizing the benefits of paying for essential utility services easily and affordably (Data Top-up, Airtime Top-up, Electricity bills, Cable TV subscriptions). Highlight affordability and reliability. Include a clear call to action to visit ohtopup.onrender.com.

2. A list of 3-5 brief, random ideas or prompts for future tweets related to using ohtopup.onrender.com, saving money on utility payments, or general financial tips related to the services offered.

Format the response clearly, separating the suggested tweet from the list of future prompts.`;

  try {
    console.log("Sending request to generate content...");
    const result = await model.generateContent(prompt);
    console.log("Received response from AI.");

    const response = result.response;
    const text = await response.text(); // Get the generated text
    
    // Parse the structured response
    const tweetMatch = text.match(/\*\*1\. Tweet:\*\*\n\n([\s\S]+?)\n\n\*\*2\./);
    const promptsMatch = text.match(/\*\*2\. Future Tweet Prompts:\*\*\n\n([\s\S]+)/);
    
    const tweet = tweetMatch ? tweetMatch[1].trim() : '';
    const prompts = promptsMatch ? promptsMatch[1].trim().split('\n* ').slice(1) : [];
    
    return res.status(200).json({
      content: tweet,
      futurePrompts: prompts.map(prompt => prompt.trim()),
      metadata: {
        modelVersion: response.modelVersion,
        responseId: response.responseId,
        usage: response.usageMetadata
      }
    });

  } catch (error) {
    console.error("Error generating content with AI:", error);
    throw {
      status: error.response?.status || 500,
      message: "Failed to generate content from AI.",
      details: error.message,
    };
  }
};

module.exports = {
  generateMarketingContent,
};