import api from './api';

export const complaintService = {
  async getAll(filters = {}) {
    const response = await api.get('/complaints', { params: filters });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/complaints', data);
    return response.data;
  },

  async updateStatus(id, status, resolutionNotes, actor, actorRole) {
    const response = await api.put(`/complaints/${id}/status`, {
      status,
      resolutionNotes,
      actor,
      actorRole
    });
    return response.data;
  },

  async startInvestigation(id) {
    const response = await api.post(`/complaints/${id}/start-investigation`);
    return response.data;
  },

  async updateInvestigation(id, data) {
    const response = await api.put(`/complaints/${id}/investigation`, data);
    return response.data;
  },

  async addTimelineEntry(id, status, note) {
    const response = await api.post(`/complaints/${id}/timeline`, { status, note });
    return response.data;
  },

  async resolveComplaint(id, data) {
    const payload = typeof data === 'string' ? { resolutionSummary: data } : data;
    const response = await api.post(`/complaints/${id}/resolve`, payload);
    return response.data;
  },

  async rejectComplaint(id, rejectionReason) {
    const response = await api.post(`/complaints/${id}/reject`, { rejectionReason });
    return response.data;
  },

  async submitResponse(id, responseMessage, status, isDraft = false) {
    const response = await api.post(`/complaints/${id}/submit-response`, { 
      responseMessage, 
      status, 
      isDraft 
    });
    return response.data;
  },

  async saveDraft(id, draft) {
    const response = await api.post(`/complaints/${id}/save-draft`, { draft });
    return response.data;
  },

  async assign(id, data) {
    const response = await api.put(`/complaints/${id}/assign`, data);
    return response.data;
  },

  async addInternalNote(id, text) {
    const response = await api.post(`/complaints/${id}/internal-notes`, { text });
    return response.data;
  },

  async requestMoreInfo(id, text) {
    const response = await api.post(`/complaints/${id}/request-info`, { text });
    return response.data;
  },

  async sendReminder(id) {
    const response = await api.post(`/complaints/${id}/send-reminder`);
    return response.data;
  },

  async submitSatisfaction(id, rating, comment) {
    const response = await api.post(`/complaints/${id}/satisfaction`, { rating, comment });
    return response.data;
  },

  async reopenComplaint(id, reason) {
    const response = await api.post(`/complaints/${id}/reopen`, { reason });
    return response.data;
  },

  async mergeComplaints(id, duplicateIds) {
    const response = await api.post(`/complaints/${id}/merge`, { duplicateIds });
    return response.data;
  },

  async getRelatedComplaints(id) {
    const response = await api.get(`/complaints/${id}/related`);
    return response.data;
  },

  async uploadAttachment(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/complaints/upload-attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getExportPdfUrl(id) {
    return `${api.defaults.baseURL}/complaints/${id}/export/pdf`;
  },

  getExportCsvUrl(id) {
    return `${api.defaults.baseURL}/complaints/${id}/export/csv`;
  },

  getBatchExportUrl(ids) {
    return `${api.defaults.baseURL}/complaints/export/batch?ids=${ids.join(',')}`;
  },

  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data.filter(n => n.type === 'complaint' || n.type === 'complaint_status');
  },

  async markNotificationAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Role permissions checks (local utilities)
  canViewComplaint(complaint, userId, userRole) {
    if (userRole === 'admin') return true;
    return complaint.raisedByUserId === userId || complaint.againstUserId === userId;
  },

  canUpdateComplaint(complaint, userId, userRole) {
    if (userRole === 'admin') return true;
    // Only the user against whom the complaint is raised can update it
    return complaint.againstUserId === userId;
  }
};

export default complaintService;
