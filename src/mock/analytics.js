export const adoptionTrendsByYear = {
  2025: [
    { month: 'Jan', adoptions: 48, applications: 135 },
    { month: 'Feb', adoptions: 45, applications: 128 },
    { month: 'Mar', adoptions: 62, applications: 158 },
    { month: 'Apr', adoptions: 55, applications: 145 },
    { month: 'May', adoptions: 70, applications: 175 },
    { month: 'Jun', adoptions: 65, applications: 168 },
  ],
  2024: [
    { month: 'Jan', adoptions: 42, applications: 120 },
    { month: 'Feb', adoptions: 38, applications: 105 },
    { month: 'Mar', adoptions: 55, applications: 140 },
    { month: 'Apr', adoptions: 48, applications: 128 },
    { month: 'May', adoptions: 62, applications: 155 },
    { month: 'Jun', adoptions: 58, applications: 148 },
  ],
  2023: [
    { month: 'Jan', adoptions: 35, applications: 110 },
    { month: 'Feb', adoptions: 32, applications: 98 },
    { month: 'Mar', adoptions: 45, applications: 125 },
    { month: 'Apr', adoptions: 40, applications: 115 },
    { month: 'May', adoptions: 52, applications: 138 },
    { month: 'Jun', adoptions: 48, applications: 130 },
  ],
  2022: [
    { month: 'Jan', adoptions: 28, applications: 95 },
    { month: 'Feb', adoptions: 25, applications: 88 },
    { month: 'Mar', adoptions: 38, applications: 110 },
    { month: 'Apr', adoptions: 32, applications: 102 },
    { month: 'May', adoptions: 42, applications: 125 },
    { month: 'Jun', adoptions: 38, applications: 118 },
  ],
};

export const adoptionTrends = adoptionTrendsByYear[2025];

export const breedAdoptionsBySpecies = {
  dog: [
    { breed: 'Labrador', count: 48 },
    { breed: 'Golden Retriever', count: 42 },
    { breed: 'German Shepherd', count: 35 },
    { breed: 'Beagle', count: 28 },
    { breed: 'Pug', count: 22 },
  ],
  cat: [
    { breed: 'British Shorthair', count: 38 },
    { breed: 'Domestic Shorthair', count: 55 },
    { breed: 'Persian', count: 32 },
    { breed: 'Siamese', count: 28 },
    { breed: 'Maine Coon', count: 24 },
  ],
  bird: [
    { breed: 'Budgerigar', count: 42 },
    { breed: 'Cockatiel', count: 35 },
    { breed: 'Lovebird', count: 28 },
    { breed: 'Parakeet', count: 32 },
    { breed: 'Canary', count: 18 },
  ],
  other: [
    { breed: 'Hamster', count: 25 },
    { breed: 'Guinea Pig', count: 22 },
    { breed: 'Rabbit', count: 18 },
    { breed: 'Turtle', count: 15 },
    { breed: 'Fish', count: 38 },
  ],
};

export const breedAdoptions = breedAdoptionsBySpecies.dog;

export const monthlyDonationsByYear = {
  2025: [
    { month: 'Jan', amount: 125000 },
    { month: 'Feb', amount: 98000 },
    { month: 'Mar', amount: 156000 },
    { month: 'Apr', amount: 142000 },
    { month: 'May', amount: 178000 },
    { month: 'Jun', amount: 165000 },
  ],
  2024: [
    { month: 'Jan', amount: 115000 },
    { month: 'Feb', amount: 88000 },
    { month: 'Mar', amount: 145000 },
    { month: 'Apr', amount: 132000 },
    { month: 'May', amount: 165000 },
    { month: 'Jun', amount: 152000 },
  ],
  2023: [
    { month: 'Jan', amount: 95000 },
    { month: 'Feb', amount: 78000 },
    { month: 'Mar', amount: 125000 },
    { month: 'Apr', amount: 118000 },
    { month: 'May', amount: 145000 },
    { month: 'Jun', amount: 138000 },
  ],
  2022: [
    { month: 'Jan', amount: 75000 },
    { month: 'Feb', amount: 68000 },
    { month: 'Mar', amount: 105000 },
    { month: 'Apr', amount: 98000 },
    { month: 'May', amount: 125000 },
    { month: 'Jun', amount: 118000 },
  ],
};

export const monthlyDonations = monthlyDonationsByYear[2025];

