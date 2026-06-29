import api from './api';

export const medicalRecordService = {
  async getAll(filters = {}) {
    const response = await api.get('/medical', { params: filters });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/medical/${id}`);
    return response.data;
  },

  async getByPetId(petId) {
    const response = await api.get(`/medical/${petId}`);
    return response.data;
  },

  async addTreatment(petId, treatment) {
    // Map fields from frontend names to backend names
    const payload = {
      date: treatment.visitDate || new Date().toISOString().substring(0, 10),
      type: treatment.diagnosis,
      vet: treatment.vetName || 'Dr. Unknown',
      notes: `${treatment.treatment || ''} - ${treatment.vetNotes || ''}`
    };
    const response = await api.post(`/medical/${petId}/treatments`, payload);
    return response.data;
  },

  async updateBehavioralNotes(petId, notes) {
    const response = await api.put(`/medical/${petId}/behavioral`, { behavioralNotes: notes });
    return response.data;
  },

  async updateDailyCareNotes(petId, notes) {
    const response = await api.put(`/medical/${petId}/daily-care`, { dailyCareNotes: notes });
    return response.data;
  }
};

export default medicalRecordService;
