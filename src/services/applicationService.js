import api from './api';

export const applicationService = {
  async getAll(filters = {}) {
    const response = await api.get('/applications', { params: filters });
    return response.data;
  },

  async getById(id) {
    const response = await api.get('/applications/' + id);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/applications', data);
    return response.data;
  },

  async updateStatus(id, status, note) {
    const response = await api.put(`/applications/${id}/status`, { status, note });
    return response.data;
  },

  async setDeliveryMethod(id, data) {
    const response = await api.put(`/applications/${id}/delivery-method`, data);
    return response.data;
  },

  async markAsPickedUp(id) {
    const response = await api.put(`/applications/${id}/mark-picked-up`);
    return response.data;
  },

  async markAsDelivered(id) {
    const response = await api.put(`/applications/${id}/mark-delivered`);
    return response.data;
  }
};

export default applicationService;
