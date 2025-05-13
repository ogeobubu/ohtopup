const { TwitterApi } = require("twitter-api-v2");
const cron = require("node-cron");
const { getStoredTokens } = require("../routes/authRoutes");

let appOnlyClient = null;

// Store tweet IDs to avoid duplicate reposts and replies (in-memory for simplicity)
// In a production app, use a database to persist this across server restarts
const processedTweetIds = new Set(); // Use one set to track both reposted and replied

const telcoHandles = ["MTNNG", "AirtelNigeria", "GlobacomLtd", "9mobileng"]; // Revert to all handles

const genericReplyText = "Check out our awesome data deals! [Your Link Here]"; // Define your generic reply text

const getUserClient = () => {
  const { accessToken, accessSecret } = getStoredTokens();
  if (!accessToken || !accessSecret) {
    console.error(
      "User Access Tokens not available. X actions requiring user context cannot be performed."
    );
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

async function checkAndProcessTelcoPosts() {
  console.log("Checking telco posts for keywords and recent updates...");

  const userClient = getUserClient();
  if (!userClient) {
    console.error("Skipping post processing: User client not available.");
    return;
  }

  for (const handle of telcoHandles) {
    try {
      const user = await userClient.v2.userByUsername(handle);
      const userId = user.data.id;

      const userTimeline = await userClient.v2.userTimeline(userId, {
        max_results: 1,
      });

      if (userTimeline.data && userTimeline.data.length > 0) {
        for (const tweet of userTimeline.data) {
          // Iterate through the few recent tweets
          console.log(`Processing tweet from ${handle}: ${tweet.text}`);

          // Check if this tweet ID has already been processed (replied or reposted)
          if (!processedTweetIds.has(tweet.id)) {
            const tweetText = tweet.text.toLowerCase();
            const hasBuyDataKeyword = tweetText.includes("buy data");

            if (hasBuyDataKeyword) {
              // --- Reply to the tweet ---
              try {
                const reply = await userClient.v2.reply(
                  genericReplyText,
                  tweet.id
                );
                console.log(
                  `Successfully replied to tweet ${tweet.id} from ${handle}`,
                  reply
                );
                processedTweetIds.add(tweet.id); // Mark as processed

                // NOTE FOR PRODUCTION: Persist processedTweetIds to a database.
              } catch (replyError) {
                console.error(
                  `Error replying to tweet ${tweet.id} from ${handle}:`,
                  replyError
                );
                if (replyError.code) {
                  console.error("X API Reply Error Code:", replyError.code);
                  console.error(
                    "X API Reply Error Message:",
                    replyError.message
                  );
                  if (replyError.errors) {
                    console.error(
                      "X API Detailed Reply Errors:",
                      replyError.errors
                    );
                  }
                }
              }
            } else {
              // --- Repost the tweet (if it's the most recent and not a reply) ---
              // We only want to repost the single MOST recent tweet if it doesn't match keyword
              // and hasn't been reposted.
              // A more robust approach would check timestamps or the order from max_results: 1
              // For simplicity here, if we are processing more than 1 tweet from max_results: 5,
              // we'll only consider reposting the first one retrieved if no keyword matched.
              const isMostRecentFetched = tweet.id === userTimeline.data[0].id;

              if (isMostRecentFetched) {
                try {
                  await userClient.v1.post(`statuses/retweet/${tweet.id}`);
                  console.log(
                    `Successfully reposted tweet ${tweet.id} from ${handle}`
                  );
                  processedTweetIds.add(tweet.id); // Mark as processed
                  // NOTE FOR PRODUCTION: Persist processedTweetIds to a database.
                } catch (repostError) {
                  console.error(
                    `Error reposting tweet ${tweet.id} from ${handle}:`,
                    repostError
                  );
                  if (repostError.code) {
                    console.error("X API Repost Error Code:", repostError.code);
                    console.error(
                      "X API Repost Error Message:",
                      repostError.message
                    );
                    if (repostError.errors) {
                      console.error(
                        "X API Detailed Repost Errors:",
                        repostError.errors
                      );
                    }
                  }
                }
              } else {
                console.log(
                  `Tweet ${tweet.id} from ${handle} does not contain keyword and is not the most recent fetched. Skipping.`
                );
              }
            }
          } else {
            console.log(`Tweet ${tweet.id} from ${handle} already processed.`);
          }
        }
      } else {
        console.log(
          `No recent tweets found for ${handle} or error fetching timeline.`
        );
        if (userTimeline.errors) {
          console.error("Timeline errors:", userTimeline.errors);
        }
      }
    } catch (fetchError) {
      console.error(`Error fetching timeline for ${handle}:`, fetchError);
      if (fetchError.code === 429) {
        console.warn(
          `Rate limit hit for ${handle}. Waiting before next request.`
        );
      }
      if (fetchError.code) {
        console.error("X API Error Code:", fetchError.code);
        console.error("X API Error Message:", fetchError.message);
        if (fetchError.errors) {
          console.error("X API Detailed Errors:", fetchError.errors);
        }
      }
    }

    // Add a delay after processing each handle to respect rate limits
    if (telcoHandles.indexOf(handle) < telcoHandles.length - 1) {
      console.log("Waiting for 15 seconds before processing next handle...");
      await delay(15000);
    }
  } // End of for loop
} // End of checkAndProcessTelcoPosts function

let processTask; // Renamed task variable

const startRepostJob = () => {
  // Keep the function name for now, or rename to startProcessingJob
  if (!processTask) {
    processTask = cron.schedule(
      "*/30 * * * *", // Runs every 30 minutes
      () => {
        checkAndProcessTelcoPosts(); // Call the new function
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
    return res
      .status(400)
      .json({ success: false, message: "Post text is required." });
  }

  const userClient = getUserClient();
  if (!userClient) {
    return res.status(401).json({
      success: false,
      message: "X account not connected or tokens expired.",
    });
  }

  try {
    const { data: createdTweet } = await userClient.v2.tweet(text);
    console.log("Tweet posted successfully:", createdTweet);
    res.json({
      success: true,
      message: "Tweet posted successfully!",
      tweet: createdTweet,
    });
  } catch (error) {
    console.error("Error posting tweet:", error);
    if (error.code) {
      console.error("X API Error Code:", error.code);
      console.error("X API Error Message:", error.message);
      if (error.errors) {
        console.error("X API Detailed Errors:", error.errors);
      }
    }
    res.status(error.code || 500).json({
      success: false,
      message: error.message || "Error posting tweet.",
      error: error.message,
      xErrors: error.errors,
    });
  }
};

const triggerRepost = async (req, res) => {
  // Keep triggerRepost, but it now triggers the combined logic
  const userClient = getUserClient();
  if (!userClient) {
    return res.status(401).json({
      success: false,
      message: "X account not connected or tokens expired.",
    });
  }
  try {
    await checkAndProcessTelcoPosts();
    res.json({
      success: true,
      message:
        "Manual telco post processing triggered. Check backend logs for details.",
    });
  } catch (error) {
    console.error("Error triggering manual processing:", error);
    if (error.code) {
      console.error("X API Error Code:", error.code);
      console.error("X API Error Message:", error.message);
      if (error.errors) {
        console.error("X API Detailed Errors:", error.errors);
      }
    }
    res.status(error.code || 500).json({
      success: false,
      message: error.message || "Error triggering manual processing.",
      error: error.message,
      xErrors: error.errors,
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
