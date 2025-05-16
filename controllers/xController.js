const { TwitterApi } = require("twitter-api-v2");
const cron = require("node-cron");
const { getStoredTokens } = require("../routes/authRoutes");

let appOnlyClient = null;
const processedTweetIds = new Set();
const telcoHandles = ["MTNNG"]; // Only MTN
const genericReplyText = "Check out our awesome data deals! [Your Link Here]";

const getUserClient = () => {
  const { accessToken, accessSecret } = getStoredTokens();
  if (!accessToken || !accessSecret) {
    console.error("User Access Tokens not available. X actions requiring user context cannot be performed.");
    return null;
  }
  return new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_KEY_SECRET,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function repostRecentMTNTweets() {
  console.log("Reposting recent MTN tweets...");

  const userClient = getUserClient();
  if (!userClient) {
    console.error("Skipping reposting: User client not available.");
    return;
  }

  const handle = "MTNNG"; 
  try {
    const user = await userClient.v2.userByUsername(handle);
    const userId = user.data.id;

    const userTimeline = await userClient.v2.userTimeline(userId, {
      max_results: 5, // Fetch the most recent tweets
    });

    for (const tweet of userTimeline.data) {
      try {
        await userClient.v1.post(`statuses/retweet/${tweet.id}`);
        console.log(`Successfully reposted tweet ${tweet.id} from ${handle}`);
      } catch (repostError) {
        console.error(`Error reposting tweet ${tweet.id} from ${handle}:`, repostError);
      }
    }
  } catch (fetchError) {
    console.error(`Error fetching timeline for ${handle}:`, fetchError);
  }
}

let processTask;

const startRepostJob = () => {
  if (!processTask) {
    processTask = cron.schedule(
      "*/30 * * * *",
      () => {
        repostRecentMTNTweets();
      },
      {
        scheduled: true,
        timezone: "Africa/Lagos",
      }
    );
    console.log("Telco post processing job scheduled with node-cron.");
  }
};

const postTweet = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, message: "Post text is required." });
  }

  const userClient = getUserClient();
  if (!userClient) {
    return res.status(401).json({ success: false, message: "X account not connected or tokens expired." });
  }

  try {
    const { data: createdTweet } = await userClient.v2.tweet(text);
    console.log("Tweet posted successfully:", createdTweet);
    res.json({ success: true, message: "Tweet posted successfully!", tweet: createdTweet });
  } catch (error) {
    console.error("Error posting tweet:", error);
    res.status(error.code || 500).json({
      success: false,
      message: error.message || "Error posting tweet.",
    });
  }
};

const triggerRepost = async (req, res) => {
  const userClient = getUserClient();
  if (!userClient) {
    return res.status(401).json({ success: false, message: "X account not connected or tokens expired." });
  }
  try {
    await repostRecentMTNTweets();
    res.json({ success: true, message: "Manual telco post processing triggered. Check backend logs for details." });
  } catch (error) {
    console.error("Error triggering manual processing:", error);
    res.status(error.code || 500).json({
      success: false,
      message: error.message || "Error triggering manual processing.",
    });
  }
};

const setTwitterClient = (twitterClient) => {};

module.exports = {
  postTweet,
  triggerRepost,
  startRepostJob,
  setTwitterClient,
};