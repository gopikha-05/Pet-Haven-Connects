import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  petName: { type: String, required: true },
  breed: { type: String },
  owner: { type: String },
  shelter: { type: String },
  visitDate: { type: String },
  date: { type: String },
  type: { type: String }, // Maps to treatment category/diagnosis
  vet: { type: String }, // Veterinarian name
  notes: { type: String }, // Treatment + Vet Notes summary
  symptoms: { type: String },
  diagnosis: { type: String },
  treatment: { type: String },
  medications: { type: String },
  vaccination: { type: String },
  nextVisit: { type: String },
  vetNotes: { type: String },
  prescriptionPath: { type: String }, // Path or link for uploaded files
  reportPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);
