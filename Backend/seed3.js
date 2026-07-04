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
    
    // Check if the mock UPI host exists
    let mockHost = await User.findOne({ email: 'upihost@splitstream.com' });
    if (!mockHost) {
      mockHost = new User({
        name: 'UPI Host',
        email: 'upihost@splitstream.com',
        password: 'mockpassword123',
        stripeCustomerId: 'cus_mock_upi_host',
        trustScore: 98,
        trustBadge: 'Trusted'
      });
      await mockHost.save();
    }

    // Create a new pool with upiId configured
    const pool = new Pool({
      hostId: mockHost._id,
      serviceName: 'YouTube Premium',
      planTier: 'Family Plan',
      totalCost: 18900, // 189.00 INR in cents
      slots: 6,
      billingCycle: 'monthly',
      upiId: 'upihost@paytm', // Host UPI ID
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
    console.log('Pool Name: YouTube Premium');
    console.log('Host: UPI Host');
    console.log('Host UPI ID: upihost@paytm');
    console.log('Contributor:', latestUser.email);
    console.log('Pool ID:', pool._id.toString());
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
