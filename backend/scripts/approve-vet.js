import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const approveVet = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pet-haven');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log('Current user status:', {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isEmailVerified: user.isEmailVerified
    });

    user.isApproved = true;
    await user.save();

    console.log('User approved successfully!');
    console.log('Updated status:', {
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isEmailVerified: user.isEmailVerified
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node approve-vet.js <email>');
  process.exit(1);
}

approveVet(email);
