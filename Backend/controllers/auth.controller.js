const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../services/auth.service');

// Register a new user
const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 2. Hash the password (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create Stripe customer (real Stripe call if key is set, fallback to mock for demo)
    let stripeCustomerId = '';
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const customer = await stripe.customers.create({ email, name });
        stripeCustomerId = customer.id;
      } catch (stripeError) {
        console.error('Stripe Customer Creation failed, using fallback mock ID:', stripeError.message);
        stripeCustomerId = `cus_mock_${Math.random().toString(36).substr(2, 9)}`;
      }
    } else {
      stripeCustomerId = `cus_mock_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 4. Create and save the user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      stripeCustomerId
    });

    await user.save();

    // 5. Send response (exclude password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        trustBadge: user.trustBadge,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email (include password field specifically)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Compare password hashes
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 4. Set HTTP-only refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 5. Return access token and user info
    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        trustBadge: user.trustBadge,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh access token
const refresh = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    // 1. Verify token
    const decoded = verifyRefreshToken(refreshToken);

    // 2. Find user in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // 3. Generate new access token
    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// Logout user (clear cookies)
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get current user profile (dynamic fetch)
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        trustBadge: user.trustBadge,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile
};
