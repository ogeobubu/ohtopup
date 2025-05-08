const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const getRandomContent = async (req, res) => {
  console.log("Executing getRandomContent...");

  const prompt = `As an X growth expert, generate the following in a single response:

1.  ONE concise and engaging tweet (under 280 characters, aim for brevity) promoting ohtopup.onrender.com. The tweet should encourage sign-ups by emphasizing the benefits of paying for essential utility services easily and affordably (Data Top-up, Airtime Top-up, Electricity bills, Cable TV subscriptions). Highlight affordability and reliability. Include a clear call to action to visit ohtopup.onrender.com.

2.  A list of 3-5 brief, random ideas or prompts for future tweets related to using ohtopup.onrender.com, saving money on utility payments, or general financial tips related to the services offered.

Format the response clearly, separating the suggested tweet from the list of future prompts (e.g., use headings or clear dividers).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Content generated successfully.");
    res.status(200).json({ content: text });

  } catch (error) {
    console.error('Error generating content:', error);
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate content';
    res.status(500).json({ error: errorMessage });
  }
};

module.exports = { getRandomContent };