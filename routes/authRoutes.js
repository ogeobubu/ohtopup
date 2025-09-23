const express = require("express");
const session = require("express-session");
const { TwitterApi } = require("twitter-api-v2");
const { refreshToken } = require("../controllers/userController");
require("dotenv").config();

const appKey = process.env.X_API_KEY;
const appSecret = process.env.X_API_KEY_SECRET;

let storedAccessToken = null;
let storedAccessSecret = null;

const getStoredTokens = () => ({
  accessToken: storedAccessToken,
  accessSecret: storedAccessSecret,
});

const setStoredTokens = (accessToken, accessSecret) => {
  storedAccessToken = accessToken;
  storedAccessSecret = accessSecret;
};

const router = express.Router();

router.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

router.get("/x", async (req, res) => {
  try {
    if (!appKey || !appSecret) {
      console.error("X API Consumer Keys not set.");
      return res
        .status(500)
        .send("Backend configuration error: X API keys missing.");
    }
    const client = new TwitterApi({ appKey, appSecret });

    const callbackUrlGenerated = `${process.env.CLIENT_URL}/api/users/admin/auth/x/callback`;
    console.log("Backend generated Callback URL:", callbackUrlGenerated);

    const authLink = await client.generateAuthLink(callbackUrlGenerated, {
      linkMode: "authorize",
    });
    req.session.oauth_token_secret = authLink.oauth_token_secret;

    res.redirect(authLink.url);
  } catch (error) {
    console.error("Error initiating X OAuth:", error);
    res.status(500).send("Error initiating X authentication.");
  }
});

router.get("/x/callback", async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const oauth_token_secret = req.session.oauth_token_secret;

  console.log("OAuth Callback Params:", req.query);
  console.log("OAuth Token Secret:", oauth_token_secret);

  delete req.session.oauth_token_secret;

  if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
    return res
      .status(400)
      .send("OAuth callback parameters missing or session expired.");
  }

  try {
    if (!appKey || !appSecret) {
      console.error("X API Consumer Keys not set.");
      return res
        .status(500)
        .send("Backend configuration error: X API keys missing.");
    }
    const client = new TwitterApi({
      appKey,
      appSecret,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });

    const { accessToken, accessSecret, screenName, userId } =
      await client.login(oauth_verifier);

    setStoredTokens(accessToken, accessSecret);

    console.log(`OAuth successful! User: ${screenName} (ID: ${userId})`);
    console.log("Access Token:", accessToken, "Access Secret:", accessSecret);

    res.send(
      "X account connected successfully! You can now close this window or return to your admin portal."
    );
  } catch (error) {
    console.error("Error during X OAuth callback:", error);
    res.status(500).send("Error connecting X account.");
  }
});

// Refresh token endpoint
router.post("/refresh", refreshToken);

module.exports = {
  authRouter: router,
  getStoredTokens,
};
