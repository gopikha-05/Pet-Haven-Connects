export const mockNotifications = [
  { id: 'n1', type: 'adoption', title: 'Application Under Review', message: 'Your application for Buddy is being reviewed.', read: false, createdAt: '2026-05-15T09:00:00Z' },
  { id: 'n2', type: 'vaccination', title: 'Vaccination Reminder', message: 'Luna\'s FVRCP booster is due in 7 days.', read: false, createdAt: '2026-05-18T08:00:00Z' },
  { id: 'n3', type: 'payment', title: 'Payment Successful', message: 'Your donation of ₹2,000 was received. Thank you!', read: true, createdAt: '2026-05-10T14:00:00Z' },
  { id: 'n4', type: 'appointment', title: 'Vet Appointment Confirmed', message: 'Checkup with Dr. Rajesh on May 22 at 10:00 AM.', read: true, createdAt: '2026-05-12T11:00:00Z' },
  { id: 'n5', type: 'shelter', title: 'Shelter Approved', message: 'Happy Paws Shelter verification completed.', read: true, createdAt: '2026-05-01T10:00:00Z' },
  { id: 'n6', type: 'complaint', title: 'New complaint received', message: 'A new complaint has been raised against your shelter.', read: false, createdAt: '2026-05-20T10:00:00Z', complaintId: 'c1' },
  { id: 'n7', type: 'complaint_status', title: 'Complaint status updated', message: 'Your complaint has been accepted for review.', read: false, createdAt: '2026-05-20T11:00:00Z', complaintId: 'c1' },
  { id: 'n8', type: 'complaint_status', title: 'Complaint resolved', message: 'Your complaint has been marked as resolved.', read: false, createdAt: '2026-05-21T09:00:00Z', complaintId: 'c1' },
];
