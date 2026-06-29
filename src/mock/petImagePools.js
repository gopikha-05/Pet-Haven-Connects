/**
 * Image pools were replaced by picsum-based URLs in petPrimaryImages.js
 * (Wikimedia paths had many 404s → broken cards). Kept file for imports that may reference resolveBreedPoolKey.
 */

export const BREED_IMAGE_POOLS = {};
export const SPECIES_IMAGE_POOLS = {};

export function resolveBreedPoolKey(breed = '', species = '') {
  return species || 'dog';
}

export function getImagePoolForPet() {
  return [];
}
