import express from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { auth, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All appointment routes require authentication
router.use(auth);

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments for authenticated user (filtered by role)
 * @access  Private
 */
router.get('/', getAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get a single appointment by ID
 * @access  Private
 */
router.get('/:id', getAppointmentById);

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Private (Adopter only)
 */
router.post('/', authorizeRoles('adopter'), createAppointment);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Vet and Admin)
 */
router.put('/:id/status', authorizeRoles('vet', 'admin'), updateAppointmentStatus);

/**
 * @route   PUT /api/appointments/:id/reschedule
 * @desc    Reschedule an appointment
 * @access  Private (Vet and Admin)
 */
router.put('/:id/reschedule', authorizeRoles('vet', 'admin'), rescheduleAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete an appointment
 * @access  Private (Adopter and Admin)
 */
router.delete('/:id', authorizeRoles('adopter', 'admin'), deleteAppointment);

export default router;
