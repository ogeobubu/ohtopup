const { GoogleAuth } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');
const User = require('../model/User');
const Wallet = require('../model/Wallet');
const jwt = require('jsonwebtoken');
require("dotenv").config();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/api/users/auth/google/callback`
);

// Generate Google OAuth URL
const getGoogleAuthURL = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  });

  return authorizationUrl;
};

// Handle Google OAuth callback
const handleGoogleCallback = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    const googleUser = userInfoResponse.data;

    // Check if user already exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // User exists, check if they have Google OAuth
      if (!user.googleId) {
        // Link Google account to existing user
        user.googleId = googleUser.id;
        user.isVerified = true; // Google accounts are pre-verified
        await user.save();
      }
    } else {
      // Create new user
      const baseUsername = googleUser.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;

      // Ensure unique username
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        username,
        email: googleUser.email,
        googleId: googleUser.id,
        isVerified: true, // Google accounts are pre-verified
        source: 'google',
        profilePicture: googleUser.picture
      });

      await user.save();

      // Create wallet for new user
      const wallet = new Wallet({ userId: user._id });
      await wallet.save();
    }

    // Generate JWT token
    const payload = { user: { id: user._id, role: user.role } };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });

    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      },
      token
    };

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    throw new Error('Failed to authenticate with Google');
  }
};

module.exports = {
  getGoogleAuthURL,
  handleGoogleCallback
};