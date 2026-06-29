import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiCheck, FiCalendar, FiHeart, FiChevronLeft, FiChevronRight, FiHome, FiActivity, FiUsers, FiAward } from 'react-icons/fi';
import { useFetch } from '@/hooks/useFetch';
import { petService } from '@/services/petService';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { CardSkeleton } from '@/components/common/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency, capitalize, formatDate } from '@/utils/formatters';
import { getPetImageErrorFallback } from '@/mock/petPrimaryImages';

export default function PetDetailsPage() {
  const { id } = useParams();
  const { data: pet, loading, error, refetch } = useFetch(() => petService.getById(id), [id]);
  const [imgIdx, setImgIdx] = useState(0);
  const [vaccinationRecords, setVaccinationRecords] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [suggestedPets, setSuggestedPets] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    setVaccinationRecords(records);
  }, []);

  useEffect(() => {
    if (!pet) return;
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const allPets = await petService.getAll();
        // Filter out current pet and match same species
        const filtered = allPets.filter(p => 
          p.id !== pet.id && 
          p.species?.toLowerCase() === pet.species?.toLowerCase()
        );

        // Prioritize different breeds
        const diffBreed = filtered.filter(p => p.breed?.toLowerCase() !== pet.breed?.toLowerCase());
        const sameBreed = filtered.filter(p => p.breed?.toLowerCase() === pet.breed?.toLowerCase());

        // Shuffle helper
        const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

        const prioritized = [...shuffle(diffBreed), ...shuffle(sameBreed)];
        setSuggestedPets(prioritized.slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch suggested pets:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [pet]);

  if (loading) return <motion.div className="max-w-6xl mx-auto px-4 py-8"><CardSkeleton /></motion.div>;
  if (error || !pet) return <ErrorState message={error} onRetry={refetch} />;

  const handleAdoptNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'adopter') {
      navigate('/login');
    } else {
      navigate(`/adopter/apply/${pet.id}`);
    }
  };

  const handlePrevImage = () => {
    setImgIdx((prev) => (prev === 0 ? pet.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setImgIdx((prev) => (prev === pet.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/browse" className="hover:text-primary-600">Browse Pets</Link>
        <span>/</span>
        <span className="text-slate-800">{pet.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden">
            {pet.images && pet.images.length > 0 ? (
              <>
                <motion.img 
                  key={imgIdx} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  src={pet.images[imgIdx]} 
                  alt={pet.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const fallback = getPetImageErrorFallback(pet, e.currentTarget.src);
                    if (fallback) e.currentTarget.src = fallback;
                    else e.currentTarget.onerror = null;
                  }}
                />
                {pet.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:text-primary-600 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-slate-700 hover:text-primary-600 shadow-lg hover:shadow-xl transition-all"
                    >
                      <FiChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {pet.images.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImgIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === imgIdx ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                No images available
              </div>
            )}
          </div>

          {/* Preview Images */}
          {pet.images && pet.images.length > 1 && (
            <div className="flex gap-3">
              {pet.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${pet.name} pose ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const fallback = getPetImageErrorFallback(pet, e.currentTarget.src);
                      if (fallback) e.currentTarget.src = fallback;
                      else e.currentTarget.onerror = null;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Pet Details Card */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={pet.status === 'available' ? 'success' : pet.status === 'adopted' ? 'default' : 'warning'}>
                  {capitalize(pet.status)}
                </Badge>
                <Badge variant={pet.healthStatus === 'excellent' ? 'success' : pet.healthStatus === 'good' ? 'default' : 'warning'}>
                  {capitalize(pet.healthStatus)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-slate-800">{pet.name}</h1>
              <p className="text-slate-500 text-lg">{pet.breed}</p>
            </div>
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition"
            >
              <FiHeart size={20} />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Species</p>
              <p className="font-semibold text-slate-800 capitalize">{pet.species}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Age</p>
              <p className="font-semibold text-slate-800">{pet.age} {pet.age === 1 ? 'year' : 'years'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Gender</p>
              <p className="font-semibold text-slate-800 capitalize">{pet.gender}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Weight</p>
              <p className="font-semibold text-slate-800">-- kg</p>
            </div>
          </div>

          {/* Personality Traits */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Personality</h3>
            <div className="flex flex-wrap gap-2">
              {pet.temperament.map((t) => (
                <span key={t} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  {capitalize(t)}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">About {pet.name}</h3>
            <p className="text-slate-600 leading-relaxed">{pet.description}</p>
          </div>

          {/* Health Info */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Health Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {pet.vaccinated ? (
                  <FiCheck className="text-emerald-500" size={18} />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-slate-600">Vaccinated</span>
              </div>
              <div className="flex items-center gap-2">
                {pet.neutered ? (
                  <FiCheck className="text-emerald-500" size={18} />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-slate-600">Sterilized</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheck className="text-emerald-500" size={18} />
                <span className="text-slate-600">Vet Checked</span>
              </div>
            </div>
          </div>

          {/* Good With */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Good With</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <FiUsers className="text-primary-500" size={18} />
                <span className="text-slate-600">Children</span>
              </div>
              <div className="flex items-center gap-2">
                <FiHeart className="text-primary-500" size={18} />
                <span className="text-slate-600">Other Pets</span>
              </div>
            </div>
          </div>

          {/* Adoption Fee */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Adoption Fee</p>
                <p className="text-3xl font-bold text-primary-700">{formatCurrency(pet.adoptionFee)}</p>
              </div>
              {pet.status === 'available' && (
                <Button size="lg" onClick={handleAdoptNow}>
                  Adopt Now
                </Button>
              )}
            </div>
          </div>

          {/* Shelter Info */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <FiHome className="text-primary-600" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{pet.shelterName}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <FiMapPin size={14} />
                  {pet.location || pet.shelterName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid md:grid-cols-2 gap-6 mt-12">
        {/* Vaccination History */}
        <section className="bg-white p-6 rounded-2xl border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FiAward className="text-primary-500" />
            Vaccination History
          </h2>
          {pet.vaccinations?.length ? (
            <div className="space-y-2">
              {pet.vaccinations.map((v) => {
                const record = vaccinationRecords.find(r => r.petName === pet.name && r.vaccination === v.name);
                return (
                  <div key={v.name} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{v.name}</span>
                      {record && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                          Administered
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500">Next: {record?.nextVisit || formatDate(v.nextDue)}</span>
                  </div>
                );
              })}
              {vaccinationRecords.filter(r => r.petName === pet.name && r.vaccination).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-medium text-sm mb-2">Recent Vaccinations Administered</h3>
                  {vaccinationRecords
                    .filter(r => r.petName === pet.name && r.vaccination)
                    .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
                    .map((record) => (
                      <div key={record.id} className="p-2 bg-slate-50 rounded-lg text-sm mb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{record.vaccination}</span>
                          <span className="text-xs text-slate-500">{formatDate(record.visitDate)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">By: {record.vetName}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No vaccination records yet</p>
          )}
        </section>

        {/* Shelter Notes */}
        <section className="bg-white p-6 rounded-2xl border">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FiActivity className="text-primary-500" />
            Shelter Notes
          </h2>
          <p className="text-slate-600 text-sm">{pet.shelterNotes}</p>
          <h3 className="font-medium mt-4 mb-2 flex items-center gap-2">
            <FiCalendar />
            Care Reminders
          </h3>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>• Annual checkup recommended</li>
            <li>• Daily exercise based on temperament</li>
            <li>• Regular grooming required</li>
          </ul>
        </section>
      </div>

      {/* Suggested Pets */}
      <div className="mt-16 border-t border-slate-200 pt-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Suggested Companions</h2>
        {loadingSuggestions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-80" />
            ))}
          </div>
        ) : suggestedPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedPets.map((suggested) => (
              <Link 
                key={suggested.id} 
                to={`/pet/${suggested.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition duration-200"
              >
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <img 
                    src={suggested.image} 
                    alt={suggested.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      const fallback = getPetImageErrorFallback(suggested, e.currentTarget.src);
                      if (fallback) e.currentTarget.src = fallback;
                      else e.currentTarget.onerror = null;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 truncate group-hover:text-primary-600 transition">
                    {suggested.name}
                  </h3>
                  <p className="text-sm text-slate-500 truncate mt-0.5">{suggested.breed}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full capitalize">
                      {suggested.gender}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(suggested.adoptionFee)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No suggested pets found at this time.</p>
        )}
      </div>
      </div>
    </div>
  );
}
