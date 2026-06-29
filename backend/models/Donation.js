import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'], 
    default: 'completed' 
  },
  adopterId: { type: String },
  adopterName: { type: String },
  petId: { type: String },
  petName: { type: String },
  method: { type: String, default: 'upi' },
  
  // Phase 2 Fields
  applicationId: { type: String },
  paymentReference: { type: String },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed },
  paymentSignature: { type: String }
});

export default mongoose.model('Donation', donationSchema);
