import api from './api';

// Real pet image fallbacks by species (Unsplash URLs - no humans, high quality)
const SPECIES_FALLBACK_IMAGES = {
  dog: [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    'https://images.unsplash.com/photo-1561037404-0cd2b8f925bc?w=800&q=80'
  ],
  cat: [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80',
    'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80'
  ],
  bird: [
    'https://images.unsplash.com/photo-1552728089-57bdde30beb9?w=800&q=80',
    'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&q=80',
    'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80'
  ],
  rabbit: [
    'https://images.unsplash.com/photo-1585110396067-7f0a06d0f6dc?w=800&q=80',
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80'
  ],
  hamster: [
    'https://images.unsplash.com/photo-1544923246-77307dd628b4?w=800&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&q=80'
  ]
};

const DEFAULT_FALLBACK_IMAGES = SPECIES_FALLBACK_IMAGES.dog;

const getFallbackImages = (species) => {
  return SPECIES_FALLBACK_IMAGES[species] || DEFAULT_FALLBACK_IMAGES;
};

export const petService = {
  async getAll(filters = {}) {
    const response = await api.get('/pets', { params: filters });
    const pets = response.data;

    // Process pets to ensure they have image field and fallback images
    return pets.map((pet) => {
      const species = (pet.species || 'dog').toLowerCase();
      const backendImages = pet.images && pet.images.length > 0 ? pet.images : [];
      const fallbackImages = getFallbackImages(species);
      const images = backendImages.length > 0 ? backendImages : fallbackImages;
      
      return {
        ...pet,
        image: images[0],
        images: images
      };
    });
  },

  async getById(id) {
    const response = await api.get('/pets/' + id);
    const pet = response.data;
    
    const species = (pet.species || 'dog').toLowerCase();
    const backendImages = pet.images && pet.images.length > 0 ? pet.images : [];
    const fallbackImages = getFallbackImages(species);
    const images = backendImages.length > 0 ? backendImages : fallbackImages;
    
    return {
      ...pet,
      image: images[0],
      images: images
    };
  },

  async create(pet) {
    const config = {};
    if (pet instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await api.post('/pets', pet, config);
    const newPet = response.data;
    
    const species = (newPet.species || 'dog').toLowerCase();
    const backendImages = newPet.images && newPet.images.length > 0 ? newPet.images : [];
    const fallbackImages = getFallbackImages(species);
    const images = backendImages.length > 0 ? backendImages : fallbackImages;
    
    return {
      ...newPet,
      image: images[0],
      images: images
    };
  },

  async update(id, updates) {
    const config = {};
    if (updates instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    const response = await api.put('/pets/' + id, updates, config);
    const updated = response.data;
    
    const species = (updated.species || 'dog').toLowerCase();
    const backendImages = updated.images && updated.images.length > 0 ? updated.images : [];
    const fallbackImages = getFallbackImages(species);
    const images = backendImages.length > 0 ? backendImages : fallbackImages;
    
    return {
      ...updated,
      image: images[0],
      images: images
    };
  },

  async delete(id) {
    const response = await api.delete('/pets/' + id);
    return response.data;
  },

  async updateStatus(id, status) {
    const response = await api.put('/pets/' + id + '/status', { status });
    const updated = response.data;
    
    const species = (updated.species || 'dog').toLowerCase();
    const backendImages = updated.images && updated.images.length > 0 ? updated.images : [];
    const fallbackImages = getFallbackImages(species);
    const images = backendImages.length > 0 ? backendImages : fallbackImages;
    
    return {
      ...updated,
      image: images[0],
      images: images
    };
  }
};

export default petService;
