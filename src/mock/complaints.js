export const COMPLAINT_STATUSES = {
  PENDING: 'Pending Review',
  UNDER_REVIEW: 'Under Investigation',
  ACTION_TAKEN: 'Action Taken',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

export const COMPLAINT_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  EMERGENCY: 'Emergency'
};

export const SHELTER_COMPLAINT_CATEGORIES = [
  'Poor Pet Condition',
  'Shelter Misconduct',
  'Delay in Response',
  'Negligence',
  'Wrong Adoption Details',
  'Abuse Concern',
  'Other'
];

export const VET_COMPLAINT_CATEGORIES = [
  'Wrong Treatment',
  'No Response',
  'Misbehavior',
  'Incorrect Diagnosis',
  'Overcharging',
  'Delay in Treatment',
  'Other'
];

export const CONTACT_PREFERENCES = [
  'Phone',
  'Email'
];

// License database mapping for shelters and veterinarians
export const LICENSE_DATABASE = {
  shelters: {
    'SHL-2024-10452': { city: 'Mumbai', name: 'Happy Paws Shelter' },
    'SHL-2024-10453': { city: 'Delhi', name: 'Safe Haven Rescue' },
    'SHL-2024-10454': { city: 'Pune', name: 'Paws & Claws' },
    'SHL-2024-10455': { city: 'Bangalore', name: 'City Animal Shelter' },
    'SHL-2024-10456': { city: 'Chennai', name: 'Blue Cross Shelter' },
    'SHL-2024-10457': { city: 'Hyderabad', name: 'Pet Paradise' },
    'SHL-2024-10458': { city: 'Kolkata', name: 'Kolkata Pet Home' },
    'SHL-2024-10459': { city: 'Ahmedabad', name: 'Ahmedabad Shelter' },
    'SHL-2024-10460': { city: 'Jaipur', name: 'Pink City Pets' },
    'SHL-2024-10461': { city: 'Lucknow', name: 'Lucknow Animal Care' },
  },
  veterinarians: {
    'VET-2024-88231': { city: 'Mumbai', clinic: 'PetCare Clinic' },
    'VET-2024-88232': { city: 'Delhi', clinic: 'Animal Health Center' },
    'VET-2024-88233': { city: 'Pune', clinic: 'VetCare Plus' },
    'VET-2024-88234': { city: 'Bangalore', clinic: 'City Vet Hospital' },
    'VET-2024-88235': { city: 'Chennai', clinic: 'Chennai Pet Clinic' },
    'VET-2024-88236': { city: 'Hyderabad', clinic: 'Hyderabad Vet Center' },
    'VET-2024-88237': { city: 'Kolkata', clinic: 'Kolkata Veterinary Services' },
    'VET-2024-88238': { city: 'Ahmedabad', clinic: 'Ahmedabad Pet Hospital' },
    'VET-2024-88239': { city: 'Jaipur', clinic: 'Jaipur Vet Clinic' },
    'VET-2024-88240': { city: 'Lucknow', clinic: 'Lucknow Animal Hospital' },
  }
};

// Helper function to get shelter info from license
export const getShelterInfo = (license) => {
  return LICENSE_DATABASE.shelters[license] || { city: 'Pending', name: 'Unknown Shelter' };
};

// Helper function to get vet info from license
export const getVetInfo = (license) => {
  return LICENSE_DATABASE.veterinarians[license] || { city: 'Pending', clinic: 'Unknown Clinic' };
};

