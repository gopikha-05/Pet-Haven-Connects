import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedUsers } from './seed.js';

dotenv.config();

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Run database seeder
    await seedUsers();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
