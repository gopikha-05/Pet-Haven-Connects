import api from './api';

export const paymentService = {
  async createOrder(applicationId, paymentMethod) {
    const response = await api.post('/payments/create-order', { applicationId, paymentMethod });
    return response.data;
  },

  async verifyPayment(paymentData) {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  }
};

export default paymentService;