export const mockComplaints = [
  {
    id: 'c1',
    title: 'Overcrowded facility',
    raisedByUserId: 'u1',
    raisedByRole: 'adopter',
    raisedByName: 'Sarah Mitchell',
    againstUserId: 'u2',
    againstRole: 'shelter',
    againstName: 'Happy Paws Shelter',
    status: 'pending',
    priority: 'high',
    description: 'The shelter appears to be overcrowded with poor living conditions for the animals.',
    evidence: 'Photos attached showing cramped cages',
    resolutionNotes: '',
    createdAt: '2026-05-17T10:00:00Z',
    updatedAt: '2026-05-17T10:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-17T10:00:00Z', note: 'Complaint submitted', actor: 'Sarah Mitchell' }
    ]
  },
  {
    id: 'c2',
    title: 'Application processing delay',
    raisedByUserId: 'u5',
    raisedByRole: 'adopter',
    raisedByName: 'John Doe',
    againstUserId: 'u5',
    againstRole: 'shelter',
    againstName: 'Safe Haven Rescue',
    status: 'under_review',
    priority: 'medium',
    description: 'My adoption application has been pending for over 2 weeks without any update.',
    evidence: 'Application submission receipt',
    resolutionNotes: 'Shelter is reviewing the application and will respond within 48 hours',
    createdAt: '2026-05-16T14:30:00Z',
    updatedAt: '2026-05-18T09:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-16T14:30:00Z', note: 'Complaint submitted', actor: 'John Doe' },
      { status: 'under_review', date: '2026-05-18T09:00:00Z', note: 'Shelter acknowledged and investigating', actor: 'Safe Haven Rescue' }
    ]
  },
  {
    id: 'c3',
    title: 'Appointment scheduling issue',
    raisedByUserId: 'u1',
    raisedByRole: 'adopter',
    raisedByName: 'Sarah Mitchell',
    againstUserId: 'u3',
    againstRole: 'vet',
    againstName: 'Dr. Rajesh Kumar',
    status: 'resolved',
    priority: 'low',
    description: 'Difficulty scheduling appointments, long wait times.',
    evidence: 'Screenshot of booking system error',
    resolutionNotes: 'Vet clinic has fixed their booking system and apologized for the inconvenience',
    createdAt: '2026-05-01T11:00:00Z',
    updatedAt: '2026-05-05T16:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-01T11:00:00Z', note: 'Complaint submitted', actor: 'Sarah Mitchell' },
      { status: 'under_review', date: '2026-05-02T10:00:00Z', note: 'Vet clinic investigating the issue', actor: 'Dr. Rajesh Kumar' },
      { status: 'action_taken', date: '2026-05-04T14:00:00Z', note: 'Booking system fixed', actor: 'Dr. Rajesh Kumar' },
      { status: 'resolved', date: '2026-05-05T16:00:00Z', note: 'User confirmed issue resolved', actor: 'Sarah Mitchell' }
    ]
  },
  {
    id: 'c4',
    title: 'Adopter not providing required documents',
    raisedByUserId: 'u2',
    raisedByRole: 'shelter',
    raisedByName: 'Happy Paws Shelter',
    againstUserId: 'u5',
    againstRole: 'adopter',
    againstName: 'John Doe',
    status: 'action_taken',
    priority: 'medium',
    description: 'Adopter has not provided required home visit photos despite multiple reminders.',
    evidence: 'Email correspondence logs',
    resolutionNotes: 'Sent final reminder, will reject application if no response in 48 hours',
    createdAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-05-18T11:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-15T09:00:00Z', note: 'Complaint submitted', actor: 'Happy Paws Shelter' },
      { status: 'under_review', date: '2026-05-16T10:00:00Z', note: 'Reviewing application history', actor: 'Happy Paws Shelter' },
      { status: 'action_taken', date: '2026-05-18T11:00:00Z', note: 'Final reminder sent', actor: 'Happy Paws Shelter' }
    ]
  },
  {
    id: 'c5',
    title: 'Vet misdiagnosed pet condition',
    raisedByUserId: 'u5',
    raisedByRole: 'shelter',
    raisedByName: 'Safe Haven Rescue',
    againstUserId: 'u3',
    againstRole: 'vet',
    againstName: 'Dr. Rajesh Kumar',
    status: 'under_review',
    priority: 'high',
    description: 'Vet incorrectly diagnosed a respiratory infection as allergies, leading to delayed treatment.',
    evidence: 'Second opinion report from another vet',
    resolutionNotes: '',
    createdAt: '2026-05-18T08:00:00Z',
    updatedAt: '2026-05-18T08:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-18T08:00:00Z', note: 'Complaint submitted', actor: 'Safe Haven Rescue' },
      { status: 'under_review', date: '2026-05-18T10:00:00Z', note: 'Vet clinic reviewing medical records', actor: 'Dr. Rajesh Kumar' }
    ]
  },
  {
    id: 'c6',
    title: 'Shelter not following vaccination protocol',
    raisedByUserId: 'u3',
    raisedByRole: 'vet',
    raisedByName: 'Dr. Rajesh Kumar',
    againstUserId: 'u2',
    againstRole: 'shelter',
    againstName: 'Happy Paws Shelter',
    status: 'pending',
    priority: 'high',
    description: 'Shelter is not following proper vaccination schedules for new arrivals.',
    evidence: 'Vaccination records showing gaps',
    resolutionNotes: '',
    createdAt: '2026-05-19T07:00:00Z',
    updatedAt: '2026-05-19T07:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-19T07:00:00Z', note: 'Complaint submitted', actor: 'Dr. Rajesh Kumar' }
    ]
  },
  {
    id: 'c7',
    title: 'Adopter returned pet without valid reason',
    raisedByUserId: 'u3',
    raisedByRole: 'vet',
    raisedByName: 'Dr. Rajesh Kumar',
    againstUserId: 'u1',
    againstRole: 'adopter',
    againstName: 'Sarah Mitchell',
    status: 'under_review',
    priority: 'medium',
    description: 'Adopter returned a healthy pet after 3 days citing "personality mismatch" without proper consultation.',
    evidence: 'Return form and pet health check report',
    resolutionNotes: 'Requested adopter to provide more details about the issue',
    createdAt: '2026-05-14T12:00:00Z',
    updatedAt: '2026-05-17T15:00:00Z',
    timeline: [
      { status: 'pending', date: '2026-05-14T12:00:00Z', note: 'Complaint submitted', actor: 'Dr. Rajesh Kumar' },
      { status: 'under_review', date: '2026-05-15T09:00:00Z', note: 'Reviewing return documentation', actor: 'Dr. Rajesh Kumar' },
      { status: 'action_taken', date: '2026-05-16T14:00:00Z', note: 'Contacted adopter for explanation', actor: 'Dr. Rajesh Kumar' },
      { status: 'under_review', date: '2026-05-17T15:00:00Z', note: 'Awaiting adopter response', actor: 'Dr. Rajesh Kumar' }
    ]
  },
];

