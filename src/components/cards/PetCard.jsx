import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiHeart, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Badge from '@/components/common/Badge';
import { formatCurrency, capitalize } from '@/utils/formatters';
import { getPetImageErrorFallback } from '@/mock/petPrimaryImages';

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

const STATUS_LABELS = {
  available: 'Available',
  pending: 'Pending',
  adopted: 'Adopted',
};

export default function PetCard({ pet }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!pet) return null;
  
  // Get species-specific fallback images
  const species = (pet.species || 'dog').toLowerCase();
  const fallbackImages = SPECIES_FALLBACK_IMAGES[species] || DEFAULT_FALLBACK_IMAGES;
  
  // Use backend images if available, otherwise use fallback
  const backendImages = pet.images && pet.images.length > 0 ? pet.images : [];
  const images = backendImages.length > 0 ? backendImages : fallbackImages;
  
  const src = images[currentImageIndex] || fallbackImages[0];
  const location = pet.location || pet.shelterName;
  const adoptionLabel = STATUS_LABELS[pet.status] || capitalize(pet.status || '');

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (e) => {
    const fallback = getPetImageErrorFallback(pet, e.currentTarget.src);
    if (fallback) {
      e.currentTarget.src = fallback;
    }
    e.currentTarget.onerror = null;
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 group">
        <Link to={`/pets/${pet.id}`} className="block w-full h-full">
          <img
            src={src}
            alt={`${pet.name}, ${pet.breed}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={handleImageError}
          />
        </Link>
        {pet.featured && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-500 text-white shadow pointer-events-none">
            Featured
          </span>
        )}
        <button
          type="button"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-slate-500 hover:text-red-500 shadow-sm z-10"
          onClick={(e) => e.preventDefault()}
          aria-label="Save to favorites"
        >
          <FiHeart size={18} />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:text-primary-600 shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:text-primary-600 shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <FiChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/pets/${pet.id}`}>
              <h3 className="text-lg font-bold text-slate-800 hover:text-primary-600 transition">{pet.name}</h3>
            </Link>
            <p className="text-sm text-slate-500 mt-0.5">{pet.breed}</p>
          </div>
          <Badge variant={pet.healthStatus === 'excellent' ? 'success' : pet.healthStatus === 'fair' ? 'warning' : 'default'}>
            {capitalize(pet.healthStatus?.replace('_', ' ') || '')}
          </Badge>
        </div>

        <p className="text-sm text-slate-600 mt-3 line-clamp-2 flex-1">{pet.description}</p>

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <li>
            <span className="font-medium text-slate-600">Age:</span> {pet.age} yr{pet.age !== 1 ? 's' : ''}
          </li>
          <li className="capitalize">
            <span className="font-medium text-slate-600">Gender:</span> {pet.gender}
          </li>
          <li>
            <span className="font-medium text-slate-600">Vaccines:</span>{' '}
            {pet.vaccinated ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-700">
                <FiCheck size={12} aria-hidden /> Up to date
              </span>
            ) : (
              'Pending'
            )}
          </li>
          <li>
            <span className="font-medium text-slate-600">Status:</span>{' '}
            <span className={pet.status === 'available' ? 'text-emerald-700 font-medium' : ''}>{adoptionLabel}</span>
          </li>
          <li>
            <span className="font-medium text-slate-600">Fee:</span>{' '}
            <span className="text-primary-700 font-semibold">{formatCurrency(pet.adoptionFee)}</span>
          </li>
        </ul>

        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
          <FiMapPin className="text-primary-500 shrink-0" size={14} />
          <span className="truncate">{location || 'Happy Paws Shelter'}</span>
        </p>

        <Link
          to={`/pets/${pet.id}`}
          className="mt-4 block text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2.5 rounded-xl transition"
        >
          {pet.status === 'available' ? 'Adopt Now' : 'View Details'}
        </Link>
      </div>
    </motion.article>
  );
}
