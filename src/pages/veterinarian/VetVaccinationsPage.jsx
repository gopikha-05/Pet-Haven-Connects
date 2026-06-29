import { useState, useEffect } from 'react';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { petService } from '@/services/petService';
import { useToast } from '@/context/ToastContext';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const PER_PAGE = 10;

export default function VetVaccinationsPage() {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPets, setExpandedPets] = useState({});
  const { toast } = useToast();
  const { paginated, page, totalPages, goToPage } = usePagination(vaccines, PER_PAGE);

  const fetchVaccinations = async () => {
    try {
      setLoading(true);
      const response = await petService.getAll();
      const pets = Array.isArray(response) ? response : (response?.data || []);

      // Clear old vaccinationRecords localStorage to use only medical records
      localStorage.removeItem('vaccinationRecords');

      // Get medical records from localStorage
      const medicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');

      // Group vaccinations by pet from medical records
      const petsWithVaccinations = pets.map(pet => {
        // Find all medical records for this pet
        const petMedicalRecords = medicalRecords.filter(r => r.petName === pet.name);
        
        const vaccinationList = [];
        
        // Add past vaccinations from medical records
        petMedicalRecords.forEach(record => {
          if (record.vaccination) {
            vaccinationList.push({
              vaccine: record.vaccination,
              due: record.nextVisit || 'Not scheduled',
              status: 'completed',
              administeredDate: record.visitDate,
              vetName: record.vetName,
              medicalRecordId: record.id,
              type: 'past'
            });
          }
        });
        
        // Add scheduled vaccinations from pet data
        if (pet.vaccinations && pet.vaccinations.length > 0) {
          pet.vaccinations.forEach(vaccination => {
            // Check if this vaccination was already administered
            const alreadyAdministered = vaccinationList.find(v => v.vaccine === vaccination.name);
            if (!alreadyAdministered) {
              vaccinationList.push({
                vaccine: vaccination.name,
                due: vaccination.nextDue,
                status: 'scheduled',
                administeredDate: null,
                vetName: null,
                medicalRecordId: null,
                type: 'scheduled'
              });
            }
          });
        }

        return {
          petId: pet.id,
          petName: pet.name,
          breed: pet.breed,
          vaccinations: vaccinationList,
          totalVaccines: vaccinationList.length,
          completedVaccines: vaccinationList.filter(v => v.status === 'completed').length
        };
      });

      setVaccines(petsWithVaccinations);
    } catch (error) {
      console.error('Failed to fetch vaccinations:', error);
      toast('Failed to load vaccination records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinations();
  }, []);

  const toggleExpand = (petId) => {
    setExpandedPets(prev => ({
      ...prev,
      [petId]: !prev[petId]
    }));
  };

  const filteredVaccines = vaccines.filter(v =>
    v.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { paginated: filteredPaginated, page: filteredPage, totalPages: filteredTotalPages, goToPage: filteredGoToPage } = usePagination(filteredVaccines, PER_PAGE);

  if (loading) {
    return <div className="text-center py-8">Loading vaccination records...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vaccination Tracking</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by pet name or breed..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md border rounded-lg px-4 py-2"
        />
      </div>

      <div className="space-y-4">
        {(searchTerm ? filteredPaginated : paginated).map((pet) => (
          <div key={pet.petId} className="bg-white rounded-2xl border">
            <div 
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"
              onClick={() => toggleExpand(pet.petId)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{pet.petName}</h3>
                  <p className="text-sm text-slate-500">{pet.breed}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {pet.completedVaccines}/{pet.totalVaccines} Vaccines
                  </span>
                  {pet.completedVaccines === pet.totalVaccines && pet.totalVaccines > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      All Completed
                    </span>
                  )}
                </div>
              </div>
              {expandedPets[pet.petId] ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
            </div>
            
            {expandedPets[pet.petId] && (
              <div className="p-4 border-t bg-slate-50">
                <h4 className="font-medium mb-3">Vaccination Details</h4>
                {pet.vaccinations.length > 0 ? (
                  <div className="space-y-2">
                    {pet.vaccinations.map((v, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${v.type === 'past' ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{v.vaccine}</p>
                            <p className="text-xs text-slate-500 mt-1">Due: {v.due}</p>
                            {v.administeredDate && (
                              <p className="text-xs text-slate-500">Administered: {v.administeredDate}</p>
                            )}
                            {v.vetName && (
                              <p className="text-xs text-slate-500">By: {v.vetName}</p>
                            )}
                            {v.medicalRecordId && (
                              <p className="text-xs text-blue-600 mt-1">Medical Record ID: {v.medicalRecordId}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            v.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {v.status === 'completed' ? 'Completed' : 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No vaccinations scheduled or administered</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(searchTerm ? filteredVaccines : vaccines).length > 0 && (
        <Pagination 
          page={searchTerm ? filteredPage : page} 
          totalPages={searchTerm ? filteredTotalPages : totalPages} 
          onPageChange={searchTerm ? filteredGoToPage : goToPage} 
        />
      )}
    </div>
  );
}
