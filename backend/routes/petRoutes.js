import express from 'express';
import {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  updatePetStatus
} from '../controllers/petController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

/**
 * Public routes
 */
router.get('/', getPets);
router.get('/:id', getPetById);

/**
 * Protected routes (require token authentication)
 */
router.post('/', auth, upload.array('images', 5), createPet);
router.put('/:id', auth, upload.array('images', 5), updatePet);
router.delete('/:id', auth, deletePet);
router.put('/:id/status', auth, updatePetStatus);

export default router;
