import { authApi, api } from './api';
import { validateEmail, validatePassword, validateLicense } from '@/utils/validation';

export const authService = {
  async login(email, password) {
    if (!validateEmail(email)) throw { status: 400, message: 'Invalid email format' };
    return authApi.post('/login', { email, password });
  },

  async register(data) {
    if (!validateEmail(data.email)) throw { status: 400, message: 'Invalid email' };
    const pw = validatePassword(data.password);
    if (!pw.valid) throw { status: 400, message: pw.errors.join(', ') };
    
    if (!data.role || !['adopter', 'shelter', 'vet', 'veterinarian', 'admin'].includes(data.role)) {
      throw { status: 400, message: 'Invalid role selected' };
    }
    
    if (['shelter', 'vet', 'veterinarian'].includes(data.role)) {
      if (!data.licenseNumber) {
        throw { status: 400, message: 'License number is required for shelter and veterinarian accounts' };
      }
      if (!validateLicense(data.licenseNumber, data.role)) {
        throw { status: 400, message: 'Invalid license format. Use SHL-YYYY-XXXXX or VET-YYYY-XXXXX' };
      }
    }

    // Map fields to what the backend expects
    const registrationData = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: data.phone,
      licenseNumber: data.licenseNumber
    };

    return authApi.post('/register', registrationData);
  },

  async forgotPassword(email) {
    if (!validateEmail(email)) throw { status: 400, message: 'Invalid email' };
    const response = await authApi.post('/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    if (!token) throw { status: 400, message: 'Invalid token' };
    if (!newPassword || newPassword.length < 8) {
      throw { status: 400, message: 'Password must be at least 8 characters' };
    }
    const response = await authApi.post('/reset-password', { token, password: newPassword });
    return response.data;
  },

  async verifyLicense(license, role) {
    const response = await authApi.post('/verify-license', { 
      licenseNumber: license, 
      role: role.toLowerCase() 
    });
    return response.data;
  },

  async verifyEmail(token) {
    if (!token) throw { status: 400, message: 'Invalid token' };
    const response = await authApi.post('/verify-email', { token });
    return response.data;
  },

  async resendVerification(email) {
    if (!validateEmail(email)) throw { status: 400, message: 'Invalid email' };
    const response = await authApi.post('/resend-verification', { email });
    return response.data;
  },

  async refreshToken(token) {
    if (!token) throw { status: 400, message: 'Invalid refresh token' };
    const response = await authApi.post('/refresh-token', { refreshToken: token });
    return response.data;
  },

  async approveUser(userId) {
    const response = await api.put(`/admin/approve-user/${userId}`);
    return response.data;
  },

  async rejectUser(userId, rejectionReason) {
    const response = await api.put(`/admin/reject-user/${userId}`, { rejectionReason });
    return response.data;
  },

  async getSmtpSettings() {
    const response = await authApi.get('/smtp-settings');
    return response.data;
  },

  async saveSmtpSettings(settings) {
    const response = await authApi.post('/smtp-settings', settings);
    return response.data;
  },

  async getProfile() {
    const response = await authApi.get('/me');
    return response.data;
  },

  async updateProfile(data) {
    const config = {};
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await authApi.put('/me', data, config);
    return response.data;
  }
};

export default authService;
