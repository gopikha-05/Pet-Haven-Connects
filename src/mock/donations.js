export const mockDonations = [
  { id: 'd1', amount: 2000, date: '2026-05-10', method: 'upi', shelter: 'Happy Paws Shelter', status: 'completed', invoiceId: 'INV-2026-001' },
  { id: 'd2', amount: 500, date: '2026-04-15', method: 'card', shelter: 'Safe Haven Rescue', status: 'completed', invoiceId: 'INV-2026-002' },
  { id: 'd3', amount: 1500, date: '2026-03-20', method: 'wallet', shelter: 'Platform General Fund', status: 'completed', invoiceId: 'INV-2026-003' },
];

export const mockTransactions = [
  { id: 't1', type: 'vaccination', description: 'Rabies vaccine - Luna', amount: 800, date: '2026-04-01', status: 'paid' },
  { id: 't2', type: 'grooming', description: 'Full grooming - Luna', amount: 1200, date: '2026-04-10', status: 'paid' },
  { id: 't3', type: 'donation', description: 'Shelter donation', amount: 2000, date: '2026-05-10', status: 'paid' },
];

export const rewardBadges = [
  { id: 'responsible_caregiver', name: 'Responsible Caregiver', description: 'Complete 30 days of care logs', icon: '🏆', earned: true },
  { id: 'regular_donor', name: 'Regular Donor', description: 'Donate 3+ times', icon: '💝', earned: true },
  { id: 'clinic_helper', name: 'Clinic Helper', description: 'Attend 5+ vet appointments', icon: '🩺', earned: false },
];
