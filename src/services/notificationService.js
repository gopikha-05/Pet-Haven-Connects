import api from './api';
import { mockNotifications } from '@/mock/notifications';

/**
 * Notification Service - Real API integration for notifications with fallback to mock
 * This replaces the mock notification system with real backend API calls
 */

export const notificationService = {
  /**
   * Get all notifications for the authenticated user
   * @param {String} userId - User ID (optional, backend gets from token)
   * @param {Boolean} unreadOnly - If true, only return unread notifications
   */
  getNotifications: async (userId, unreadOnly = false) => {
    try {
      const response = await api.get('/notifications', {
        params: { unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Backend not available, using mock notifications:', error);
      // Fallback to mock data when backend is not available
      let notifications = [...mockNotifications];
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read && !n.isRead);
      }
      // Sort by date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return notifications;
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Backend not available, using mock unread count:', error);
      // Fallback to mock data when backend is not available
      const unreadCount = mockNotifications.filter(n => !n.read && !n.isRead).length;
      return unreadCount;
    }
  },

  /**
   * Mark a specific notification as read
   * @param {String} notificationId - Notification ID
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Send a notification (admin only or internal use)
   * @param {Object} notificationData - Notification details
   */
  sendNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  /**
   * Send notification to all users of a specific role (admin only)
   * @param {String} role - Role to send to
   * @param {Object} notificationData - Notification details
   */
  sendToRole: async (role, notificationData) => {
    try {
      const response = await api.post('/notifications/send-to-role', {
        role,
        ...notificationData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  },

  /**
   * Notify shelter when adopter submits application (and admin)
   * @param {Object} data - Notification data
   */
  notifyShelterApplication: async (data) => {
    try {
      const response = await api.post('/notifications/notify-shelter-application', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for shelter application:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'adoption',
        title: 'New Adoption Application',
        message: `${data.adopterName} has submitted an application for ${data.petName}`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { applicationId: data.applicationId, petName: data.petName }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify vet when adopter books appointment (and admin)
   * @param {Object} data - Notification data
   */
  notifyVetBooking: async (data) => {
    try {
      const response = await api.post('/notifications/notify-vet-booking', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for vet booking:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'appointment',
        title: 'New Vet Appointment Booking',
        message: `${data.adopterName} booked an appointment for ${data.petName} on ${data.appointmentDate}`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { appointmentId: data.appointmentId, petName: data.petName }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify adopter when shelter updates application status
   * @param {Object} data - Notification data
   */
  notifyAdopterStatus: async (data) => {
    try {
      const response = await api.post('/notifications/notify-adopter-status', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for adopter status update:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'adoption',
        title: 'Application Status Updated',
        message: `${data.shelterName} has updated your application for ${data.petName} to: ${data.status}`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { applicationId: data.applicationId, status: data.status }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify adopter when vet responds to appointment
   * @param {Object} data - Notification data
   */
  notifyAdopterVetResponse: async (data) => {
    try {
      const response = await api.post('/notifications/notify-adopter-vet-response', data);
      return response.data;
    } catch (error) {
      console.error('Error notifying adopter:', error);
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify shelter when adopter raises complaint (and admin)
   * @param {Object} data - Notification data
   */
  notifyShelterComplaint: async (data) => {
    try {
      const response = await api.post('/notifications/notify-shelter-complaint', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for shelter complaint:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'complaint',
        title: 'New Complaint Raised',
        message: `${data.adopterName} has raised a complaint against your shelter`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { complaintId: data.complaintId }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify vet when adopter raises complaint (and admin)
   * @param {Object} data - Notification data
   */
  notifyVetComplaint: async (data) => {
    try {
      const response = await api.post('/notifications/notify-vet-complaint', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for vet complaint:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'complaint',
        title: 'New Complaint Raised',
        message: `${data.adopterName} has raised a complaint regarding your veterinary service`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { complaintId: data.complaintId }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify adopter when shelter/vet updates complaint status
   * @param {Object} data - Notification data
   */
  notifyAdopterComplaintUpdate: async (data) => {
    try {
      const response = await api.post('/notifications/notify-adopter-complaint-update', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for complaint update:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'complaint_status',
        title: 'Complaint Status Updated',
        message: `${data.responderName} (${data.responderRole}) has updated your complaint to: ${data.status}`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { complaintId: data.complaintId, status: data.status }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  },

  /**
   * Notify admin of any complaint-related activity
   * @param {Object} data - Notification data
   */
  notifyAdminComplaintActivity: async (data) => {
    try {
      const response = await api.post('/notifications/notify-admin-complaint-activity', data);
      return response.data;
    } catch (error) {
      console.error('Backend not available, adding mock notification for admin activity:', error);
      // Add to mock notifications when backend is not available
      const newNotification = {
        id: `n${Date.now()}`,
        type: 'complaint_status',
        title: 'Complaint Activity',
        message: data.activity,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: { complaintId: data.complaintId }
      };
      mockNotifications.unshift(newNotification);
      // Trigger custom event for real-time update
      window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
      // Don't throw error to avoid breaking the main flow
    }
  }
};

export default notificationService;
