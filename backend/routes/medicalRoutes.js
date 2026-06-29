import express from 'express';
import MedicalRecord from '../models/MedicalRecord.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/medical
 * @desc    Get all medical records
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const list = await MedicalRecord.find({}).sort({ visitDate: -1, createdAt: -1 });
    const formatted = list.map(r => {
      const obj = r.toObject();
      obj.id = obj._id.toString();
      return obj;
    });
    res.json(formatted);
  } catch (error) {
    console.error('[MedicalRoutes] Error fetching records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/medical/:petId/treatments
 * @desc    Add treatment to a pet's medical record
 * @access  Private (Vet)
 */
router.post('/:petId/treatments', auth, async (req, res) => {
  try {
    const { petId } = req.params;
    const {
      petName,
      breed,
      owner,
      shelter,
      visitDate,
      symptoms,
      diagnosis,
      treatment,
      medications,
      vaccination,
      nextVisit,
      vetNotes,
      vet
    } = req.body;

    const record = await MedicalRecord.create({
      petId,
      petName: petName || 'Pet',
      breed: breed || '',
      owner: owner || '',
      shelter: shelter || '',
      visitDate: visitDate || new Date().toISOString().substring(0, 10),
      date: visitDate || new Date().toISOString().substring(0, 10),
      type: diagnosis || 'General Diagnosis',
      vet: vet || req.user.name || 'Dr. Unknown',
      notes: `${treatment || ''} - ${vetNotes || ''}`,
      symptoms: symptoms || '',
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      medications: medications || '',
      vaccination: vaccination || '',
      nextVisit: nextVisit || '',
      vetNotes: vetNotes || ''
    });

    const obj = record.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (error) {
    console.error('[MedicalRoutes] Error creating treatment record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/medical/:idOrPetId
 * @desc    Get record by ID or Pet ID list
 * @access  Private
 */
router.get('/:idOrPetId', auth, async (req, res) => {
  try {
    const { idOrPetId } = req.params;

    // Check if it's a list of records for a specific pet
    const petRecords = await MedicalRecord.find({ petId: idOrPetId }).sort({ visitDate: -1 });
    if (petRecords && petRecords.length > 0) {
      const formatted = petRecords.map(r => {
        const obj = r.toObject();
        obj.id = obj._id.toString();
        return obj;
      });
      return res.json(formatted);
    }

    // Try finding by record ID
    try {
      const record = await MedicalRecord.findById(idOrPetId);
      if (record) {
        const obj = record.toObject();
        obj.id = obj._id.toString();
        return res.json(obj);
      }
    } catch (e) {
      // Invalid ObjectId formats will throw error, fallback to empty array
    }

    res.json([]);
  } catch (error) {
    console.error('[MedicalRoutes] Error getting record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/medical/:petId/behavioral
 * @desc    Update behavioral notes for a pet
 * @access  Private (Vet)
 */
router.put('/:petId/behavioral', auth, async (req, res) => {
  try {
    const { petId } = req.params;
    const { behavioralNotes } = req.body;

    const record = await MedicalRecord.findOneAndUpdate(
      { petId },
      { $set: { vetNotes: behavioralNotes } },
      { new: true, upsert: true }
    );

    const obj = record.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[MedicalRoutes] Error updating behavioral notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/medical/:petId/daily-care
 * @desc    Update daily care notes for a pet
 * @access  Private (Vet)
 */
router.put('/:petId/daily-care', auth, async (req, res) => {
  try {
    const { petId } = req.params;
    const { dailyCareNotes } = req.body;

    const record = await MedicalRecord.findOneAndUpdate(
      { petId },
      { $set: { notes: dailyCareNotes } },
      { new: true, upsert: true }
    );

    const obj = record.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[MedicalRoutes] Error updating daily care notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
