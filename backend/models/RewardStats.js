import mongoose from 'mongoose';

const rewardStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Activity stats
  petsAdopted: {
    type: Number,
    default: 0
  },
  petsViewed: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },
  donationCount: {
    type: Number,
    default: 0
  },
  totalDonation: {
    type: Number,
    default: 0
  },
  followUpCompleted: {
    type: Number,
    default: 0
  },
  // Points system
  rewardPoints: {
    type: Number,
    default: 0
  },
  // Badges tracking
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    unlocked: {
      type: Boolean,
      default: false
    },
    unlockedAt: {
      type: Date
    }
  }],
  // Level system
  level: {
    type: String,
    default: 'Beginner Pet Lover',
    enum: ['Beginner Pet Lover', 'Animal Friend', 'Pet Champion', 'Animal Hero']
  }
}, {
  timestamps: true
});

// Calculate level based on points
rewardStatsSchema.methods.calculateLevel = function() {
  const points = this.rewardPoints;
  if (points >= 700) return 'Animal Hero';
  if (points >= 301) return 'Pet Champion';
  if (points >= 101) return 'Animal Friend';
  return 'Beginner Pet Lover';
};

// Update level automatically before save
rewardStatsSchema.pre('save', function(next) {
  this.level = this.calculateLevel();
  next();
});

export default mongoose.model('RewardStats', rewardStatsSchema);
