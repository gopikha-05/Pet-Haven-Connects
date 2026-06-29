import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  recipientRole: { 
    type: String, 
    enum: ['adopter', 'shelter', 'vet', 'veterinarian', 'admin'],
    required: true 
  },
  type: { 
    type: String, 
    enum: ['adoption', 'vaccination', 'payment', 'appointment', 'shelter', 'complaint', 'complaint_status', 'system'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data (e.g., complaintId, petId, etc.)
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }
});

// Index for faster queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
