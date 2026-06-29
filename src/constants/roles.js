export const ROLES = {
  ADOPTER: 'adopter',
  SHELTER: 'shelter',
  VET: 'vet',
  VETERINARIAN: 'veterinarian',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.ADOPTER]: 'Adopter',
  [ROLES.SHELTER]: 'Shelter Staff',
  [ROLES.VET]: 'Veterinarian',
  [ROLES.VETERINARIAN]: 'Veterinarian',
  [ROLES.ADMIN]: 'Administrator',
};

export const ROLE_DASHBOARD_PATHS = {
  [ROLES.ADOPTER]: '/adopter/dashboard',
  [ROLES.SHELTER]: '/shelter/dashboard',
  [ROLES.VET]: '/vet/dashboard',
  [ROLES.VETERINARIAN]: '/vet/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};
