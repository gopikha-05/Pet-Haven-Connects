import mongoose from 'mongoose';

const vaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  nextDue: { type: String, required: true }
});

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: true, enum: ['dog', 'cat', 'rabbit', 'bird', 'hamster', 'other'] },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ['male', 'female'] },
  temperament: [{ type: String }],
  healthStatus: { type: String, required: true },
  shelterId: { type: String, required: true }, // can map to User._id string
  shelterName: { type: String, required: true },
  location: { type: String, default: '' },
  images: [{ type: String }],
  description: { type: String, default: '' },
  vaccinated: { type: Boolean, default: false },
  neutered: { type: Boolean, default: false },
  adoptionFee: { type: Number, default: 0 },
  vaccinations: [vaccinationSchema],
  shelterNotes: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'adopted', 'pending'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

petSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Pet', petSchema);
