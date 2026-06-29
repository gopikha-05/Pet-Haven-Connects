import { useState } from 'react';
import AdoptionChart from '@/components/charts/AdoptionChart';
import BreedChart from '@/components/charts/BreedChart';
import RegionalHeatmap from '@/components/charts/RegionalHeatmap';
import { adoptionTrendsByYear, breedAdoptionsBySpecies, regionalDemand } from '@/mock/analytics';
import Select from '@/components/forms/Select';

export default function ShelterAnalyticsPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedSpecies, setSelectedSpecies] = useState('dog');
  const years = Object.keys(adoptionTrendsByYear).map(Number);
  const speciesOptions = ['dog', 'cat', 'bird', 'other'];

  const handleYearChange = (e) => {
    setSelectedYear(Number(e.target.value));
  };

  const handleSpeciesChange = (e) => {
    setSelectedSpecies(e.target.value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shelter Analytics</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Adoption Performance - {selectedYear}</h2>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={years.map(year => ({ value: year, label: year.toString() }))}
              className="w-24"
            />
          </div>
          <AdoptionChart data={adoptionTrendsByYear[selectedYear]} />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Popular Breeds - {selectedSpecies}</h2>
            <Select
              value={selectedSpecies}
              onChange={handleSpeciesChange}
              options={speciesOptions.map(species => ({ value: species, label: species.charAt(0).toUpperCase() + species.slice(1) }))}
              className="w-24"
            />
          </div>
          <BreedChart data={breedAdoptionsBySpecies[selectedSpecies]} />
        </div>
        <div className="bg-white rounded-2xl border p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Regional Demand Heatmap</h2>
          <RegionalHeatmap data={regionalDemand} />
        </div>
      </div>
    </div>
  );
}
