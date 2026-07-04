const mongoose = require('mongoose');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');

async function fix() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/splitstream');
    console.log('Connected to MongoDB');

    const users = await User.find().select('+password');
    for (let user of users) {
      if (!user.password.startsWith('$2')) {
        console.log(`Hashing password for user: ${user.email}`);
        user.password = await bcrypt.hash(user.password, 12);
        await user.save();
      }
    }

    console.log('All passwords fixed and hashed!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fix();
