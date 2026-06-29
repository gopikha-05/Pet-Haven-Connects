import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '@/services/dataService';
import { petService } from '@/services/petService';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { FiUsers, FiMapPin, FiMail, FiPhone, FiCalendar, FiHeart } from 'react-icons/fi';
import { PiPawPrint } from 'react-icons/pi';

export default function ReachOutPage() {
  const [activeTab, setActiveTab] = useState('shelters');
  const [shelters, setShelters] = useState([]);
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch shelters
        const sheltersRes = await dataService.getShelters();
        const sheltersList = (Array.isArray(sheltersRes) ? sheltersRes : (sheltersRes?.data || []))
          .filter(s => (s.status === 'active' || s.isActive !== false) && (s.verified || s.isApproved || s.licenseVerified))
          .map(s => ({
            ...s,
            id: s._id || s.id,
            city: s.city || s.location || 'Mumbai'
          }));

        // Fetch veterinarians
        const vetsRes = await dataService.getVeterinarians();
        const vetsList = (Array.isArray(vetsRes) ? vetsRes : (vetsRes?.data || []))
          .filter(v => v.isApproved !== false)
          .map(v => ({
            ...v,
            id: v._id || v.id,
            specialization: v.specialization || 'General Veterinarian',
            experience: v.experience || '5+ years',
            clinic: v.clinic || v.location || 'PetHaven Partner Clinic'
          }));

        setShelters(sheltersList);
        setVets(vetsList);
      } catch (error) {
        console.error('Failed to load reach out data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      {/* Background paw print decorations */}
      <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
        <div className="absolute top-12 left-10 text-8xl"><PiPawPrint /></div>
        <div className="absolute top-1/3 right-10 text-7xl"><PiPawPrint /></div>
        <div className="absolute bottom-20 left-1/4 text-8xl"><PiPawPrint /></div>
      </div>

      <div className="mb-8 rounded-3xl border border-rose-100 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FiUsers className="text-amber-500" />
          Reach Out to Partners
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Connect directly with licensed shelters and certified veterinarians in our network. Ask questions, request information, or schedule visits.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-2 mb-8 max-w-md mx-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('shelters')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'shelters'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <FiHeart className="w-4 h-4" />
            Shelters ({shelters.length})
          </button>
          <button
            onClick={() => setActiveTab('vets')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'vets'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <FiCalendar className="w-4 h-4" />
            Veterinarians ({vets.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : activeTab === 'shelters' ? (
        shelters.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelters.map((s) => (
              <div
                key={s.id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-600 font-bold text-xl">
                      🐾
                    </div>
                    <Badge variant="success" className="bg-amber-100 text-amber-800 border-0">
                      Shelter Partner
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 truncate" title={s.name}>
                    {s.name}
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-600 mb-6">
                    <p className="flex items-center gap-2.5">
                      <FiMapPin className="text-amber-500 shrink-0" />
                      <span>{s.city}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <FiMail className="text-rose-500 shrink-0" />
                      <span className="truncate" title={s.email}>{s.email}</span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <FiPhone className="text-orange-500 shrink-0" />
                      <span>{s.phone || 'No phone listed'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                    onClick={() => (window.location.href = `mailto:${s.email}`)}
                  >
                    Email
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-md hover:shadow-lg"
                    onClick={() => navigate(`/adopter/pets?shelter=${s.id}`)}
                  >
                    View Pets
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={FiHeart} title="No Shelters Found" description="There are no active shelter partners registered at this time." />
        )
      ) : vets.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vets.map((v) => (
            <div
              key={v.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-rose-600 font-bold text-xl">
                    🩺
                  </div>
                  <Badge variant="success" className="bg-rose-100 text-rose-800 border-0">
                    Certified Vet
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1 truncate" title={v.name}>
                  {v.name}
                </h3>
                <p className="text-xs font-semibold text-rose-500 mb-4 tracking-wider uppercase">
                  {v.specialization}
                </p>
                <div className="space-y-2.5 text-sm text-slate-600 mb-6">
                  <p className="flex items-center gap-2.5">
                    <FiMapPin className="text-rose-500 shrink-0" />
                    <span className="truncate" title={v.clinic}>{v.clinic}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <FiMail className="text-amber-500 shrink-0" />
                    <span className="truncate" title={v.email}>{v.email}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <FiPhone className="text-orange-500 shrink-0" />
                    <span>{v.phone || 'No phone listed'}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold"
                  onClick={() => (window.location.href = `mailto:${v.email}`)}
                >
                  Email
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-md hover:shadow-lg"
                  onClick={() => navigate(`/adopter/vet-booking?vetId=${v.id}`)}
                >
                  Book Vet
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiCalendar} title="No Veterinarians Found" description="There are no active veterinarian partners registered at this time." />
      )}
    </div>
  );
}
