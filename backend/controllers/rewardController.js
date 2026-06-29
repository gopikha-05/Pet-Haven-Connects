import RewardStats from '../models/RewardStats.js';

// Badge definitions
const BADGES = [
  // Adoption Badges
  {
    id: 'first_paw',
    name: 'First Paw',
    icon: '🐾',
    description: 'Complete first successful adoption',
    category: 'adoption',
    condition: (stats) => stats.petsAdopted >= 1,
    points: 100
  },
  {
    id: 'pet_parent',
    name: 'Pet Parent',
    icon: '🏡',
    description: 'Complete 2 successful adoptions',
    category: 'adoption',
    condition: (stats) => stats.petsAdopted >= 2,
    points: 200
  },
  {
    id: 'animal_hero',
    name: 'Animal Hero',
    icon: '🦸',
    description: 'Complete 5 successful adoptions',
    category: 'adoption',
    condition: (stats) => stats.petsAdopted >= 5,
    points: 500
  },
  // Donation Badges
  {
    id: 'kind_heart',
    name: 'Kind Heart',
    icon: '❤️',
    description: 'Make first donation',
    category: 'donation',
    condition: (stats) => stats.donationCount >= 1,
    points: 50
  },
  {
    id: 'shelter_supporter',
    name: 'Shelter Supporter',
    icon: '💰',
    description: 'Donate ₹1000+ total',
    category: 'donation',
    condition: (stats) => stats.totalDonation >= 1000,
    points: 150
  },
  // Activity Badges
  {
    id: 'pet_lover',
    name: 'Pet Lover',
    icon: '🐶',
    description: 'Add 10 pets to wishlist',
    category: 'activity',
    condition: (stats) => stats.wishlistCount >= 10,
    points: 100
  },
  {
    id: 'explorer',
    name: 'Explorer',
    icon: '🔍',
    description: 'View 20 pets',
    category: 'activity',
    condition: (stats) => stats.petsViewed >= 20,
    points: 100
  },
  // Engagement Badge
  {
    id: 'care_champion',
    name: 'Care Champion',
    icon: '🌟',
    description: 'Complete adoption follow-up or post-adoption care interaction',
    category: 'engagement',
    condition: (stats) => stats.followUpCompleted >= 1,
    points: 30
  }
];

// Get or create reward stats for user
export const getRewardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let rewardStats = await RewardStats.findOne({ userId });
    
    if (!rewardStats) {
      rewardStats = await RewardStats.create({
        userId,
        badges: BADGES.map(b => ({
          badgeId: b.id,
          unlocked: false,
          unlockedAt: null
        }))
      });
    }
    
    // Check for new badge unlocks
    await checkAndUnlockBadges(rewardStats);
    
    res.json({
      success: true,
      data: {
        stats: {
          petsAdopted: rewardStats.petsAdopted,
          petsViewed: rewardStats.petsViewed,
          wishlistCount: rewardStats.wishlistCount,
          donationCount: rewardStats.donationCount,
          totalDonation: rewardStats.totalDonation,
          followUpCompleted: rewardStats.followUpCompleted,
          rewardPoints: rewardStats.rewardPoints,
          level: rewardStats.level
        },
        badges: BADGES.map(badge => {
          const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
          return {
            ...badge,
            unlocked: userBadge?.unlocked || false,
            unlockedAt: userBadge?.unlockedAt || null,
            progress: calculateProgress(badge, rewardStats)
          };
        })
      }
    });
  } catch (error) {
    console.error('Error fetching reward stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward stats'
    });
  }
};

// Update stats based on activity
export const updateActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activity, data } = req.body;
    
    let rewardStats = await RewardStats.findOne({ userId });
    
    if (!rewardStats) {
      rewardStats = await RewardStats.create({
        userId,
        badges: BADGES.map(b => ({
          badgeId: b.id,
          unlocked: false,
          unlockedAt: null
        }))
      });
    }
    
    // Update stats based on activity type
    switch (activity) {
      case 'adoption_completed':
        rewardStats.petsAdopted += 1;
        rewardStats.rewardPoints += 100;
        break;
      case 'donation_made':
        rewardStats.donationCount += 1;
        rewardStats.totalDonation += data.amount || 0;
        rewardStats.rewardPoints += 50;
        break;
      case 'wishlist_added':
        rewardStats.wishlistCount += 1;
        rewardStats.rewardPoints += 10;
        break;
      case 'pet_viewed':
        rewardStats.petsViewed += 1;
        rewardStats.rewardPoints += 5;
        break;
      case 'follow_up_completed':
        rewardStats.followUpCompleted += 1;
        rewardStats.rewardPoints += 30;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid activity type'
        });
    }
    
    await rewardStats.save();
    
    // Check for new badge unlocks
    await checkAndUnlockBadges(rewardStats);
    
    res.json({
      success: true,
      message: 'Activity recorded successfully',
      data: {
        stats: {
          petsAdopted: rewardStats.petsAdopted,
          petsViewed: rewardStats.petsViewed,
          wishlistCount: rewardStats.wishlistCount,
          donationCount: rewardStats.donationCount,
          totalDonation: rewardStats.totalDonation,
          followUpCompleted: rewardStats.followUpCompleted,
          rewardPoints: rewardStats.rewardPoints,
          level: rewardStats.level
        },
        badges: BADGES.map(badge => {
          const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
          return {
            ...badge,
            unlocked: userBadge?.unlocked || false,
            unlockedAt: userBadge?.unlockedAt || null,
            progress: calculateProgress(badge, rewardStats)
          };
        })
      }
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity'
    });
  }
};

// Check and unlock badges
async function checkAndUnlockBadges(rewardStats) {
  let newUnlocks = false;
  
  for (const badge of BADGES) {
    const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
    
    if (!userBadge.unlocked && badge.condition(rewardStats)) {
      userBadge.unlocked = true;
      userBadge.unlockedAt = new Date();
      rewardStats.rewardPoints += badge.points;
      newUnlocks = true;
    }
  }
  
  if (newUnlocks) {
    await rewardStats.save();
  }
}

// Calculate progress for a badge
function calculateProgress(badge, stats) {
  switch (badge.id) {
    case 'first_paw':
      return { current: stats.petsAdopted, target: 1 };
    case 'pet_parent':
      return { current: stats.petsAdopted, target: 2 };
    case 'animal_hero':
      return { current: stats.petsAdopted, target: 5 };
    case 'kind_heart':
      return { current: stats.donationCount, target: 1 };
    case 'shelter_supporter':
      return { current: stats.totalDonation, target: 1000 };
    case 'pet_lover':
      return { current: stats.wishlistCount, target: 10 };
    case 'explorer':
      return { current: stats.petsViewed, target: 20 };
    case 'care_champion':
      return { current: stats.followUpCompleted, target: 1 };
    default:
      return { current: 0, target: 1 };
  }
}