export const mockShelters = [
  { id: 'sh1', name: 'Happy Paws Shelter', verified: true, registered: true, city: 'Mumbai', pets: 24, adoptions: 28, compliance: 98, blacklisted: false, status: 'active' },
  { id: 'sh2', name: 'Safe Haven Rescue', verified: true, registered: true, city: 'Delhi', pets: 18, adoptions: 22, compliance: 92, blacklisted: false, status: 'active' },
  { id: 'sh3', name: 'Paws & Claws', verified: true, registered: true, city: 'Pune', pets: 12, adoptions: 15, compliance: 85, blacklisted: false, status: 'active' },
  { id: 'sh4', name: 'City Animal Shelter', verified: true, registered: true, city: 'Bangalore', pets: 15, adoptions: 18, compliance: 90, blacklisted: false, status: 'active' },
  { id: 'sh5', name: 'Blue Cross Shelter', verified: true, registered: true, city: 'Chennai', pets: 20, adoptions: 25, compliance: 95, blacklisted: false, status: 'active' },
  { id: 'sh6', name: 'Pet Paradise', verified: true, registered: true, city: 'Hyderabad', pets: 16, adoptions: 20, compliance: 88, blacklisted: false, status: 'active' },
];

export const mockVeterinarians = [
  { id: 'v1', name: 'Dr. Rajesh Kumar', verified: true, city: 'Mumbai', clinic: 'PetCare Clinic', appointments: 45, rating: 4.8, blacklisted: false },
  { id: 'v2', name: 'Dr. Priya Sharma', verified: true, city: 'Delhi', clinic: 'Animal Health Center', appointments: 38, rating: 4.6, blacklisted: false },
  { id: 'v3', name: 'Dr. Amit Patel', verified: false, city: 'Bangalore', clinic: 'VetCare Plus', appointments: 22, rating: 4.4, blacklisted: false },
];
