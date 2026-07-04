const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'contributor'],
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'defaulted', 'left', 'pending', 'payment_pending_verification'],
    default: 'active'
  }
}, { _id: false });

const poolSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upiId: {
    type: String,
    trim: true
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  planTier: {
    type: String,
    trim: true
  },
  totalCost: {
    type: Number, // in cents
    required: [true, 'Total cost in cents is required']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true
  },
  slots: {
    type: Number,
    required: [true, 'Number of slots is required'],
    min: [2, 'Slots must be at least 2'],
    max: [6, 'Slots cannot exceed 6']
  },
  shareAmount: {
    type: Number // in cents
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'active'
  },
  members: [memberSchema],
  inviteCode: {
    type: String,
    unique: true
  },
  nextBillingDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate shareAmount, nextBillingDate, and generate inviteCode
poolSchema.pre('validate', function() {
  // Calculate share amount
  if (this.totalCost && this.slots) {
    this.shareAmount = Math.round(this.totalCost / this.slots);
  }

  // Generate unique 8-character invite code if not present
  if (!this.inviteCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = code;
  }

  // Calculate next billing date if not present
  if (!this.nextBillingDate) {
    const date = new Date();
    if (this.billingCycle === 'annual') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    this.nextBillingDate = date;
  }
});

const Pool = mongoose.model('Pool', poolSchema);
module.exports = Pool;
