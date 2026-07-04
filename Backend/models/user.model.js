const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  stripeCustomerId: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for trustBadge
userSchema.virtual('trustBadge').get(function() {
  const score = this.trustScore;
  if (score >= 90) return { text: 'Trusted', color: 'green', score };
  if (score >= 70) return { text: 'Good Standing', color: 'yellow', score };
  if (score >= 50) return { text: 'Needs Improvement', color: 'orange', score };
  return { text: 'Restricted', color: 'red', score };
});

// Ensure virtuals are serialized in toJSON and toObject
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
