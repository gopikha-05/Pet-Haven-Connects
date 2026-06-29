import api from './api';

/**
 * Appointment Service - Real API integration for appointments
 * This replaces the mock appointment system with real backend API calls
 */

export const appointmentService = {
  /**
   * Get all appointments for the authenticated user
   * @param {Object} filters - Optional filters (status, type)
   */
  async getAll(filters = {}) {
    try {
      console.log('[AppointmentService] Fetching appointments with filters:', filters);
      const response = await api.get('/appointments', { params: filters });
      console.log('[AppointmentService] Appointments fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error fetching appointments:', error);
      throw error;
    }
  },

  /**
   * Get a single appointment by ID
   * @param {String} id - Appointment ID
   */
  async getById(id) {
    try {
      console.log('[AppointmentService] Fetching appointment by ID:', id);
      const response = await api.get(`/appointments/${id}`);
      console.log('[AppointmentService] Appointment fetched successfully');
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error fetching appointment:', error);
      throw error;
    }
  },

  /**
   * Create a new appointment
   * @param {Object} data - Appointment data
   */
  async create(data) {
    try {
      console.log('[AppointmentService] Creating appointment with data:', data);
      console.log('[AppointmentService] API base URL:', api.defaults?.baseURL);
      const response = await api.post('/appointments', data);
      console.log('[AppointmentService] Appointment created successfully:', response.data._id);
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error creating appointment:', error);
      console.error('[AppointmentService] Error response:', error.response?.data);
      console.error('[AppointmentService] Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Update appointment status
   * @param {String} id - Appointment ID
   * @param {String} status - New status
   * @param {String} rejectionReason - Optional rejection reason
   */
  async updateStatus(id, status, rejectionReason = null) {
    try {
      console.log('[AppointmentService] Updating appointment status:', id, 'to:', status);
      const response = await api.put(`/appointments/${id}/status`, { status, rejectionReason });
      console.log('[AppointmentService] Appointment status updated successfully');
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error updating appointment status:', error);
      throw error;
    }
  },

  /**
   * Reschedule an appointment
   * @param {String} id - Appointment ID
   * @param {String} date - New date
   * @param {String} time - New time
   */
  async reschedule(id, date, time) {
    try {
      console.log('[AppointmentService] Rescheduling appointment:', id, 'to:', date, time);
      const response = await api.put(`/appointments/${id}/reschedule`, { date, time });
      console.log('[AppointmentService] Appointment rescheduled successfully');
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error rescheduling appointment:', error);
      throw error;
    }
  },

  /**
   * Delete an appointment
   * @param {String} id - Appointment ID
   */
  async delete(id) {
    try {
      console.log('[AppointmentService] Deleting appointment:', id);
      const response = await api.delete(`/appointments/${id}`);
      console.log('[AppointmentService] Appointment deleted successfully');
      return response.data;
    } catch (error) {
      console.error('[AppointmentService] Error deleting appointment:', error);
      throw error;
    }
  }
};

export default appointmentService;
