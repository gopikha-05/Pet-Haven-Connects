import api from './api';

export const supplyService = {
  // Product operations
  async getAllProducts() {
    const response = await api.get('/supplies/products');
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/supplies/products/${id}`);
    return response.data;
  },

  // Cart operations
  async getCart(adopterId) {
    const response = await api.get(`/supplies/cart/${adopterId}`);
    return response.data;
  },

  async addToCart(adopterId, productId, quantity = 1) {
    const response = await api.post(`/supplies/cart/${adopterId}/add`, { productId, quantity });
    return response.data;
  },

  async removeFromCart(adopterId, productId) {
    const response = await api.delete(`/supplies/cart/${adopterId}/remove/${productId}`);
    return response.data;
  },

  async updateCartItemQuantity(adopterId, productId, quantity) {
    const response = await api.put(`/supplies/cart/${adopterId}/update/${productId}`, { quantity });
    return response.data;
  },

  async clearCart(adopterId) {
    const response = await api.delete(`/supplies/cart/${adopterId}/clear`);
    return response.data;
  },

  // Order operations
  async placeOrder(orderData) {
    const response = await api.post('/supplies/order', orderData);
    return response.data;
  },

  async getOrders(adopterId) {
    const response = await api.get(`/supplies/orders/adopter/${adopterId}`);
    return response.data;
  },

  async getOrderById(orderId) {
    const response = await api.get(`/supplies/orders/${orderId}`);
    return response.data;
  },

  async cancelOrder(orderId, adopterId) {
    // Cancel is done by updating order status to 'Cancelled'
    const response = await api.put(`/supplies/orders/${orderId}/status`, { status: 'Cancelled', adopterId });
    return response.data;
  },

  // Shelter operations
  async getShelterOrders(shelterId) {
    const response = await api.get(`/supplies/orders/shelter/${shelterId}`);
    return response.data;
  },

  async updateOrderStatus(orderId, shelterId, newStatus) {
    const response = await api.put(`/supplies/orders/${orderId}/status`, { status: newStatus });
    return response.data;
  },

  // Notification operations (fallback to user notifications feed)
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data.filter(n => n.type === 'payment' || n.type === 'system');
  },

  async markNotificationAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }
};

export default supplyService;
