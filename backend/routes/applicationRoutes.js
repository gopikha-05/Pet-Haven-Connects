import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  setDeliveryMethod,
  markAsPickedUp,
  markAsDelivered
} from '../controllers/applicationController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// All application routes require authentication
router.use(auth);

/**
 * @route   GET /api/applications
 * @desc    Get all adoption applications for authenticated user
 * @access  Private
 */
router.get('/', getApplications);

/**
 * @route   GET /api/applications/:id
 * @desc    Get single adoption application by ID
 * @access  Private
 */
router.get('/:id', getApplicationById);

/**
 * @route   POST /api/applications
 * @desc    Submit a new adoption application
 * @access  Private (Adopter only)
 */
router.post('/', createApplication);

/**
 * @route   PUT /api/applications/:id/status
 * @desc    Update adoption application status
 * @access  Private
 */
router.put('/:id/status', updateApplicationStatus);

/**
 * @route   PUT /api/applications/:id/delivery-method
 * @desc    Set delivery method after payment (Adopter only)
 * @access  Private (Adopter only)
 */
router.put('/:id/delivery-method', setDeliveryMethod);

/**
 * @route   PUT /api/applications/:id/mark-picked-up
 * @desc    Mark adoption as picked up (Shelter only)
 * @access  Private (Shelter only)
 */
router.put('/:id/mark-picked-up', markAsPickedUp);

/**
 * @route   PUT /api/applications/:id/mark-delivered
 * @desc    Mark adoption as delivered (Shelter only)
 * @access  Private (Shelter only)
 */
router.put('/:id/mark-delivered', markAsDelivered);

export default router;
