import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  userId: { type: String, required: true },
  userName: { type: String },
  amount: { type: Number, required: true }, // Store in Rupees
  paymentType: { 
    type: String, 
    required: true, 
    enum: ['donation', 'adoption'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'], 
    default: 'pending' 
  },
  petId: { type: String },
  petName: { type: String },
  shelterId: { type: String },
  shelterName: { type: String },
  applicationId: { type: String },
  razorpayResponseData: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
