import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['adopter', 'shelter', 'vet', 'veterinarian', 'admin'],
    required: true 
  },
  licenseNumber: { type: String }, // For shelter and veterinarian
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  preferredPetType: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  registrationAuthority: { type: String, default: '' },
  qualification: { type: String, default: '' },
  specialization: { type: String, default: '' },
  experience: { type: String, default: '' },
  availability: { type: String, default: '' },
  clinic: { type: String, default: '' },
  socketId: { type: String }, // For real-time notifications
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  // Approval and verification fields
  isApproved: { type: Boolean, default: true }, // Default true for adopters, false for vets/shelters
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  verificationOTP: { type: String }, // 6-digit OTP for email verification
  otpExpiry: { type: Date }, // OTP expiry (5 minutes)
  licenseVerified: { type: Boolean, default: false },
  licenseVerificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

export default mongoose.model('User', userSchema);
