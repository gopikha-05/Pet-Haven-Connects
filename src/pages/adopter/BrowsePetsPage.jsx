import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import PetCard from '@/components/cards/PetCard';
import SearchBar from '@/components/common/SearchBar';
import FilterDrawer from '@/components/modals/FilterDrawer';
import Select from '@/components/forms/Select';
import Pagination from '@/components/common/Pagination';
import { CardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { petService } from '@/services/petService';
import { dataService } from '@/services/dataService';
import { speciesOptions, temperamentOptions, breedOptions } from '@/mock/pets';
import { PET_HEALTH_STATUS } from '@/constants/status';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/common/Button';

const PER_PAGE = 10;
const MAX_PAGES = 4;

export default function BrowsePetsPage() {
  const [searchParams] = useSearchParams();
  const initialShelter = searchParams.get('shelter') || '';
  const [pets, setPets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    species: '',
    breed: '',
    temperament: '',
    healthStatus: '',
    ageMin: '',
    ageMax: '',
    shelter: initialShelter,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { paginated, page, totalPages, goToPage } = usePagination(pets || [], PER_PAGE, MAX_PAGES);

  const fetchShelters = async () => {
    try {
      const response = await dataService.getShelters();
      const sheltersData = Array.isArray(response) ? response : (response?.data || []);
      
      // Filter active and approved/verified shelters (supporting both mock & real DB)
      const activeShelters = sheltersData
        .filter(s => (s.status === 'active' || s.isActive !== false) && (s.verified || s.isApproved || s.licenseVerified))
        .map(s => ({
          ...s,
          id: s._id || s.id,
          name: s.name,
          city: s.city || s.location || 'Mumbai'
        }));
      
      setShelters(activeShelters);
    } catch (error) {
      console.error('Failed to fetch shelters:', error);
    }
  };

  const fetchPets = async () => {
    setLoading(true);
    try {
      const response = await petService.getAll({
        ...filters,
        search: debouncedSearch,
        status: 'available',
      });
      const petsData = Array.isArray(response) ? response : (response?.data || []);
      setPets(petsData);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  useEffect(() => {
    fetchPets();
  }, [debouncedSearch, filters]);

  const suggestedPets = useMemo(() => {
    if (!pets || pets.length === 0) return [];
    if (filters.shelter) {
      return pets.slice(0, 4);
    } else {
      // Return 4 randomized pets
      return [...pets].sort(() => 0.5 - Math.random()).slice(0, 4);
    }
  }, [pets, filters.shelter]);

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-primary-50/80 to-white p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Find your companion</h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Each listing uses its own photo and profile. Filter by species, temperament, and health to narrow your search,
          then open a profile for vaccinations, shelter notes, and adoption steps.
        </p>
        {!loading && (
          <p className="mt-4 text-sm font-medium text-primary-800">
            {(pets || []).length} adoptable {(pets || []).length === 1 ? 'pet' : 'pets'} match your criteria
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or breed..."
          className="w-full sm:max-w-md"
        />
        <Button variant="outline" icon={FiFilter} onClick={() => setDrawerOpen(true)} className="shrink-0">
          Filters
        </Button>
      </div>

      {/* Pet Suggestions Section */}
      {suggestedPets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {filters.shelter ? `Pets from ${shelters.find(s => s.id === filters.shelter)?.name || 'Selected Shelter'}` : 'Pet Suggestions from Available Shelters'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedPets.map((p) => (
              <PetCard key={p.id} pet={p} />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold text-slate-900 mb-4">All Available Pets</h2>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : paginated.length ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((p) => (
              <PetCard key={p.id} pet={p} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      ) : (
        <EmptyState title="No pets found" description="Try adjusting your filters or search terms." />
      )}

      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReset={() =>
          setFilters({
            species: '',
            breed: '',
            temperament: '',
            healthStatus: '',
            ageMin: '',
            ageMax: '',
            shelter: '',
          })
        }
        onApply={() => {}}
      >
        <Select
          label="Shelter"
          value={filters.shelter}
          onChange={(e) => setFilters((f) => ({ ...f, shelter: e.target.value }))}
          placeholder={shelters.length === 0 ? "No shelters available" : "Any Shelter"}
          options={shelters.map(s => ({ value: s.id, label: `${s.name} (${s.city})` }))}
          disabled={shelters.length === 0}
        />
        <Select
          label="Species"
          value={filters.species}
          onChange={(e) => setFilters((f) => ({ ...f, species: e.target.value, breed: '' }))}
          placeholder="Any"
          options={speciesOptions}
        />
        <Select
          label="Breed"
          value={filters.breed}
          onChange={(e) => setFilters((f) => ({ ...f, breed: e.target.value }))}
          placeholder="Any"
          options={filters.species ? breedOptions[filters.species] || [] : []}
        />
        <Select
          label="Temperament"
          value={filters.temperament}
          onChange={(e) => setFilters((f) => ({ ...f, temperament: e.target.value }))}
          placeholder="Any"
          options={temperamentOptions}
        />
        <Select
          label="Health"
          value={filters.healthStatus}
          onChange={(e) => setFilters((f) => ({ ...f, healthStatus: e.target.value }))}
          placeholder="Any"
          options={PET_HEALTH_STATUS}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Min age"
            value={filters.ageMin}
            onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value }))}
            placeholder="Any"
            options={['0', '1', '2', '3', '5']}
          />
          <Select
            label="Max age"
            value={filters.ageMax}
            onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value }))}
            placeholder="Any"
            options={['2', '5', '10', '15']}
          />
        </div>
      </FilterDrawer>
      </div>
    </div>
  );
}
