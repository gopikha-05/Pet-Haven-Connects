import express from 'express';
import User from '../models/User.js';
import { auth, authorizeRoles } from '../middleware/auth.js';
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * @route   GET /api/admin/pending-approvals
 * @desc    Get all pending user approvals
 * @access  Admin
 */
router.get('/pending-approvals', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: { $in: ['shelter', 'vet'] },
      isApproved: false
    }).select('-password');

    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/admin/shelters
 * @desc    Get all shelters for report filtering
 * @access  Admin
 */
router.get('/shelters', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const shelters = await User.find({ role: 'shelter', isApproved: true })
      .select('_id name email location')
      .sort({ name: 1 });

    res.json(shelters);
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/admin/approve-user/:userId
 * @desc    Approve a user registration
 * @access  Admin
 */
router.put('/approve-user/:userId', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { licenseVerified } = req.body;

    console.log('[Admin] Approve user request - userId:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    console.log('[Admin] Found user:', user ? user.email : 'null');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'User already approved' });
    }

    user.isApproved = true;
    user.licenseVerified = licenseVerified !== undefined ? licenseVerified : true;
    user.licenseVerificationStatus = 'verified';
    user.rejectionReason = '';
    
    console.log('[Admin] Saving user with changes:', {
      isApproved: user.isApproved,
      licenseVerified: user.licenseVerified,
      licenseVerificationStatus: user.licenseVerificationStatus
    });
    
    await user.save();

    console.log('[Admin] User approved successfully:', user.email);

    // Send confirmation email
    try {
      await sendApprovalEmail(user.email, user.name, user.role);
    } catch (mailErr) {
      console.error(`[Admin] Failed to send approval email to ${user.email}:`, mailErr.message);
    }

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('[Admin] Approve user error:', error);
    console.error('[Admin] Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/admin/reject-user/:userId
 * @desc    Reject a user registration
 * @access  Admin
 */
router.put('/reject-user/:userId', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, rejectionReason } = req.body;
    const finalReason = reason || rejectionReason || 'Registration rejected by admin';

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'User already approved' });
    }

    user.isApproved = false;
    user.licenseVerified = false;
    user.licenseVerificationStatus = 'rejected';
    user.rejectionReason = finalReason;
    await user.save();

    // Send rejection email
    try {
      await sendRejectionEmail(user.email, user.name, user.role, user.rejectionReason);
    } catch (mailErr) {
      console.error(`[Admin] Failed to send rejection email to ${user.email}:`, mailErr.message);
    }

    res.json({ message: 'User rejected successfully', user });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/admin/all-users
 * @desc    Get all users with approval status
 * @access  Admin
 */
router.get('/all-users', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/admin/users/:userId/verify-email
 * @desc    Directly verify email verification status
 * @access  Admin
 */
router.put('/users/:userId/verify-email', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isEmailVerified } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isEmailVerified = isEmailVerified !== undefined ? isEmailVerified : true;
    if (user.isEmailVerified) {
      user.emailVerificationToken = undefined;
    }
    await user.save();
    res.json({ message: 'Email verification status updated successfully', user });
  } catch (error) {
    console.error('Verify email status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/admin/users/:userId/toggle-status
 * @desc    Toggle account active status (Active/Inactive)
 * @access  Admin
 */
router.put('/users/:userId/toggle-status', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = user.isActive === undefined ? false : !user.isActive;
    await user.save();
    res.json({ message: `User status toggled to ${user.isActive ? 'Active' : 'Inactive'}`, user });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:userId', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
