export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  return { valid: errors.length === 0, errors };
}

export function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function validateLicense(license, role) {
  if (role === 'shelter') return /^SHL-\d{4}-\d{5}$/i.test(license);
  if (role === 'vet' || role === 'veterinarian') return /^VET-\d{4}-\d{5}$/i.test(license);
  return license.length >= 5;
}
