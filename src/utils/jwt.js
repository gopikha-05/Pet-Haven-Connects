import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'phc_access_token';
const REFRESH_KEY = 'phc_refresh_token';
const REMEMBER_KEY = 'phc_remember_me';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token, remember = false) {
  clearToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  if (remember) localStorage.setItem(REMEMBER_KEY, 'true');
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(REFRESH_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) === 'true';
}
