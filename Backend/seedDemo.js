require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');
const Pool = require('./models/pool.model');
const Transaction = require('./models/transaction.model');

const DEMO_PASSWORD = 'demo1234';

const USERS = [
  { name: 'Alice Chen',    email: 'alice@demo.com',  trustScore: 95 },
  { name: 'Bob Martinez',  email: 'bob@demo.com',    trustScore: 82 },
  { name: 'Carol Singh',   email: 'carol@demo.com',  trustScore: 65 },
  { name: 'Dan Okafor',    email: 'dan@demo.com',    trustScore: 48 },
  { name: 'Eve Kowalski',  email: 'eve@demo.com',    trustScore: 28 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // Remove any existing demo accounts
  await User.deleteMany({ email: { $in: USERS.map(u => u.email) } });
  await Pool.deleteMany({ serviceName: { $in: ['Demo Netflix', 'Demo Spotify', 'Demo YouTube'] } });

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Create demo users
  const createdUsers = await User.insertMany(
    USERS.map(u => ({
      name: u.name,
      email: u.email,
      password: hashedPassword,
      trustScore: u.trustScore,
      stripeCustomerId: null, // null = auto-provision on first payment (no mock errors!)
    }))
  );

  const [alice, bob, carol, dan] = createdUsers;

  // Helper: create a pool hosted by alice
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const poolDefs = [
    {
      hostId: alice._id,
      serviceName: 'Demo Netflix',
      planTier: 'Premium 4K',
      totalCost: 64900,   // ₹649 in paise
      billingCycle: 'monthly',
      slots: 4,
      upiId: 'alice@upi',
      members: [
        { userId: alice._id, role: 'host',        status: 'active',  joinedAt: new Date() },
        { userId: bob._id,   role: 'contributor', status: 'active',  joinedAt: new Date() },
        { userId: carol._id, role: 'contributor', status: 'active',  joinedAt: new Date() },
      ],
    },
    {
      hostId: alice._id,
      serviceName: 'Demo Spotify',
      planTier: 'Family Plan',
      totalCost: 17900,
      billingCycle: 'monthly',
      slots: 5,
      upiId: 'alice@upi',
      members: [
        { userId: alice._id, role: 'host',        status: 'active',  joinedAt: new Date() },
        { userId: dan._id,   role: 'contributor', status: 'active',  joinedAt: new Date() },
      ],
    },
    {
      hostId: alice._id,
      serviceName: 'Demo YouTube',
      planTier: 'Premium',
      totalCost: 18900,
      billingCycle: 'monthly',
      slots: 5,
      upiId: 'alice@upi',
      members: [
        { userId: alice._id, role: 'host',        status: 'active',  joinedAt: new Date() },
        { userId: bob._id,   role: 'contributor', status: 'active',  joinedAt: new Date() },
      ],
    },
  ];

  for (const def of poolDefs) {
    const pool = new Pool({
      ...def,
      nextBillingDate: nextMonth,
      status: 'active',
    });
    await pool.save();
    console.log(`Created pool: ${def.serviceName} (code: ${pool.inviteCode})`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DEMO LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════');
  USERS.forEach(u => {
    const tier = u.trustScore >= 90 ? '🟢 Trusted' :
                 u.trustScore >= 70 ? '🟡 Good Standing' :
                 u.trustScore >= 50 ? '🟠 Needs Improvement' : '🔴 Restricted';
    console.log(`  ${tier.padEnd(22)} ${u.email.padEnd(22)} / ${DEMO_PASSWORD}  (score: ${u.trustScore})`);
  });
  console.log('═══════════════════════════════════════════════════');
  console.log('\n  Alice hosts 3 pools. Bob/Carol/Dan are contributors.');
  console.log('  Eve has no pools — she can join using invite codes.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
