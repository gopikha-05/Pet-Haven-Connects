import { connectDB } from './database.js';
import mongoose from 'mongoose';

const run = async () => {
  await connectDB();
  console.log('[Seed Runner] Seeding finished. Exiting...');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('[Seed Runner] Error:', err);
  process.exit(1);
});
