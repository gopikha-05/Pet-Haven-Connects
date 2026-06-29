import axios from 'axios';
import { getToken, clearToken } from '@/utils/jwt';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authBaseURL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api/auth';
const mainBaseURL = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8081';
const socketURL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const authApi = axios.create({
  baseURL: authBaseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const mainApi = axios.create({
  baseURL: mainBaseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const setupInterceptors = (client) => {
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearToken();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

setupInterceptors(api);
setupInterceptors(authApi);
setupInterceptors(mainApi);

export { api, authApi, mainApi, socketURL };
export default api;

