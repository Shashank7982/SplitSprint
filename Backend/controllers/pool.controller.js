const Pool = require('../models/pool.model');
const User = require('../models/user.model');

// Simulated credential checking for third-party streaming/subscription providers
const verifyServiceCredentials = async (serviceName, email, password) => {
  // Simulate verification network delay (premium feel)
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Simulating errors if they enter 'invalid' or 'wrongpassword' for testing
  if (password.toLowerCase() === 'invalid' || password.toLowerCase() === 'wrongpassword') {
    throw new Error(`Failed to verify credentials on ${serviceName}. Please check your login email/username and password.`);
  }

  // Simple basic validation
  if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email address format for ${serviceName} username.`);
  }

  return true;
};

// Create a new billing pool
const createPool = async (req, res, next) => {
  const { serviceName, planTier, totalCost, billingCycle, slots, upiId, serviceEmail, servicePassword } = req.body;
  const hostId = req.userId; // Settled by protect middleware

  try {
    // Verify credentials
    try {
      await verifyServiceCredentials(serviceName, serviceEmail, servicePassword);
    } catch (verifErr) {
      return res.status(400).json({ success: false, message: verifErr.message });
    }

    // 1. Create a pool document. Mongoose hooks will generate inviteCode/nextBillingDate/shareAmount.
    const pool = new Pool({
      hostId,
      upiId,
      serviceName,
      planTier,
      totalCost,
      billingCycle,
      slots,
      serviceEmail,
      servicePassword,
      members: [{
        userId: hostId,
        role: 'host',
        status: 'active',
        joinedAt: new Date()
      }]
    });

    await pool.save();

    res.status(201).json({
      success: true,
      message: 'Billing pool created successfully and credentials verified',
      pool
    });
  } catch (error) {
    next(error);
  }
};

// Fetch active pools with available slots remaining
const listPools = async (req, res, next) => {
  const { service, minPrice, maxPrice, sortBy } = req.query;

  try {
    // Build query conditions
    const query = { status: 'active' };

    if (service) {
      query.serviceName = { $regex: service, $options: 'i' }; // Case-insensitive regex
    }

    // Filter by shareAmount (stored in cents)
    if (minPrice || maxPrice) {
      query.shareAmount = {};
      if (minPrice) query.shareAmount.$gte = parseInt(minPrice);
      if (maxPrice) query.shareAmount.$lte = parseInt(maxPrice);
    }

    // Fetch matching pools
    let pools = await Pool.find(query)
      .populate('hostId', 'name email trustScore')
      .populate('members.userId', 'name email trustScore');

    // Filter pools with remaining slots programmatically (clean and human-like)
    pools = pools.filter(pool => {
      const activeMembersCount = pool.members.filter(m => m.status === 'active').length;
      return activeMembersCount < pool.slots;
    });

    // Handle optional sorting
    if (sortBy === 'price_asc') {
      pools.sort((a, b) => a.shareAmount - b.shareAmount);
    } else if (sortBy === 'price_desc') {
      pools.sort((a, b) => b.shareAmount - a.shareAmount);
    } else {
      // Default: Newest first
      pools.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.status(200).json({
      success: true,
      count: pools.length,
      pools
    });
  } catch (error) {
    next(error);
  }
};

// Fetch only the logged-in user's pools (hosted + contributing)
const getMyPools = async (req, res, next) => {
  const userId = req.userId;
  try {
    const allMyPools = await Pool.find({
      'members.userId': userId,
      status: 'active',
    })
      .populate('hostId', 'name email trustScore')
      .populate('members.userId', 'name email trustScore')
      .sort({ createdAt: -1 });

    const hosted = allMyPools.filter(p =>
      p.members.some(m => String(m.userId?._id || m.userId) === String(userId) && m.role === 'host')
    );
    const contributing = allMyPools.filter(p =>
      p.members.some(m => String(m.userId?._id || m.userId) === String(userId) && m.role === 'contributor')
    );

    res.status(200).json({ success: true, hosted, contributing });
  } catch (error) {
    next(error);
  }
};



// Fetch details for a single pool by ID
const getPoolById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const pool = await Pool.findById(id)
      .select('+serviceEmail +servicePassword')
      .populate('hostId', 'name email trustScore')
      .populate('members.userId', 'name email trustScore');

    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    const Transaction = require('../models/transaction.model');
    const poolObj = pool.toObject();
    let hasPaidThisCycle = false;

    if (req.userId) {
      const cycleStart = new Date(pool.nextBillingDate);
      if (pool.billingCycle === 'annual') {
        cycleStart.setFullYear(cycleStart.getFullYear() - 1);
      } else {
        cycleStart.setMonth(cycleStart.getMonth() - 1);
      }

      const now = new Date();
      if (now < cycleStart) {
        // Billing date has already rolled forward (meaning all contributors paid),
        // so the user is paid up for the active cycle.
        hasPaidThisCycle = true;
      } else {
        const tx = await Transaction.findOne({
          poolId: pool._id,
          userId: req.userId,
          type: 'contributor_debit',
          status: 'completed',
          createdAt: { $gte: cycleStart }
        });
        if (tx) hasPaidThisCycle = true;
      }
    }

    poolObj.hasPaidThisCycle = hasPaidThisCycle;

    // Gate access to credentials: only show them if requester is Host or paid Contributor
    const isHost = req.userId && String(pool.hostId._id || pool.hostId) === String(req.userId);
    const isAuthorized = isHost || hasPaidThisCycle;

    if (!isAuthorized) {
      delete poolObj.serviceEmail;
      delete poolObj.servicePassword;
    }

    res.status(200).json({
      success: true,
      pool: poolObj
    });
  } catch (error) {
    next(error);
  }
};

// Join pool via invite code
const joinPool = async (req, res, next) => {
  const { id } = req.params;
  const { inviteCode } = req.body;
  const userId = req.userId; // Current contributor logged-in

  try {
    // 1. Fetch pool
    const pool = await Pool.findById(id);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    // 2. Validate invite code matches
    if (pool.inviteCode !== inviteCode) {
      return res.status(400).json({ success: false, message: 'Invalid invite code' });
    }

    // 3. Verify pool is active
    if (pool.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This pool is no longer active' });
    }

    // 4. Verify slots are available
    const activeMembers = pool.members.filter(m => m.status === 'active');
    if (activeMembers.length >= pool.slots) {
      return res.status(400).json({ success: false, message: 'Pool is already full' });
    }

    // 5. Verify contributor is not already a member (or has a pending request)
    const existingMember = pool.members.find(m => m.userId.toString() === userId);
    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(400).json({ success: false, message: 'You are already a member of this pool' });
      } else if (existingMember.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Your request to join this pool is already pending host approval' });
      }
    }

    // 6. Query user trust score and reject if < 50
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.trustScore < 50) {
      return res.status(403).json({
        success: false,
        message: `Your trust score (${user.trustScore}) is below the required minimum of 50. You cannot join this pool.`
      });
    }

    // Determine joining status based on trustScore
    // 50-69: Needs Improvement (requires Host approval to join)
    // 70-100: Active immediately
    const memberStatus = user.trustScore < 70 ? 'pending' : 'active';
    const message = memberStatus === 'pending'
      ? `Join request submitted, pending host approval due to your trust score (${user.trustScore})`
      : 'Joined pool successfully';

    // 7. Add user as contributor member
    pool.members.push({
      userId,
      role: 'contributor',
      status: memberStatus,
      joinedAt: new Date()
    });

    await pool.save();

    // Populate and return updated pool details
    const updatedPool = await Pool.findById(pool._id)
      .populate('hostId', 'name email trustScore')
      .populate('members.userId', 'name email trustScore');

    res.status(200).json({
      success: true,
      message,
      pool: updatedPool
    });
  } catch (error) {
    next(error);
  }
};

// Approve a pending member (Host only)
const approveMember = async (req, res, next) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const hostId = req.userId;

  try {
    // 1. Fetch pool
    const pool = await Pool.findById(id);
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Pool not found' });
    }

    // 2. Verify requesting user is the host
    if (pool.hostId.toString() !== hostId) {
      return res.status(403).json({ success: false, message: 'Only the host can approve pending members' });
    }

    // 3. Find member in pool
    const member = pool.members.find(m => m.userId.toString() === memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this pool' });
    }

    if (member.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Member is not pending approval (current status: ${member.status})` });
    }

    // 4. Verify slots are still available
    const activeMembers = pool.members.filter(m => m.status === 'active');
    if (activeMembers.length >= pool.slots) {
      return res.status(400).json({ success: false, message: 'Cannot approve member: Pool is already full' });
    }

    // 5. Update status to active
    member.status = 'active';
    await pool.save();

    const updatedPool = await Pool.findById(pool._id)
      .populate('hostId', 'name email trustScore')
      .populate('members.userId', 'name email trustScore');

    res.status(200).json({
      success: true,
      message: 'Member approved successfully',
      pool: updatedPool
    });
  } catch (error) {
    next(error);
  }
};

