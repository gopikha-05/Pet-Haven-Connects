export const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_COMPLETED: 'payment_completed',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

export const APPLICATION_STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  payment_pending: 'Awaiting Payment',
  payment_completed: 'Payment Completed',
  pickup_scheduled: 'Pickup Scheduled',
  out_for_delivery: 'Out for Delivery',
  rejected: 'Rejected',
  completed: 'Adoption Completed',
  // Fallback for old statuses that might still exist in database
  ready_for_pickup: 'Pickup Scheduled',
  ready_for_delivery: 'Out for Delivery',
  // Timeline step labels (not actual statuses, used for timeline display)
  application_submitted: 'Application Submitted',
  shelter_reviewed: 'Shelter Reviewed',
  delivery_scheduled: 'Delivery Scheduled',
  pet_handed_to_delivery: 'Pet Handed to Delivery Partner',
  delivered_successfully: 'Delivered Successfully',
  pet_ready_for_pickup: 'Pet Ready for Pickup',
  picked_up_by_adopter: 'Picked Up by Adopter',
};

export const APPLICATION_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  payment_pending: 'bg-orange-100 text-orange-800',
  payment_completed: 'bg-green-100 text-green-800',
  pickup_scheduled: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-indigo-100 text-indigo-800',
  // Fallback for old statuses
  ready_for_pickup: 'bg-cyan-100 text-cyan-800',
  ready_for_delivery: 'bg-purple-100 text-purple-800',
};

export const PET_HEALTH_STATUS = ['excellent', 'good', 'fair', 'needs_care'];

export const PAYMENT_METHODS = ['upi', 'card', 'wallet'];
