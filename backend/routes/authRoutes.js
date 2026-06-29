import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import SmtpSettings from '../models/SmtpSettings.js';
import { sendVerificationEmail, sendOTPEmail, sendApprovalEmail, sendRejectionEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadToS3, deleteFromS3 } from '../services/s3Service.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, licenseNumber } = req.body;
    console.log(`[Registration] Incoming request - Name: ${name}, Email: ${email}, Role: ${role}, License: ${licenseNumber}`);

    // Password validation
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) passwordErrors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) passwordErrors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) passwordErrors.push('One number');
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Password must contain at least 8 characters, uppercase, lowercase, and number.' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn(`[Registration] Failed: Email ${email} already exists in the database.`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate secure verification token
    const crypto = await import('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Determine if approval is needed
    const needsApproval = (role === 'shelter' || role === 'vet');

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      licenseNumber: (role === 'shelter' || role === 'vet') ? licenseNumber : undefined,
      isApproved: !needsApproval,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      licenseVerified: false,
      licenseVerificationStatus: needsApproval ? 'pending' : 'verified'
    });

    console.log(`[Registration] User created in database with ID: ${user._id}. Dispatching verification email...`);

    // Try to send verification email (Mandatory sending)
    try {
      await sendVerificationEmail(email, verificationToken, name);
    } catch (err) {
      console.error('[Registration] Failed to send verification email, rolling back user creation:', err);
      // Clean up the created user so they can attempt registration again once SMTP settings are corrected
      await User.deleteOne({ _id: user._id });
      return res.status(400).json({ 
        message: `Failed to send verification email. Please ask your administrator to verify SMTP settings in the Admin Dashboard. Error: ${err.message}` 
      });
    }

    res.status(201).json({
      needsEmailVerification: true,
      email: user.email,
      needsApproval,
      message: 'Registration successful! A verification link has been sent to your email.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth] Login attempt for email: ${email}`);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[Auth] Login failed: User not found for email: ${email}`);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log(`[Auth] User found - ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    console.log(`[Auth] User status - Email Verified: ${user.isEmailVerified}, Approved: ${user.isApproved}`);
    console.log(`[Auth] Password hash in DB: ${user.password.substring(0, 30)}...`);
    console.log(`[Auth] Password attempting to match: ${password}`);
    console.log(`[Auth] Password length: ${password.length}`);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Auth] Password match result: ${isMatch}`);
    
    // Debug: Try to hash the input password and compare
    const testHash = await bcrypt.hash(password, 10);
    console.log(`[Auth] Test hash of input: ${testHash.substring(0, 30)}...`);
    console.log(`[Auth] DB hash: ${user.password.substring(0, 30)}...`);
    
    if (!isMatch) {
      console.log(`[Auth] Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check email verification
    if (!user.isEmailVerified) {
      console.log(`[Auth] Login failed: Email not verified for email: ${email}`);
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true
      });
    }

    // Check approval status for vets and shelters
    if ((user.role === 'shelter' || user.role === 'vet') && !user.isApproved) {
      console.log(`[Auth] Login failed: Account pending approval for email: ${email}, status: ${user.licenseVerificationStatus}`);
      return res.status(403).json({ 
        message: 'Your account is pending admin approval',
        requiresApproval: true,
        licenseVerificationStatus: user.licenseVerificationStatus,
        rejectionReason: user.rejectionReason
      });
    }

    console.log(`[Auth] Login successful for email: ${email}`);

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { sub: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email with token (via email link)
 * @access  Public
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('[AuthRoutes] Email verification request received for token:', token);

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      console.log('[AuthRoutes] User not found for token:', token);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }

    console.log('[AuthRoutes] User found:', user.email, 'Role:', user.role);

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      console.log('[AuthRoutes] Token expired for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Verification link has expired' 
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('[AuthRoutes] Email verified successfully for user:', user.email);

    const needsApproval = (user.role === 'shelter' || user.role === 'vet');

    res.json({ 
      success: true,
      message: 'Email verified successfully!',
      role: user.role,
      isApproved: user.isApproved,
      needsApproval,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AuthRoutes] Email verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/validate-token-send-otp
 * @desc    Validate token and send OTP (step 3)
 * @access  Public
 */
router.post('/validate-token-send-otp', async (req, res) => {
  try {
    const { token, email } = req.body;
    console.log('[AuthRoutes] Token validation request received for token:', token, 'email:', email);

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      console.log('[AuthRoutes] User not found for token:', token);
      console.log('[AuthRoutes] Searching for any user with emailVerificationToken...');
      const allUsers = await User.find({ emailVerificationToken: { $ne: null } });
      console.log('[AuthRoutes] Users with emailVerificationToken:', allUsers.map(u => ({ email: u.email, token: u.emailVerificationToken })));
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification link' 
      });
    }

    console.log('[AuthRoutes] User found:', user.email, 'Role:', user.role);

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      console.log('[AuthRoutes] Token expired for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Verification link has expired' 
      });
    }

    // Validate that the entered email matches the registered email
    if (user.email !== email) {
      console.log('[AuthRoutes] Email mismatch. Entered:', email, 'Registered:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'This email does not match the verification request' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP and expiry to user
    user.verificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log('[AuthRoutes] OTP generated for user:', user.email, 'OTP:', otp);

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otp, user.name);
      console.log('[AuthRoutes] OTP email sent successfully to:', user.email);
    } catch (mailErr) {
      console.error('[AuthRoutes] Failed to send OTP email:', mailErr);
      return res.status(400).json({ 
        success: false,
        message: `Failed to send OTP email. Error: ${mailErr.message}` 
      });
    }

    res.json({ 
      success: true,
      message: 'OTP sent successfully to your email',
      email: user.email
    });
  } catch (error) {
    console.error('[AuthRoutes] Token validation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete email verification (step 5)
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('[AuthRoutes] OTP verification request received for email:', email, 'otp:', otp);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[AuthRoutes] User not found for email:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('[AuthRoutes] User found:', user.email, 'Stored OTP:', user.verificationOTP);

    // Check if OTP matches
    if (user.verificationOTP !== otp) {
      console.log('[AuthRoutes] OTP mismatch for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    // Check if OTP is expired
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      console.log('[AuthRoutes] OTP expired for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Verification code has expired' 
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.verificationOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log('[AuthRoutes] Email verified successfully for user:', user.email);

    const needsApproval = (user.role === 'shelter' || user.role === 'vet');

    res.json({ 
      success: true,
      message: 'Email verified successfully!',
      role: user.role,
      isApproved: user.isApproved,
      needsApproval,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AuthRoutes] OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with code (deprecated - kept for backward compatibility)
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('[AuthRoutes] Email verification request received for email:', email, 'code:', code);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('[AuthRoutes] User not found for email:', email);
      return res.status(400).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('[AuthRoutes] User found:', user.email, 'Role:', user.role, 'Stored token:', user.emailVerificationToken);

    // Check if code matches
    if (user.emailVerificationToken !== code) {
      console.log('[AuthRoutes] Code mismatch for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    // Check if token is expired
    if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
      console.log('[AuthRoutes] Token expired for user:', user.email);
      return res.status(400).json({ 
        success: false,
        message: 'Verification code has expired' 
      });
    }

    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log('[AuthRoutes] Email verified successfully for user:', user.email);

    const needsApproval = (user.role === 'shelter' || user.role === 'vet');

    res.json({ 
      success: true,
      message: 'Email verified successfully!',
      role: user.role,
      isApproved: user.isApproved,
      needsApproval,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AuthRoutes] Email verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/send-verification-email/:userId
 * @desc    Admin triggers verification email for user
 * @access  Admin
 */
router.post('/send-verification-email/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate secure verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 24 hours from now
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save token and expiry to user
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Send verification email with link
    try {
      await sendVerificationEmail(user.email, token, user.name);
    } catch (mailErr) {
      console.error(`[Auth] Failed to send verification email to ${user.email}:`, mailErr.message);
      // Rollback token change if email fails
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return res.status(400).json({ 
        message: `Failed to send verification email. Please check SMTP settings. Error: ${mailErr.message}` 
      });
    }

    res.json({ 
      message: 'Verification email sent successfully',
      status: 'pending_user_confirmation'
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate secure verification token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const oldVerificationToken = user.emailVerificationToken;
    
    // Set expiry to 24 hours from now
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    // Try to send verification email (Mandatory sending)
    try {
      await sendVerificationEmail(user.email, token, user.name);
    } catch (err) {
      console.error('[Resend] Failed to send verification email, rolling back token change:', err);
      user.emailVerificationToken = oldVerificationToken;
      user.emailVerificationExpires = undefined;
      await user.save();
      return res.status(400).json({ 
        message: `Failed to send verification email. Please ask your administrator to verify SMTP settings. Error: ${err.message}` 
      });
    }

    res.json({
      message: 'Verification email resent successfully!'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/verify-license
 * @desc    Verify license number
 * @access  Public
 */
router.post('/verify-license', async (req, res) => {
  try {
    const { licenseNumber, role } = req.body;

    // Mock license verification - in production, this would call an external API
    // Validate license format
    const licensePattern = role === 'shelter' ? /^SHL-\d{4}-\d{5}$/ : /^VET-\d{4}-\d{5}$/;
    
    if (!licensePattern.test(licenseNumber)) {
      return res.status(400).json({ 
        valid: false, 
        message: `Invalid license format for ${role}. Expected format: ${role === 'shelter' ? 'SHL-YYYY-XXXXX' : 'VET-YYYY-XXXXX'}` 
      });
    }

    // Mock verification - in production, verify against official registry
    // For now, we'll accept any properly formatted license
    res.json({ 
      valid: true, 
      message: 'License verified successfully',
      licenseNumber: licenseNumber
    });
  } catch (error) {
    console.error('License verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (excluding passwords)
 * @access  Admin
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/auth/shelters
 * @desc    Get all users with role 'shelter'
 * @access  Public/Admin
 */
router.get('/shelters', async (req, res) => {
  try {
    const shelters = await User.find({ role: 'shelter' }).select('-password');
    res.json(shelters);
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/auth/vets
 * @desc    Get all users with role 'vet'
 * @access  Public/Admin
 */
router.get('/vets', async (req, res) => {
  try {
    const vets = await User.find({ role: 'vet' }).select('-password');
    res.json(vets);
  } catch (error) {
    console.error('Get vets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/users/:userId/approve
 * @desc    Approve user registration & license
 * @access  Admin
 */
router.put('/users/:userId/approve', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isApproved = true;
    user.licenseVerified = true;
    user.licenseVerificationStatus = 'verified';
    user.rejectionReason = undefined;
    await user.save();

    // Send confirmation email
    try {
      await sendApprovalEmail(user.email, user.name, user.role);
    } catch (mailErr) {
      console.error(`[Auth] Failed to send approval email to ${user.email}:`, mailErr.message);
    }

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/users/:userId/reject
 * @desc    Reject user registration & license
 * @access  Admin
 */
router.put('/users/:userId/reject', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isApproved = false;
    user.licenseVerified = false;
    user.licenseVerificationStatus = 'rejected';
    user.rejectionReason = rejectionReason || 'Registration rejected by admin';
    await user.save();

    // Send rejection email
    try {
      await sendRejectionEmail(user.email, user.name, user.role, user.rejectionReason);
    } catch (mailErr) {
      console.error(`[Auth] Failed to send rejection email to ${user.email}:`, mailErr.message);
    }

    res.json({ message: 'User rejected successfully', user });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate password reset token and send email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[Auth] Forgot password request received for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      console.log(`[Auth] Forgot password: No user found for email: ${email}`);
      return res.json({ 
        message: 'If an account exists for this email address, a password reset link has been sent.' 
      });
    }
    
    console.log(`[Auth] Forgot password: User found - ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
    
    // Generate secure reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    console.log(`[Auth] Forgot password: Generated reset token (first 8 chars): ${resetToken.substring(0, 8)}...`);
    console.log(`[Auth] Forgot password: Token expires at: ${resetExpires.toISOString()}`);
    
    // Save token and expiry to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();
    
    console.log(`[Auth] Forgot password: Token saved to database for user: ${user.email}`);
    
    // Send password reset email
    try {
      console.log(`[Auth] Forgot password: Attempting to send password reset email to: ${user.email}`);
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      console.log(`[Auth] Forgot password: Password reset email sent successfully to: ${user.email}`);
    } catch (mailErr) {
      console.error(`[Auth] Forgot password: Failed to send password reset email to ${user.email}:`, mailErr);
      console.error(`[Auth] Forgot password: Error details:`, {
        message: mailErr.message,
        code: mailErr.code,
        command: mailErr.command,
        response: mailErr.response
      });
      // Rollback token change if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.log(`[Auth] Forgot password: Rolled back token change due to email failure`);
      return res.status(400).json({ 
        message: `Failed to send password reset email. Please check SMTP settings. Error: ${mailErr.message}` 
      });
    }
    
    console.log(`[Auth] Forgot password: Request completed successfully for: ${user.email}`);
    res.json({ 
      message: 'If an account exists for this email address, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('[Auth] Forgot password: Server error:', error);
    console.error('[Auth] Forgot password: Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify reset token and update password
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    // Password validation
    const passwordErrors = [];
    if (password.length < 8) passwordErrors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) passwordErrors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) passwordErrors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) passwordErrors.push('One number');
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Password must contain at least 8 characters, uppercase, lowercase, and number.' 
      });
    }
    
    // Find user by reset token
    const user = await User.findOne({ resetPasswordToken: token });
    
    if (!user) {
      console.log(`[Auth] Reset password failed: Invalid token - no user found`);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    console.log(`[Auth] Reset password: User found - ID: ${user._id}, Email: ${user.email}`);
    
    // Check if token is expired
    if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
      console.log(`[Auth] Reset password failed: Token expired for user: ${user.email}`);
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(`[Auth] Reset password: Password hashed successfully for user: ${user.email}`);
    console.log(`[Auth] Reset password: New password hash (first 30 chars): ${hashedPassword.substring(0, 30)}...`);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    console.log(`[Auth] Password reset successfully for user: ${user.email}`);
    console.log(`[Auth] User isEmailVerified: ${user.isEmailVerified}, isApproved: ${user.isApproved}`);
    
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Verify refresh token and issue new access token
 * @access  Public
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const accessToken = jwt.sign(
      { sub: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

/**
 * @route   GET /api/auth/smtp-settings
 * @desc    Get SMTP config
 * @access  Admin
 */
router.get('/smtp-settings', async (req, res) => {
  try {
    let settings = await SmtpSettings.findOne({});
    if (!settings) {
      settings = await SmtpSettings.create({
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_username: 'your-email@gmail.com',
        smtp_password: 'your-app-password'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/auth/smtp-settings
 * @desc    Update SMTP config
 * @access  Admin
 */
router.post('/smtp-settings', async (req, res) => {
  try {
    let settings = await SmtpSettings.findOne({});
    if (!settings) {
      settings = new SmtpSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ message: 'SMTP settings updated', settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile details
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('[AuthRoutes] Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile details
 * @access  Private
 */
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  let newUploadedS3Url = null;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const previousAvatarUrl = user.avatar;

    // 1. Upload new avatar to S3 first (if file is provided)
    if (req.file) {
      try {
        newUploadedS3Url = await uploadToS3(req.file, 'users');
      } catch (uploadError) {
        console.error('[AuthRoutes] Avatar S3 upload failed:', uploadError.message);
        return res.status(500).json({ message: 'Avatar upload failed', error: uploadError.message });
      }
    }

    const editableFields = [
      'name', 'phone', 'location', 'bio',
      'preferredPetType', 'capacity', 'registrationAuthority',
      'clinic', 'qualification', 'specialization', 'experience', 'availability'
    ];

    editableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'capacity') {
          user[field] = Number(req.body[field]) || 0;
        } else {
          user[field] = req.body[field];
        }
      }
    });

    // Handle avatar update
    let shouldDeleteOldAvatar = false;
    if (newUploadedS3Url) {
      user.avatar = newUploadedS3Url;
      shouldDeleteOldAvatar = true;
    } else if (req.body.avatar === '') {
      user.avatar = '';
      shouldDeleteOldAvatar = true;
    }

    // 2. Update MongoDB
    await user.save();
    console.log(`[AuthRoutes] User profile updated in DB: ${user._id}`);

    // 3. Delete old S3 avatar only AFTER successful database update
    if (shouldDeleteOldAvatar && previousAvatarUrl) {
      await deleteFromS3(previousAvatarUrl);
    }

    // Return updated user object excluding password
    const updatedUser = user.toObject();
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    console.error('[AuthRoutes] Update profile error (triggering S3 rollback):', error);
    // Rollback S3 upload if DB save failed
    if (newUploadedS3Url) {
      await deleteFromS3(newUploadedS3Url);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