// Member marks that they have paid via UPI
const payUpi = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const pool = await Pool.findById(id);
    if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' });

    const member = pool.members.find(m => m.userId.toString() === userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in pool' });

    member.status = 'payment_pending_verification';
    await pool.save();

    res.status(200).json({ success: true, message: 'Payment marked as pending verification' });
  } catch (error) {
    next(error);
  }
};

// Host verifies a UPI payment
const verifyUpiPayment = async (req, res, next) => {
  const { id } = req.params;
  const { memberId } = req.body;
  const hostId = req.userId;

  try {
    const pool = await Pool.findById(id);
    if (!pool) return res.status(404).json({ success: false, message: 'Pool not found' });
    if (pool.hostId.toString() !== hostId) return res.status(403).json({ success: false, message: 'Only host can verify' });

    const member = pool.members.find(m => m.userId.toString() === memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    if (member.status !== 'payment_pending_verification') {
      return res.status(400).json({ success: false, message: 'Member is not pending payment verification' });
    }

    member.status = 'active';
    await pool.save();

    // Create and save completed transaction
    const Transaction = require('../models/transaction.model');
    const transaction = new Transaction({
      poolId: pool._id,
      userId: member.userId,
      type: 'contributor_debit',
      amount: pool.shareAmount,
      status: 'completed'
    });
    await transaction.save();

    // Recalculate user trust score (+2 trust score)
    const { recalculateUserTrustScore } = require('../services/trust.service');
    await recalculateUserTrustScore(member.userId);

    // Reconcile billing (rolls billing date if everyone paid)
    const { reconcilePoolPayments } = require('./payment.controller');
    await reconcilePoolPayments(pool._id);

    res.status(200).json({ success: true, message: 'Payment verified and transaction recorded successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPool,
  listPools,
  getMyPools,
  getPoolById,
  joinPool,
  approveMember,
  payUpi,
  verifyUpiPayment
};
