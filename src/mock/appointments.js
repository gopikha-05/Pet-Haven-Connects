export const mockAppointments = [
  { id: 'apt1', petId: 'p2', petName: 'Luna', vetId: 'u3', vetName: 'Dr. Rajesh Kumar', date: '2026-05-22', time: '10:00', type: 'checkup', status: 'confirmed', notes: 'Annual wellness check' },
  { id: 'apt2', petId: 'p1', petName: 'Buddy', vetId: 'u3', vetName: 'Dr. Rajesh Kumar', date: '2026-05-25', time: '14:30', type: 'vaccination', status: 'pending', notes: 'Rabies booster' },
  { id: 'apt3', petId: 'p3', petName: 'Charlie', vetId: 'u3', vetName: 'Dr. Rajesh Kumar', date: '2026-05-20', time: '11:00', type: 'treatment', status: 'completed', notes: 'Arthritis follow-up' },
];

export const mockMedicalRecords = [
  {
    petId: 'p2',
    petName: 'Luna',
    allergies: ['fish'],
    treatments: [
      { date: '2026-03-01', type: 'Dental cleaning', vet: 'Dr. Rajesh Kumar', notes: 'No complications' },
      { date: '2026-01-15', type: 'FVRCP Vaccine', vet: 'Dr. Rajesh Kumar', notes: 'Routine vaccination' },
    ],
    behavioralNotes: ['Prefers quiet environments', 'Anxious during thunderstorms'],
    dailyCareNotes: ['Feed twice daily', 'Fresh water always', 'Brush weekly'],
  },
];
