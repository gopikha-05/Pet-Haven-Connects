import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Notification Service - Handles all notification operations
 * This service manages creating, delivering, and querying notifications
 * with role-based routing and real-time delivery via Socket.io
 */

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Create and deliver a notification to a specific user
   * @param {Object} notificationData - Notification details
   * @param {String} notificationData.recipientId - User ID to receive notification
   * @param {String} notificationData.recipientRole - Role of recipient (adopter, shelter, veterinarian, admin)
   * @param {String} notificationData.type - Notification type
   * @param {String} notificationData.title - Notification title
   * @param {String} notificationData.message - Notification message
   * @param {Object} notificationData.data - Additional data (complaintId, petId, etc.)
   */
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      
      // Get recipient user to check if they're online
      const recipient = await User.findById(notificationData.recipientId);
      
      // Send real-time notification if user is connected via socket
      if (recipient && recipient.socketId) {
        this.io.to(recipient.socketId).emit('new_notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          data: notification.data
        });
        
        // Also emit unread count update
        const unreadCount = await Notification.countDocuments({
          recipientId: notificationData.recipientId,
          isRead: false
        });
        
        this.io.to(recipient.socketId).emit('notification_count', { count: unreadCount });
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to all users of a specific role
   * @param {String} role - Role to send notification to (adopter, shelter, veterinarian, admin)
   * @param {Object} notificationData - Notification details (without recipientId)
   */
  async sendToRole(role, notificationData) {
    try {
      const users = await User.find({ role, isActive: true });
      
      const notifications = await Promise.all(
        users.map(user => 
          this.createNotification({
            ...notificationData,
            recipientId: user._id,
            recipientRole: role
          })
        )
      );
      
      return notifications;
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   * @param {String} userId - User ID
   * @param {Boolean} unreadOnly - If true, only return unread notifications
   */
  async getUserNotifications(userId, unreadOnly = false) {
    try {
      const query = { recipientId: userId };
      if (unreadOnly) {
        query.isRead = false;
      }
      
      const notifications = await Notification
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50);
      
      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - User ID
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        recipientId: userId,
        isRead: false
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        throw new Error('Notification not found or unauthorized');
      }
      
      // Update unread count for the user
      const recipient = await User.findById(userId);
      if (recipient && recipient.socketId) {
        const unreadCount = await this.getUnreadCount(userId);
        this.io.to(recipient.socketId).emit('notification_count', { count: unreadCount });
      }
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      // Update unread count for the user
      const recipient = await User.findById(userId);
      if (recipient && recipient.socketId) {
        this.io.to(recipient.socketId).emit('notification_count', { count: 0 });
      }
      
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID (for authorization)
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId
      });
      
      if (!notification) {
        throw new Error('Notification not found or unauthorized');
      }
      
      // Update unread count for the user
      const recipient = await User.findById(userId);
      if (recipient && recipient.socketId) {
        const unreadCount = await this.getUnreadCount(userId);
        this.io.to(recipient.socketId).emit('notification_count', { count: unreadCount });
      }
      
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Register user's socket ID for real-time notifications
   * @param {String} userId - User ID
   * @param {String} socketId - Socket ID
   */
  async registerSocket(userId, socketId) {
    try {
      await User.findByIdAndUpdate(userId, { socketId });
    } catch (error) {
      console.error('Error registering socket:', error);
      throw error;
    }
  }

  /**
   * Unregister user's socket ID when they disconnect
   * @param {String} userId - User ID
   */
  async unregisterSocket(userId) {
    try {
      await User.findByIdAndUpdate(userId, { socketId: null });
    } catch (error) {
      console.error('Error unregistering socket:', error);
      throw error;
    }
  }

  /**
   * Notify shelter when adopter submits adoption application
   * @param {String} shelterId - Shelter user ID
   * @param {String} adopterId - Adopter user ID
   * @param {String} adopterName - Adopter name
   * @param {String} petName - Pet name
   * @param {String} applicationId - Application ID
   */
  async notifyShelterOnApplication(shelterId, adopterId, adopterName, petName, applicationId) {
    try {
      // Notify shelter
      await this.createNotification({
        recipientId: shelterId,
        recipientRole: 'shelter',
        type: 'adoption',
        title: 'New Adoption Application',
        message: `${adopterName} has submitted an application for ${petName}`,
        data: { adopterId, petName, applicationId }
      });

      // Also notify admin
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'adoption',
        title: 'New Adoption Application',
        message: `${adopterName} applied for ${petName} at a shelter`,
        data: { adopterId, shelterId, petName, applicationId }
      });
    } catch (error) {
      console.error('Error notifying shelter on application:', error);
      throw error;
    }
  }

  /**
   * Notify vet when adopter books appointment
   * @param {String} vetId - Veterinarian user ID
   * @param {String} adopterId - Adopter user ID
   * @param {String} adopterName - Adopter name
   * @param {String} petName - Pet name
   * @param {String} appointmentId - Appointment ID
   * @param {String} appointmentDate - Appointment date
   */
  async notifyVetOnBooking(vetId, adopterId, adopterName, petName, appointmentId, appointmentDate) {
    try {
      // Notify vet
      await this.createNotification({
        recipientId: vetId,
        recipientRole: 'vet',
        type: 'appointment',
        title: 'New Vet Appointment Booking',
        message: `${adopterName} booked an appointment for ${petName} on ${appointmentDate}`,
        data: { adopterId, petName, appointmentId, appointmentDate }
      });

      // Also notify admin
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'appointment',
        title: 'New Vet Appointment Booking',
        message: `${adopterName} booked an appointment with a veterinarian`,
        data: { adopterId, vetId, petName, appointmentId, appointmentDate }
      });
    } catch (error) {
      console.error('Error notifying vet on booking:', error);
      throw error;
    }
  }

  /**
   * Notify adopter when shelter updates application status
   * @param {String} adopterId - Adopter user ID
   * @param {String} shelterName - Shelter name
   * @param {String} petName - Pet name
   * @param {String} status - New status
   * @param {String} applicationId - Application ID
   */
  async notifyAdopterOnStatusUpdate(adopterId, shelterName, petName, status, applicationId) {
    try {
      await this.createNotification({
        recipientId: adopterId,
        recipientRole: 'adopter',
        type: 'adoption',
        title: 'Application Status Updated',
        message: `${shelterName} has updated your application for ${petName} to: ${status}`,
        data: { shelterName, petName, status, applicationId }
      });
    } catch (error) {
      console.error('Error notifying adopter on status update:', error);
      throw error;
    }
  }

  /**
   * Notify adopter when vet responds to appointment
   * @param {String} adopterId - Adopter user ID
   * @param {String} vetName - Veterinarian name
   * @param {String} petName - Pet name
   * @param {String} status - Appointment status
   * @param {String} appointmentId - Appointment ID
   */
  async notifyAdopterOnVetResponse(adopterId, vetName, petName, status, appointmentId) {
    try {
      await this.createNotification({
        recipientId: adopterId,
        recipientRole: 'adopter',
        type: 'appointment',
        title: 'Vet Appointment Updated',
        message: `Dr. ${vetName} has ${status} your appointment for ${petName}`,
        data: { vetName, petName, status, appointmentId }
      });
    } catch (error) {
      console.error('Error notifying adopter on vet response:', error);
      throw error;
    }
  }

  /**
   * Get admin user ID (helper method)
   */
  async getAdminUserId() {
    try {
      const admin = await User.findOne({ role: 'admin', isActive: true });
      return admin ? admin._id : null;
    } catch (error) {
      console.error('Error getting admin user ID:', error);
      return null;
    }
  }

  /**
   * Notify shelter when adopter raises complaint against shelter (and admin)
   * @param {String} shelterId - Shelter user ID
   * @param {String} adopterId - Adopter user ID
   * @param {String} adopterName - Adopter name
   * @param {String} complaintId - Complaint ID
   */
  async notifyShelterOnComplaint(shelterId, adopterId, adopterName, complaintId) {
    try {
      // Notify shelter
      await this.createNotification({
        recipientId: shelterId,
        recipientRole: 'shelter',
        type: 'complaint',
        title: 'New Complaint Raised',
        message: `${adopterName} has raised a complaint against your shelter`,
        data: { adopterId, complaintId }
      });

      // Also notify admin
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'complaint',
        title: 'New Complaint Against Shelter',
        message: `${adopterName} has raised a complaint against a shelter`,
        data: { adopterId, shelterId, complaintId }
      });
    } catch (error) {
      console.error('Error notifying shelter on complaint:', error);
      throw error;
    }
  }

  /**
   * Notify vet when adopter raises complaint against vet (and admin)
   * @param {String} vetId - Veterinarian user ID
   * @param {String} adopterId - Adopter user ID
   * @param {String} adopterName - Adopter name
   * @param {String} complaintId - Complaint ID
   */
  async notifyVetOnComplaint(vetId, adopterId, adopterName, complaintId) {
    try {
      // Notify vet
      await this.createNotification({
        recipientId: vetId,
        recipientRole: 'vet',
        type: 'complaint',
        title: 'New Complaint Raised',
        message: `${adopterName} has raised a complaint regarding your veterinary service`,
        data: { adopterId, complaintId }
      });

      // Also notify admin
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'complaint',
        title: 'New Complaint Against Veterinarian',
        message: `${adopterName} has raised a complaint against a veterinarian`,
        data: { adopterId, vetId, complaintId }
      });
    } catch (error) {
      console.error('Error notifying vet on complaint:', error);
      throw error;
    }
  }

  /**
   * Notify adopter when shelter/vet updates complaint status
   * @param {String} adopterId - Adopter user ID
   * @param {String} responderName - Name of shelter/vet responding
   * @param {String} responderRole - Role of responder (shelter/veterinarian)
   * @param {String} status - New complaint status
   * @param {String} complaintId - Complaint ID
   */
  async notifyAdopterOnComplaintUpdate(adopterId, responderName, responderRole, status, complaintId) {
    try {
      await this.createNotification({
        recipientId: adopterId,
        recipientRole: 'adopter',
        type: 'complaint_status',
        title: 'Complaint Status Updated',
        message: `${responderName} (${responderRole}) has updated your complaint to: ${status}`,
        data: { responderName, responderRole, status, complaintId }
      });

      // Also notify admin
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'complaint_status',
        title: 'Complaint Status Updated',
        message: `Complaint status changed to: ${status}`,
        data: { adopterId, responderName, responderRole, status, complaintId }
      });
    } catch (error) {
      console.error('Error notifying adopter on complaint update:', error);
      throw error;
    }
  }

  /**
   * Notify admin of any complaint-related activity
   * @param {String} activity - Description of activity
   * @param {String} complaintId - Complaint ID
   */
  async notifyAdminOnComplaintActivity(activity, complaintId) {
    try {
      await this.createNotification({
        recipientId: await this.getAdminUserId(),
        recipientRole: 'admin',
        type: 'complaint_status',
        title: 'Complaint Activity',
        message: activity,
        data: { complaintId }
      });
    } catch (error) {
      console.error('Error notifying admin on complaint activity:', error);
      throw error;
    }
  }
}

export default NotificationService;