export const healthTrendsByYear = {
  2025: [
    { month: 'Jan', vaccinations: 180, checkups: 95 },
    { month: 'Feb', vaccinations: 165, checkups: 88 },
    { month: 'Mar', vaccinations: 210, checkups: 112 },
    { month: 'Apr', vaccinations: 195, checkups: 105 },
    { month: 'May', vaccinations: 225, checkups: 118 },
    { month: 'Jun', vaccinations: 218, checkups: 115 },
  ],
  2024: [
    { month: 'Jan', vaccinations: 165, checkups: 88 },
    { month: 'Feb', vaccinations: 152, checkups: 82 },
    { month: 'Mar', vaccinations: 195, checkups: 105 },
    { month: 'Apr', vaccinations: 182, checkups: 98 },
    { month: 'May', vaccinations: 210, checkups: 112 },
    { month: 'Jun', vaccinations: 205, checkups: 108 },
  ],
  2023: [
    { month: 'Jan', vaccinations: 145, checkups: 78 },
    { month: 'Feb', vaccinations: 135, checkups: 72 },
    { month: 'Mar', vaccinations: 175, checkups: 95 },
    { month: 'Apr', vaccinations: 165, checkups: 88 },
    { month: 'May', vaccinations: 192, checkups: 102 },
    { month: 'Jun', vaccinations: 188, checkups: 98 },
  ],
  2022: [
    { month: 'Jan', vaccinations: 125, checkups: 68 },
    { month: 'Feb', vaccinations: 118, checkups: 65 },
    { month: 'Mar', vaccinations: 155, checkups: 85 },
    { month: 'Apr', vaccinations: 148, checkups: 80 },
    { month: 'May', vaccinations: 175, checkups: 95 },
    { month: 'Jun', vaccinations: 168, checkups: 92 },
  ],
};

export const healthTrends = healthTrendsByYear[2025];

export const regionalDemand = [
  { region: 'Mumbai', demand: 92, adoptions: 45 },
  { region: 'Delhi', demand: 85, adoptions: 38 },
  { region: 'Bangalore', demand: 78, adoptions: 42 },
  { region: 'Chennai', demand: 65, adoptions: 28 },
  { region: 'Pune', demand: 58, adoptions: 25 },
  { region: 'Hyderabad', demand: 72, adoptions: 35 },
];

export const shelterPerformance = [
  { name: 'Happy Paws', score: 94, adoptions: 28, compliance: 98 },
  { name: 'Safe Haven', score: 88, adoptions: 22, compliance: 92 },
  { name: 'Paws & Claws', score: 76, adoptions: 15, compliance: 85 },
  { name: 'Rescue Ranch', score: 91, adoptions: 25, compliance: 96 },
];

export const visitorEngagementByYear = {
  2025: [
    { day: 'Mon', visitors: 1200, pageViews: 4500 },
    { day: 'Tue', visitors: 1350, pageViews: 4800 },
    { day: 'Wed', visitors: 1100, pageViews: 4200 },
    { day: 'Thu', visitors: 1450, pageViews: 5100 },
    { day: 'Fri', visitors: 1600, pageViews: 5800 },
    { day: 'Sat', visitors: 2100, pageViews: 7200 },
    { day: 'Sun', visitors: 1950, pageViews: 6800 },
  ],
  2024: [
    { day: 'Mon', visitors: 1100, pageViews: 4200 },
    { day: 'Tue', visitors: 1250, pageViews: 4500 },
    { day: 'Wed', visitors: 1000, pageViews: 3900 },
    { day: 'Thu', visitors: 1350, pageViews: 4800 },
    { day: 'Fri', visitors: 1500, pageViews: 5500 },
    { day: 'Sat', visitors: 1950, pageViews: 6800 },
    { day: 'Sun', visitors: 1800, pageViews: 6400 },
  ],
  2023: [
    { day: 'Mon', visitors: 950, pageViews: 3800 },
    { day: 'Tue', visitors: 1100, pageViews: 4100 },
    { day: 'Wed', visitors: 850, pageViews: 3500 },
    { day: 'Thu', visitors: 1200, pageViews: 4400 },
    { day: 'Fri', visitors: 1350, pageViews: 5100 },
    { day: 'Sat', visitors: 1750, pageViews: 6300 },
    { day: 'Sun', visitors: 1600, pageViews: 5900 },
  ],
  2022: [
    { day: 'Mon', visitors: 800, pageViews: 3400 },
    { day: 'Tue', visitors: 950, pageViews: 3700 },
    { day: 'Wed', visitors: 700, pageViews: 3100 },
    { day: 'Thu', visitors: 1050, pageViews: 4000 },
    { day: 'Fri', visitors: 1200, pageViews: 4700 },
    { day: 'Sat', visitors: 1550, pageViews: 5800 },
    { day: 'Sun', visitors: 1400, pageViews: 5400 },
  ],
};

export const visitorEngagement = visitorEngagementByYear[2025];

export const platformKPIs = {
  totalUsers: 12450,
  activeShelters: 48,
  verifiedVets: 32,
  totalAdoptions: 2840,
  pendingApplications: 156,
  monthlyDonations: 178000,
  avgAdoptionTime: 12,
};
