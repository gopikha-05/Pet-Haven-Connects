import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendToRole,
  notifyShelterApplication,
  notifyVetBooking,
  notifyAdopterStatus,
  notifyAdopterVetResponse,
  notifyShelterComplaint,
  notifyVetComplaint,
  notifyAdopterComplaintUpdate,
  notifyAdminComplaintActivity
} from '../controllers/notificationController.js';
import { auth, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(auth);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   POST /api/notifications/send
 * @desc    Send a notification (for testing/internal use)
 * @access  Private (Admin only in production)
 */
router.post('/send', authorizeRoles('admin'), sendNotification);

/**
 * @route   POST /api/notifications/send-to-role
 * @desc    Send notification to all users of a specific role
 * @access  Private (Admin only)
 */
router.post('/send-to-role', authorizeRoles('admin'), sendToRole);

/**
 * @route   POST /api/notifications/notify-shelter-application
 * @desc    Notify shelter when adopter submits application (and admin)
 * @access  Private
 */
router.post('/notify-shelter-application', notifyShelterApplication);

/**
 * @route   POST /api/notifications/notify-vet-booking
 * @desc    Notify vet when adopter books appointment (and admin)
 * @access  Private
 */
router.post('/notify-vet-booking', notifyVetBooking);

/**
 * @route   POST /api/notifications/notify-adopter-status
 * @desc    Notify adopter when shelter updates application status
 * @access  Private
 */
router.post('/notify-adopter-status', notifyAdopterStatus);

/**
 * @route   POST /api/notifications/notify-adopter-vet-response
 * @desc    Notify adopter when vet responds to appointment
 * @access  Private
 */
router.post('/notify-adopter-vet-response', notifyAdopterVetResponse);

/**
 * @route   POST /api/notifications/notify-shelter-complaint
 * @desc    Notify shelter when adopter raises complaint (and admin)
 * @access  Private
 */
router.post('/notify-shelter-complaint', notifyShelterComplaint);

/**
 * @route   POST /api/notifications/notify-vet-complaint
 * @desc    Notify vet when adopter raises complaint (and admin)
 * @access  Private
 */
router.post('/notify-vet-complaint', notifyVetComplaint);

/**
 * @route   POST /api/notifications/notify-adopter-complaint-update
 * @desc    Notify adopter when shelter/vet updates complaint status
 * @access  Private
 */
router.post('/notify-adopter-complaint-update', notifyAdopterComplaintUpdate);

/**
 * @route   POST /api/notifications/notify-admin-complaint-activity
 * @desc    Notify admin of any complaint-related activity
 * @access  Private
 */
router.post('/notify-admin-complaint-activity', notifyAdminComplaintActivity);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a specific notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

export default router;
