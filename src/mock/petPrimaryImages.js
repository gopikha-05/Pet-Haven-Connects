/**
 * Pet images from curated catalog (real animals — no Picsum/buildings).
 * Uniqueness + breed fit: one row per mock id in petStockImages.js.
 */

import { PET_CATALOG_MEDIA } from './petStockImages';

/** @type {Map<string, string>} */
const assignedByPetId = new Map();

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** User-created pets only — IDs not in PET_CATALOG_MEDIA; URLs not used in catalog primaries/fallbacks. */
const OVERFLOW_IMAGES = [
  'https://images.unsplash.com/photo-1517849845537-29667373ca5c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1535930741838-639a19dadaa0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560807707-b9390346fe9b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548681523-9439c6d72c49?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598133894007-0adae46db5e9?auto=format&fit=crop&w=800&q=80',
];

export function imageUrlKey(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const { pathname, search } = new URL(url);
    return decodeURIComponent(pathname) + search;
  } catch {
    return url.split('?')[0];
  }
}

function mediaForPet(pet) {
  return pet?.id ? PET_CATALOG_MEDIA[pet.id] : null;
}

/**
 * Assigns images from catalog (primary + fallback in pet.images for detail gallery / onError).
 */
export function applyPetPrimaryImages(pets) {
  assignedByPetId.clear();
  const usedKeys = new Set();
  const catalogPrimaries = new Set(
    Object.values(PET_CATALOG_MEDIA).map((m) => imageUrlKey(m.primary))
  );

  const result = pets.map((pet) => {
    const media = mediaForPet(pet);
    if (media) {
      const primary = media.primary;
      const fallback = media.fallback;
      const key = imageUrlKey(primary);
      if (usedKeys.has(key)) {
        throw new Error(`[petPrimaryImages] Duplicate assignment for "${pet.id}"`);
      }
      usedKeys.add(key);
      assignedByPetId.set(pet.id, primary);
      return { ...pet, image: primary, images: [primary, fallback] };
    }

    const pool = [...OVERFLOW_IMAGES].sort(
      (a, b) => (hashSeed(pet.id + a) & 0xffff) - (hashSeed(pet.id + b) & 0xffff)
    );
    let chosen = pool.find((url) => !usedKeys.has(imageUrlKey(url)) && !catalogPrimaries.has(imageUrlKey(url)));
    if (!chosen) {
      const idx = hashSeed(String(pet.id)) % OVERFLOW_IMAGES.length;
      chosen = OVERFLOW_IMAGES[idx];
    }
    const k = imageUrlKey(chosen);
    if (usedKeys.has(k)) {
      throw new Error(`[petPrimaryImages] Overflow collision for "${pet.id}"`);
    }
    usedKeys.add(k);
    assignedByPetId.set(pet.id, chosen);
    return { ...pet, image: chosen, images: [chosen] };
  });

  assertUniquePetImages(result);
  return result;
}

export function getPetDisplayImage(pet) {
  if (!pet) return '';
  return (
    pet.image ||
    mediaForPet(pet)?.primary ||
    assignedByPetId.get(pet.id) ||
    pet.images?.[0] ||
    ''
  );
}

export function getPetImageErrorFallback(pet, failedSrc) {
  const species = (pet?.species || 'dog').toLowerCase();
  const validSpecies = ['dog', 'cat', 'rabbit', 'bird', 'hamster'].includes(species) ? species : 'dog';
  
  let failedIdx = 0;
  if (pet?.images) {
    failedIdx = pet.images.findIndex(img => imageUrlKey(img) === imageUrlKey(failedSrc));
    if (failedIdx === -1) failedIdx = 0;
  }
  
  const poseNum = (failedIdx % 3) + 1;
  return `/images/pets/${validSpecies}-pose-${poseNum}.svg`;
}

export function assertUniquePetImages(pets) {
  const seen = new Map();
  for (const pet of pets) {
    const url = getPetDisplayImage(pet);
    const key = imageUrlKey(url);
    if (!key) throw new Error(`[petPrimaryImages] Pet "${pet.id}" has no primary image`);
    if (seen.has(key)) {
      throw new Error(
        `[petPrimaryImages] Duplicate image "${key}" on pets "${seen.get(key)}" and "${pet.id}"`
      );
    }
    seen.set(key, pet.id);
  }
  return true;
}
