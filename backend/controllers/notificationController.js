import NotificationService from '../services/notificationService.js';

/**
 * Notification Controller - Handles HTTP requests for notifications
 * All routes require authentication via auth middleware
 */

let notificationService;

// Initialize service with Socket.io instance
export const initNotificationController = (io) => {
  notificationService = new NotificationService(io);
};

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.user.sub,
      unreadOnly === 'true'
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.sub);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.sub
    );
    res.json(notification);
  } catch (error) {
    if (error.message === 'Notification not found or unauthorized') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.sub);
    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all as read', error: error.message });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.deleteNotification(
      req.params.id,
      req.user.sub
    );
    res.json({ message: 'Notification deleted', notification });
  } catch (error) {
    if (error.message === 'Notification not found or unauthorized') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
};

/**
 * POST /api/notifications/send
 * Send a notification (admin only or internal use)
 * This endpoint is for testing and internal notification creation
 */
export const sendNotification = async (req, res) => {
  try {
    const { recipientId, recipientRole, type, title, message, data } = req.body;
    
    if (!recipientId || !recipientRole || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const notification = await notificationService.createNotification({
      recipientId,
      recipientRole,
      type,
      title,
      message,
      data
    });
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
};

/**
 * POST /api/notifications/send-to-role
 * Send notification to all users of a specific role (admin only)
 */
export const sendToRole = async (req, res) => {
  try {
    const { role, type, title, message, data } = req.body;
    
    if (!role || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const notifications = await notificationService.sendToRole(role, {
      type,
      title,
      message,
      data
    });
    
    res.status(201).json({ 
      message: `Notification sent to ${notifications.length} ${role}s`,
      count: notifications.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending notification to role', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-shelter-application
 * Notify shelter when adopter submits application (and admin)
 */
export const notifyShelterApplication = async (req, res) => {
  try {
    const { shelterId, adopterId, adopterName, petName, applicationId } = req.body;
    
    if (!shelterId || !adopterId || !adopterName || !petName || !applicationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyShelterOnApplication(
      shelterId, adopterId, adopterName, petName, applicationId
    );
    
    res.status(201).json({ message: 'Shelter and admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying shelter', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-vet-booking
 * Notify vet when adopter books appointment (and admin)
 */
export const notifyVetBooking = async (req, res) => {
  try {
    const { vetId, adopterId, adopterName, petName, appointmentId, appointmentDate } = req.body;
    
    if (!vetId || !adopterId || !adopterName || !petName || !appointmentId || !appointmentDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyVetOnBooking(
      vetId, adopterId, adopterName, petName, appointmentId, appointmentDate
    );
    
    res.status(201).json({ message: 'Vet and admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying vet', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-adopter-status
 * Notify adopter when shelter updates application status
 */
export const notifyAdopterStatus = async (req, res) => {
  try {
    const { adopterId, shelterName, petName, status, applicationId } = req.body;
    
    if (!adopterId || !shelterName || !petName || !status || !applicationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyAdopterOnStatusUpdate(
      adopterId, shelterName, petName, status, applicationId
    );
    
    res.status(201).json({ message: 'Adopter notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying adopter', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-adopter-vet-response
 * Notify adopter when vet responds to appointment
 */
export const notifyAdopterVetResponse = async (req, res) => {
  try {
    const { adopterId, vetName, petName, status, appointmentId } = req.body;
    
    if (!adopterId || !vetName || !petName || !status || !appointmentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyAdopterOnVetResponse(
      adopterId, vetName, petName, status, appointmentId
    );
    
    res.status(201).json({ message: 'Adopter notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying adopter', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-shelter-complaint
 * Notify shelter when adopter raises complaint (and admin)
 */
export const notifyShelterComplaint = async (req, res) => {
  try {
    const { shelterId, adopterId, adopterName, complaintId } = req.body;
    
    if (!shelterId || !adopterId || !adopterName || !complaintId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyShelterOnComplaint(
      shelterId, adopterId, adopterName, complaintId
    );
    
    res.status(201).json({ message: 'Shelter and admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying shelter', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-vet-complaint
 * Notify vet when adopter raises complaint (and admin)
 */
export const notifyVetComplaint = async (req, res) => {
  try {
    const { vetId, adopterId, adopterName, complaintId } = req.body;
    
    if (!vetId || !adopterId || !adopterName || !complaintId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyVetOnComplaint(
      vetId, adopterId, adopterName, complaintId
    );
    
    res.status(201).json({ message: 'Vet and admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying vet', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-adopter-complaint-update
 * Notify adopter when shelter/vet updates complaint status
 */
export const notifyAdopterComplaintUpdate = async (req, res) => {
  try {
    const { adopterId, responderName, responderRole, status, complaintId } = req.body;
    
    if (!adopterId || !responderName || !responderRole || !status || !complaintId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyAdopterOnComplaintUpdate(
      adopterId, responderName, responderRole, status, complaintId
    );
    
    res.status(201).json({ message: 'Adopter and admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying adopter', error: error.message });
  }
};

/**
 * POST /api/notifications/notify-admin-complaint-activity
 * Notify admin of any complaint-related activity
 */
export const notifyAdminComplaintActivity = async (req, res) => {
  try {
    const { activity, complaintId } = req.body;
    
    if (!activity || !complaintId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    await notificationService.notifyAdminOnComplaintActivity(activity, complaintId);
    
    res.status(201).json({ message: 'Admin notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error notifying admin', error: error.message });
  }
};

// Export service instance for use in other controllers
export const getNotificationService = () => notificationService;
