import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendVetAppointmentStatusEmail } from '../services/emailService.js';
import { getNotificationService } from './notificationController.js';

/**
 * GET /api/appointments
 * Get all appointments for the authenticated user (filtered by role)
 */
export const getAppointments = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'vet') {
      query.vetId = req.user.id;
    } else if (req.user.role === 'adopter') {
      query.adopterId = req.user.id;
    }
    // Admin can see all, so query remains unfiltered by role

    // Optional filters
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    const list = await Appointment.find(query).sort({ date: 1, time: 1 });
    
    // Map _id to id for frontend compatibility
    const formatted = list.map(a => {
      const obj = a.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json(formatted);
  } catch (error) {
    console.error('[AppointmentController] Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};

/**
 * GET /api/appointments/:id
 * Get a single appointment by ID
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to view this appointment
    const hasPermission = 
      req.user.role === 'admin' ||
      appointment.vetId.toString() === req.user.id ||
      appointment.adopterId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to view this appointment' });
    }

    const obj = appointment.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[AppointmentController] Error fetching appointment:', error);
    res.status(500).json({ message: 'Error fetching appointment', error: error.message });
  }
};

/**
 * POST /api/appointments
 * Create a new appointment (Adopter only)
 */
export const createAppointment = async (req, res) => {
  try {
    const { petId, petName, vetId, vetName, date, time, type, notes } = req.body;

    // Validate required fields
    if (!petId || !petName || !vetId || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create Mongoose document
    const appointment = await Appointment.create({
      petId,
      petName,
      vetId,
      vetName: vetName || 'Dr. Rajesh Kumar',
      adopterId: req.user.id,
      adopterName: req.user.name,
      date,
      time,
      type: type || 'checkup',
      notes: notes || 'General checkup appointment'
    });

    const formatted = appointment.toObject();
    formatted.id = formatted._id.toString();

    // Trigger Socket.io & DB notification for the vet
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.notifyVetOnBooking(
          vetId,
          req.user.id,
          req.user.name,
          petName,
          appointment._id.toString(),
          date
        );
      } catch (notifErr) {
        console.error('[AppointmentController] Failed to send vet socket notification:', notifErr);
      }
    } else {
      console.warn('[AppointmentController] Notification service not initialized, skipping vet notification');
    }

    res.status(201).json(formatted);
  } catch (error) {
    console.error('[AppointmentController] Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};

/**
 * PUT /api/appointments/:id/status
 * Update appointment status (Vet and Admin only)
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['pending', 'confirmed', 'rejected', 'rescheduled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to update this appointment
    const hasPermission = 
      req.user.role === 'admin' ||
      appointment.vetId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    appointment.status = status;
    if (rejectionReason) {
      appointment.rejectionReason = rejectionReason;
    }
    await appointment.save();

    const formatted = appointment.toObject();
    formatted.id = formatted._id.toString();

    // Fetch adopter details (email) to notify them
    const adopterUser = await User.findById(appointment.adopterId);

    const notificationService = getNotificationService();
    
    // 1. Send live socket notification to Adopter
    if (notificationService) {
      try {
        await notificationService.notifyAdopterOnVetResponse(
          appointment.adopterId.toString(),
          appointment.vetName,
          appointment.petName,
          status,
          appointment._id.toString()
        );
      } catch (notifErr) {
        console.error('[AppointmentController] Failed to send adopter WebSocket update:', notifErr);
      }
    }

    // 2. Dispatch email to Adopter
    if (adopterUser && adopterUser.email) {
      try {
        await sendVetAppointmentStatusEmail(
          adopterUser.email,
          appointment.adopterName,
          appointment.vetName,
          status,
          appointment.date,
          appointment.time,
          rejectionReason || `Your appointment is now ${status}.`
        );
      } catch (emailErr) {
        console.error('[AppointmentController] Failed to send status email:', emailErr);
      }
    }

    res.json(formatted);
  } catch (error) {
    console.error('[AppointmentController] Error updating appointment status:', error);
    res.status(500).json({ message: 'Error updating appointment status', error: error.message });
  }
};

/**
 * PUT /api/appointments/:id/reschedule
 * Reschedule an appointment (Vet and Admin only)
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time, reason } = req.body;

    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to reschedule this appointment
    const hasPermission = 
      req.user.role === 'admin' ||
      appointment.vetId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.rescheduledDate = date;
    appointment.rescheduledTime = time;
    appointment.rescheduleReason = reason || 'Rescheduled by veterinarian';
    appointment.status = 'rescheduled';
    if (reason) {
      appointment.rejectionReason = reason;
    }
    await appointment.save();

    const formatted = appointment.toObject();
    formatted.id = formatted._id.toString();

    // Fetch adopter details (email) to notify them
    const adopterUser = await User.findById(appointment.adopterId);

    const notificationService = getNotificationService();
    
    // 1. Send live socket notification to Adopter
    if (notificationService) {
      try {
        await notificationService.notifyAdopterOnVetResponse(
          appointment.adopterId.toString(),
          appointment.vetName,
          appointment.petName,
          'rescheduled',
          appointment._id.toString()
        );
      } catch (notifErr) {
        console.error('[AppointmentController] Failed to send adopter WebSocket update:', notifErr);
      }
    }

    // 2. Dispatch rescheduled email to Adopter
    if (adopterUser && adopterUser.email) {
      try {
        await sendVetAppointmentStatusEmail(
          adopterUser.email,
          appointment.adopterName,
          appointment.vetName,
          'rescheduled',
          date,
          time,
          reason || 'Vet rescheduled your appointment date/time.'
        );
      } catch (emailErr) {
        console.error('[AppointmentController] Failed to send status email:', emailErr);
      }
    }

    res.json(formatted);
  } catch (error) {
    console.error('[AppointmentController] Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Error rescheduling appointment', error: error.message });
  }
};

/**
 * DELETE /api/appointments/:id
 * Delete an appointment (Adopter and Admin only)
 */
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to delete this appointment
    const hasPermission = 
      req.user.role === 'admin' ||
      appointment.adopterId.toString() === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to delete this appointment' });
    }

    await Appointment.deleteOne({ _id: req.params.id });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('[AppointmentController] Error deleting appointment:', error);
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
};
