const mongoose = require('mongoose');
const User = require('./models/user.model');
const Pool = require('./models/pool.model');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/splitstream');
    console.log('Connected to MongoDB');

    // Find the user by their actual email to use as the contributor
    const latestUser = await User.findOne({ email: 'shashank1234@gmail.com' });
    if (!latestUser) {
      console.log('No user found with shashank1234@gmail.com! Please register a user first.');
      process.exit(1);
    }
    
    // Check if a second mock host exists
    let mockHost = await User.findOne({ email: 'netflixhost@splitstream.com' });
    if (!mockHost) {
      mockHost = new User({
        name: 'Netflix Host',
        email: 'netflixhost@splitstream.com',
        password: 'mockpassword123',
        stripeCustomerId: 'cus_mock_netflix_host',
        trustScore: 95,
        trustBadge: 'Trusted'
      });
      await mockHost.save();
    }

    // Create a new pool
    const pool = new Pool({
      hostId: mockHost._id,
      serviceName: 'Netflix',
      planTier: 'Premium 4K',
      totalCost: 64900, // 649.00 INR in cents
      slots: 4,
      billingCycle: 'monthly',
      members: [
        {
          userId: mockHost._id,
          role: 'host',
          joinedAt: new Date(),
          status: 'active'
        },
        {
          userId: latestUser._id,
          role: 'contributor',
          joinedAt: new Date(),
          status: 'active'
        }
      ]
    });

    await pool.save();

    console.log('\n--- SUCCESS ---');
    console.log('Pool Name: Netflix');
    console.log('Host: Netflix Host');
    console.log('Contributor:', latestUser.email);
    console.log('Pool ID:', pool._id.toString());
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
