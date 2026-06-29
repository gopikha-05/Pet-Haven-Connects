import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const applicationSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  petName: { type: String, required: true },
  adopterId: { type: String, required: true },
  adopterName: { type: String, required: true },
  adopterEmail: { type: String, required: true },
  shelterId: { type: String, required: true },
  shelterName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'pickup_scheduled', 'out_for_delivery', 'completed'], 
    default: 'pending' 
  },
  notes: { type: String, default: '' },
  reason: { type: String, default: '' },
  fullName: { type: String, default: '' },
  age: { type: Number },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  occupation: { type: String, default: '' },
  previousPetExperience: { type: String, default: '' },
  experienceExplanation: { type: String, default: '' },
  homeType: { type: String, default: 'apartment' },
  hasYard: { type: Boolean, default: false },
  existingPets: { type: String, default: '' },
  familyMemberCount: { type: Number },
  dailyAvailability: { type: String, default: '' },
  financialReadiness: { type: String, default: '' },
  vetReference: { type: String, default: '' },
  homeImage: { type: String, default: '' },
  timeline: [timelineSchema],
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Delivery method fields
  deliveryMethod: { type: String, enum: ['take_away', 'door_delivery'], default: null },
  scheduledPickupDate: { type: Date, default: null },
  scheduledPickupTime: { type: String, default: null },
  deliveryAddress: { type: String, default: null },
  scheduledDeliveryDate: { type: Date, default: null },
  // Official adoption completion date
  adoptionCompletionDate: { type: Date, default: null }
});

applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Application', applicationSchema);
