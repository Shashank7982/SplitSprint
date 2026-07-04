const rateLimit = require('express-rate-limit');

// Key generator: use the real client IP from Vercel/proxy headers
const realIpKeyGenerator = (req) => {
  // x-forwarded-for can be a comma-separated list; take the first (real client IP)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

// Global rate limiter: 200 requests per 1 minute per real IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: realIpKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a minute.'
  }
});

// Auth rate limiter: 20 attempts per 15 minutes per real IP
// (generous enough for demo/testing but still protects against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: realIpKeyGenerator,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};
