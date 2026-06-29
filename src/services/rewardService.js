import api from './api';

export const rewardService = {
  // Get user reward stats and badges
  getStats: async () => {
    const response = await api.get('/rewards/stats');
    return response.data;
  },

  // Update user activity (track pet views, wishlist adds, etc.)
  updateActivity: async (activity, data = {}) => {
    const response = await api.post('/rewards/activity', { activity, data });
    return response.data;
  },

  // Track pet view
  trackPetView: async () => {
    return rewardService.updateActivity('pet_viewed');
  },

  // Track wishlist add
  trackWishlistAdd: async () => {
    return rewardService.updateActivity('wishlist_added');
  },

  // Track follow-up completion
  trackFollowUp: async () => {
    return rewardService.updateActivity('follow_up_completed');
  }
};
