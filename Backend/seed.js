const mongoose = require('mongoose');
const User = require('./models/user.model');
const Pool = require('./models/pool.model');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/splitstream');
    console.log('Connected to MongoDB');

    // Find the latest user to use as the contributor
    const latestUser = await User.findOne().sort({ createdAt: -1 });
    if (!latestUser) {
      console.log('No user found! Please register a user first.');
      process.exit(1);
    }
    console.log(`Using ${latestUser.name} (${latestUser.email}) as the contributor`);

    // Check if the mock host already exists
    let mockHost = await User.findOne({ email: 'demohost@splitstream.com' });
    if (!mockHost) {
      mockHost = new User({
        name: 'Demo Host',
        email: 'demohost@splitstream.com',
        password: 'mockpassword123',
        stripeCustomerId: 'cus_mock_demo_host',
        trustScore: 100,
        trustBadge: 'Trusted'
      });
      await mockHost.save();
      console.log('Created Demo Host');
    } else {
      console.log('Demo Host already exists');
    }

    // Create a new pool
    const pool = new Pool({
      hostId: mockHost._id,
      serviceName: 'Demo Spotify',
      planTier: 'Family Plan',
      totalCost: 17900, // 179.00 INR in cents
      slots: 6,
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
    console.log('Pool Name: Demo Spotify');
    console.log('Pool ID:', pool._id.toString());
    console.log(`You can now view this pool and see the 'Pay My Share' button.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
