import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { petService } from '@/services/petService';
import { applicationService } from '@/services/applicationService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import Select from '@/components/forms/Select';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { FiMapPin, FiCheck, FiHeart } from 'react-icons/fi';
import { formatCurrency, capitalize } from '@/utils/formatters';
import { getPetImageErrorFallback } from '@/mock/petPrimaryImages';

export default function AdoptionApplicationPage() {
  const { petId } = useParams();
  const { data: pet } = useFetch(() => petService.getById(petId), [petId]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    // Personal Details
    fullName: user?.name || '',
    age: '',
    phone: '',
    email: user?.email || '',
    address: '',
    occupation: '',
    // Suitability Details
    previousPetExperience: '',
    experienceExplanation: '',
    reason: '',
    homeType: 'apartment',
    hasYard: false,
    existingPets: '',
    familyMemberCount: '',
    dailyAvailability: '',
    financialReadiness: '',
    vetReference: '',
    // Upload
    homeImage: null
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await applicationService.create({
        petId,
        notes: form.reason,
        ...form
      });
      
      toast('Application submitted!', 'success');
      navigate('/adopter/applications');
    } catch (err) {
      console.error('Application submission error:', err);
      toast(err.response?.data?.message || 'Failed to submit application', 'error');
    } finally {
      setLoading(false);
    }
  };

  const petData = pet;

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Adoption Application</h1>
        <p className="text-slate-500 mb-6">Complete the form below to apply for pet adoption</p>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Adoption Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-6 shadow-card transition-smooth hover:shadow-card-hover">
              {/* Personal Details Section */}
              <div>
                <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200">Personal Details</h2>
                <div className="space-y-4">
                  <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                  <Input label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
                  <Input label="Phone Number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                  <Input label="Occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} required />
                </div>
              </div>

            {/* Suitability Details Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Suitability Details</h2>
              <div className="space-y-4">
                <Select 
                  label="Previous Pet Experience" 
                  value={form.previousPetExperience} 
                  onChange={(e) => setForm({ ...form, previousPetExperience: e.target.value })} 
                  options={[
                    { value: '', label: 'Select experience level' },
                    { value: 'none', label: 'No previous experience' },
                    { value: 'some', label: 'Some experience' },
                    { value: 'experienced', label: 'Very experienced' }
                  ]}
                  required 
                />
                <Textarea 
                  label="Experience Explanation" 
                  value={form.experienceExplanation} 
                  onChange={(e) => setForm({ ...form, experienceExplanation: e.target.value })} 
                  rows={3} 
                  placeholder="Please describe your previous pet ownership experience"
                  required 
                />
                <Textarea 
                  label="Why do you want to adopt this pet?" 
                  value={form.reason} 
                  onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                  rows={3} 
                  placeholder="Tell us why you would like to adopt this pet and how you plan to care for it."
                  required 
                />
                <Select 
                  label="Home Type" 
                  value={form.homeType} 
                  onChange={(e) => setForm({ ...form, homeType: e.target.value })} 
                  options={[
                    { value: 'apartment', label: 'Apartment' },
                    { value: 'house', label: 'House' },
                    { value: 'condo', label: 'Condo' },
                    { value: 'townhouse', label: 'Townhouse' }
                  ]}
                  required 
                />
                <Select 
                  label="Do you have a yard?" 
                  value={String(form.hasYard)} 
                  onChange={(e) => setForm({ ...form, hasYard: e.target.value })} 
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' }
                  ]}
                  required 
                />
                <Input 
                  label="Existing Pets (if any)" 
                  value={form.existingPets} 
                  onChange={(e) => setForm({ ...form, existingPets: e.target.value })} 
                  placeholder="Describe any current pets you have"
                />
                <Input 
                  label="Family Member Count" 
                  type="number" 
                  value={form.familyMemberCount} 
                  onChange={(e) => setForm({ ...form, familyMemberCount: e.target.value })} 
                  required 
                />
                <Select 
                  label="Daily Availability for Pet Care" 
                  value={form.dailyAvailability} 
                  onChange={(e) => setForm({ ...form, dailyAvailability: e.target.value })} 
                  options={[
                    { value: '', label: 'Select availability' },
                    { value: '1-2', label: '1-2 hours per day' },
                    { value: '3-4', label: '3-4 hours per day' },
                    { value: '5+', label: '5+ hours per day' },
                    { value: 'fulltime', label: 'Full-time at home' }
                  ]}
                  required 
                />
                <Select 
                  label="Financial Readiness" 
                  value={form.financialReadiness} 
                  onChange={(e) => setForm({ ...form, financialReadiness: e.target.value })} 
                  options={[
                    { value: '', label: 'Select financial readiness' },
                    { value: 'low', label: 'Limited budget' },
                    { value: 'moderate', label: 'Moderate budget' },
                    { value: 'high', label: 'Well prepared for pet expenses' }
                  ]}
                  required 
                />
                <Input 
                  label="Veterinarian Reference (if any)" 
                  value={form.vetReference} 
                  onChange={(e) => setForm({ ...form, vetReference: e.target.value })} 
                  placeholder="Name and contact of your current or previous vet"
                />
              </div>
            </div>

            {/* Upload Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Home Image Upload</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Upload Home Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, homeImage: e.target.files[0] ? e.target.files[0].name : '' })}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">Please upload a photo of your home environment</p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>Submit Application</Button>
          </form>
        </div>

        {/* Right: Pet Summary Card */}
        <div className="lg:col-span-1">
          {petData && (
            <div className="bg-white rounded-2xl border overflow-hidden sticky top-8">
              {/* Pet Image */}
              <div className="aspect-square bg-slate-100">
                {petData.images && petData.images.length > 0 ? (
                  <img
                    src={petData.images[0]}
                    alt={petData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const fallback = getPetImageErrorFallback(petData, e.currentTarget.src);
                      if (fallback) e.currentTarget.src = fallback;
                      else e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    No image available
                  </div>
                )}
              </div>

              {/* Pet Details */}
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{petData.name}</h2>
                    <p className="text-slate-500">{petData.breed}</p>
                  </div>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition"
                  >
                    <FiHeart size={18} />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={petData.status === 'available' ? 'success' : petData.status === 'adopted' ? 'default' : 'warning'}>
                    {capitalize(petData.status)}
                  </Badge>
                  <Badge variant={petData.healthStatus === 'excellent' ? 'success' : petData.healthStatus === 'good' ? 'default' : 'warning'}>
                    {capitalize(petData.healthStatus)}
                  </Badge>
                  {petData.vaccinated && (
                    <Badge variant="success">Vaccinated</Badge>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Species</p>
                    <p className="font-semibold text-slate-800 capitalize">{petData.species}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Age</p>
                    <p className="font-semibold text-slate-800">{petData.age} {petData.age === 1 ? 'year' : 'years'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Gender</p>
                    <p className="font-semibold text-slate-800 capitalize">{petData.gender}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Vaccinated</p>
                    <p className="font-semibold text-slate-800">{petData.vaccinated ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {/* Personality */}
                {petData.temperament && petData.temperament.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm">Personality</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {petData.temperament.map((t) => (
                        <span key={t} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                          {capitalize(t)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-sm">About</h3>
                  <p className="text-sm text-slate-600 line-clamp-3">{petData.description}</p>
                </div>

                {/* Shelter Info */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FiMapPin className="text-primary-500 mt-0.5" size={16} />
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{petData.shelterName}</p>
                      <p className="text-xs text-slate-500">{petData.location || petData.shelterName}</p>
                    </div>
                  </div>
                </div>

                {/* Adoption Fee */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Adoption Fee</p>
                  <p className="text-2xl font-bold text-primary-700">{formatCurrency(petData.adoptionFee)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
