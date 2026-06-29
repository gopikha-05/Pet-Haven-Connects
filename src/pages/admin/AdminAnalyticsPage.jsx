import { useState } from 'react';
import AdoptionChart from '@/components/charts/AdoptionChart';
import BreedChart from '@/components/charts/BreedChart';
import DonationChart from '@/components/charts/DonationChart';
import HealthTrendChart from '@/components/charts/HealthTrendChart';
import RegionalHeatmap from '@/components/charts/RegionalHeatmap';
import Select from '@/components/forms/Select';
import { useFetch } from '@/hooks/useFetch';
import { dataService } from '@/services/dataService';
import { adoptionTrendsByYear, breedAdoptionsBySpecies, monthlyDonationsByYear, healthTrendsByYear, regionalDemand, visitorEngagementByYear } from '@/mock/analytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalyticsPage() {
  const { data: analytics, loading } = useFetch(() => dataService.getAnalytics());
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
      <h1 className="text-2xl font-bold mb-6">Platform Analytics</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Adoption Patterns - {selectedYear}</h2>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={years.map(year => ({ value: year, label: year.toString() }))}
              className="w-24"
            />
          </div>
          <AdoptionChart data={analytics?.adoptionTrends ? analytics.adoptionTrends : adoptionTrendsByYear[selectedYear]} />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Most Adopted Breeds - {selectedSpecies}</h2>
            <Select
              value={selectedSpecies}
              onChange={handleSpeciesChange}
              options={speciesOptions.map(species => ({ value: species, label: species.charAt(0).toUpperCase() + species.slice(1) }))}
              className="w-24"
            />
          </div>
          <BreedChart data={analytics?.breedAdoptions ? analytics.breedAdoptions : breedAdoptionsBySpecies[selectedSpecies]} />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Monthly Donations - {selectedYear}</h2>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={years.map(year => ({ value: year, label: year.toString() }))}
              className="w-24"
            />
          </div>
          <DonationChart data={analytics?.monthlyDonations ? analytics.monthlyDonations : monthlyDonationsByYear[selectedYear]} />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Health Trends - {selectedYear}</h2>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={years.map(year => ({ value: year, label: year.toString() }))}
              className="w-24"
            />
          </div>
          <HealthTrendChart data={analytics?.healthTrends ? analytics.healthTrends : healthTrendsByYear[selectedYear]} />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Visitor Engagement - {selectedYear}</h2>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={years.map(year => ({ value: year, label: year.toString() }))}
              className="w-24"
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics?.visitorEngagement ? analytics.visitorEngagement : visitorEngagementByYear[selectedYear]}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visitors" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Regional Demand</h2>
          <RegionalHeatmap data={analytics?.regionalDemand ? analytics.regionalDemand : regionalDemand} />
        </div>
      </div>
    </div>
  );
}
