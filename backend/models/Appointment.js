import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  petName: { type: String, required: true },
  vetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vetName: { type: String, required: true },
  adopterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adopterName: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true }, // Format: HH:MM
  type: { 
    type: String, 
    enum: ['checkup', 'general-checkup', 'vaccination', 'emergency', 'grooming', 'treatment'],
    required: true 
  },
  notes: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'rejected', 'rescheduled', 'completed'],
    default: 'pending' 
  },
  rejectionReason: { type: String },
  rescheduledDate: { type: String },
  rescheduledTime: { type: String },
  rescheduleReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Appointment', appointmentSchema);
