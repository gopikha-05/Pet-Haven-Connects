import { api, authApi } from './api';
import { complaintService } from './complaintService';

export const dataService = {
  getNotifications: async (userId) => {
    const { notificationService } = await import('./notificationService.js');
    return await notificationService.getNotifications(userId);
  },

  getAppointments: async (filters = {}) => {
    const response = await api.get('/appointments', { params: filters });
    return response.data;
  },

  getMedicalRecords: async () => {
    const response = await api.get('/medical');
    return response.data;
  },

  getDonations: async () => {
    const response = await api.get('/donations');
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/billing/transactions');
    return response.data;
  },

  getBadges: async (userId) => {
    const uid = userId || JSON.parse(localStorage.getItem('user') || '{}')?.id || 'u1';
    const response = await api.get('/billing/badges', { params: { userId: uid } });
    return response.data;
  },

  getComplaints: async () => {
    return await complaintService.getAll();
  },

  getShelters: async () => {
    const response = await authApi.get('/shelters');
    return response.data;
  },

  getVeterinarians: async () => {
    const response = await authApi.get('/vets');
    return response.data;
  },

  getUsers: async () => {
    const response = await authApi.get('/users');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/analytics');
    return response.data;
  },

  processDonation: async (data) => {
    const response = await api.post('/donations', data);
    return response.data;
  },
};

export default dataService;
