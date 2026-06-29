import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Donation from '../models/Donation.js';
import Payment from '../models/Payment.js';
import Application from '../models/Application.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import RewardStats from '../models/RewardStats.js';
import { auth } from '../middleware/auth.js';
import { sendAdoptionStatusEmail } from '../services/emailService.js';
import { getNotificationService } from '../controllers/notificationController.js';

const router = express.Router();

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'w9Bg6lg1SYsd5fgKFg69Na2E'
});

// All payment routes require authentication
router.use(auth);

/**
 * @route   GET /api/payments/key
 * @desc    Get Razorpay Public Key ID
 * @access  Private
 */
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR' });
});

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a Razorpay order for adoption or donation
 * @access  Private
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { amount, type, referenceId } = req.body; // amount is in paise (1 INR = 100 paise)

    console.log('[Payment] create-order request:', { amount, type, referenceId });

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount in paise is required' });
    }
    if (!type || !['donation', 'adoption'].includes(type)) {
      return res.status(400).json({ message: 'Valid payment type (donation/adoption) is required' });
    }

    // 1. ADOPTION PAYMENT FLOW (With Lock Verification & Idempotency)
    if (type === 'adoption') {
      const applicationId = referenceId;
      if (!applicationId) {
        return res.status(400).json({ message: 'Application ID is required for adoption payment' });
      }

      // Lock checks
      const app = await Application.findById(applicationId);
      if (!app) {
        return res.status(404).json({ message: 'Application not found' });
      }
      if (app.adopterId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to pay for this application' });
      }
      // Payment should happen after approval and before delivery method selection
      // Allow payment for payment_pending status only
      const allowedStatuses = ['payment_pending'];
      if (!allowedStatuses.includes(app.status)) {
        if (app.status === 'completed') {
          return res.status(400).json({ message: 'Adoption payment already completed for this application' });
        }
        if (app.status === 'payment_completed' || app.status === 'pickup_scheduled' || app.status === 'out_for_delivery') {
          return res.status(400).json({ message: 'Payment already completed. Please select delivery method.' });
        }
        return res.status(400).json({ message: 'Application is not awaiting payment' });
      }

      const pet = await Pet.findById(app.petId);
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }
      if (pet.status !== 'available' && pet.status !== 'pending') {
        return res.status(400).json({ message: 'Pet is no longer available for adoption' });
      }

      // Idempotency: Look for active pending/processing payment for this application
      const existingPayment = await Payment.findOne({
        applicationId,
        status: { $in: ['pending', 'processing'] }
      });

      if (existingPayment) {
        console.log(`[Idempotency] Reusing active Razorpay order ${existingPayment.razorpayOrderId} for application ${applicationId}`);
        return res.json({
          success: true,
          orderId: existingPayment.razorpayOrderId,
          amount: existingPayment.amount * 100, // stored in rupees, convert to paise
          keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
          transactionId: existingPayment._id.toString(),
          reused: true
        });
      }

      // Create new Razorpay order
      const options = {
        amount,
        currency: 'INR',
        receipt: `receipt_adopt_${Date.now().toString().slice(-6)}`
      };
      console.log('[Payment] Creating Razorpay order with options:', options);
      const order = await razorpay.orders.create(options);
      console.log('[Payment] Razorpay order created:', order);

      // Save pending transaction
      const payment = await Payment.create({
        razorpayOrderId: order.id,
        userId: req.user.id,
        userName: req.user.name,
        amount: amount / 100, // store in rupees
        paymentType: 'adoption',
        status: 'pending',
        petId: app.petId,
        petName: app.petName,
        shelterId: pet.shelterId,
        shelterName: pet.shelterName,
        applicationId: app._id.toString()
      });

      console.log(`[Payment] Created adoption Razorpay order ${order.id} for application ${applicationId}`);
      console.log('[Payment] Returning order response:', {
        success: true,
        orderId: order.id,
        amount: order.amount,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
        transactionId: payment._id.toString(),
        reused: false
      });
      return res.status(201).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
        transactionId: payment._id.toString(),
        reused: false
      });
    }

    // 2. DONATION PAYMENT FLOW
    const petId = referenceId;
    let pet = null;
    if (petId) {
      pet = await Pet.findById(petId);
    }

    // Create Razorpay order
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_don_${Date.now().toString().slice(-6)}`
    };
    console.log('[Payment] Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('[Payment] Razorpay order created:', order);

    // Save pending transaction
    const payment = await Payment.create({
      razorpayOrderId: order.id,
      userId: req.user.id,
      userName: req.user.name,
      amount: amount / 100, // store in rupees
      paymentType: 'donation',
      status: 'pending',
      petId: petId || undefined,
      petName: pet ? pet.name : undefined,
      shelterId: pet ? pet.shelterId : undefined,
      shelterName: pet ? pet.shelterName : undefined
    });

    console.log(`[Payment] Created donation Razorpay order ${order.id}`);
    console.log('[Payment] Returning order response:', {
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
      transactionId: payment._id.toString(),
      reused: false
    });
    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_T3MqWna7BBIcpR',
      transactionId: payment._id.toString(),
      reused: false
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature and complete transaction
 * @access  Private
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature, status } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Find local payment record
    const payment = await Payment.findById(transactionId);
    if (!payment) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized transaction access' });
    }

    // 1. Handle Explicit Failure/Cancellation (simulated/actual gateway failures)
    if (status && ['failed', 'cancelled', 'expired'].includes(status)) {
      payment.status = status;
      payment.razorpayResponseData = req.body;
      await payment.save();

      console.warn(`[Payment] Transaction ${transactionId} failed verification. Local status set to: ${status}`);
      return res.json({ success: false, status, message: `Payment failed. Status: ${status}` });
    }

    // 2. Payment Race Condition Prevention & Lock Checks
    if (payment.status === 'completed') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    if (payment.paymentType === 'adoption') {
      const app = await Application.findById(payment.applicationId);
      if (!app || app.status === 'completed') {
        return res.status(400).json({ message: 'Payment already processed' });
      }

      const pet = await Pet.findById(payment.petId);
      if (!pet || pet.status === 'adopted') {
        return res.status(400).json({ message: 'Payment already processed' });
      }
    }

    // 3. Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET || 'w9Bg6lg1SYsd5fgKFg69Na2E';
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpaySignature;

    if (!isSignatureValid) {
      payment.status = 'failed';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.razorpayResponseData = req.body;
      await payment.save();
      return res.status(400).json({ success: false, status: 'failed', message: 'Invalid signature. Security verification failed.' });
    }

    // 4. Mark Payment Completed
    payment.status = 'completed';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.razorpayResponseData = req.body;
    await payment.save();

    // 5. Backwards Compatibility: Save Mongoose Donation record
    const donationDesc = payment.paymentType === 'adoption'
      ? `Adoption payment for ${payment.petName}`
      : (payment.petName ? `Donation for Pet: ${payment.petName}` : 'General Donation');

    await Donation.create({
      description: donationDesc,
      amount: payment.amount,
      date: new Date(),
      status: 'completed',
      adopterId: payment.userId,
      adopterName: payment.userName,
      petId: payment.petId,
      petName: payment.petName,
      method: 'card', // Razorpay Checkout default
      applicationId: payment.applicationId,
      paymentReference: razorpayPaymentId
    });

    // 6. ADOPTION PAYMENT WORKFLOW (Set status to payment_completed)
    if (payment.paymentType === 'adoption') {
      const app = await Application.findById(payment.applicationId);
      if (app) {
        // Set status to payment_completed to unlock delivery method selection
        app.status = 'payment_completed';
        app.timeline.push({
          status: 'payment_completed',
          note: 'Payment verified successfully. Please select delivery method.',
          date: new Date()
        });
        await app.save();
      }

      // Don't mark pet as adopted yet - that happens after pickup/delivery
      // await Pet.findByIdAndUpdate(payment.petId, { status: 'adopted' });

      // Don't update reward stats yet - that happens after actual adoption completion
      // Don't send adoption completion notifications yet - that happens after pickup/delivery
      // Just send payment success notification
      const notificationService = getNotificationService();
      if (notificationService && app) {
        try {
          // Socket to shelter
          await notificationService.createNotification({
            recipientId: app.shelterId,
            recipientRole: 'shelter',
            type: 'adoption',
            title: 'Payment Received',
            message: `${app.adopterName} has completed the payment for ${app.petName}. Waiting for delivery method selection.`,
            data: { applicationId: app._id.toString(), petId: app.petId }
          });

          // Socket to adopter
          await notificationService.createNotification({
            recipientId: app.adopterId,
            recipientRole: 'adopter',
            type: 'adoption',
            title: 'Payment Successful',
            message: `Your payment of adoption fee for ${app.petName} has been verified! Please select your delivery method.`,
            data: { applicationId: app._id.toString(), petId: app.petId }
          });
        } catch (notifErr) {
          console.error('[Payment] Failed to send WebSocket notifications:', notifErr);
        }
      }

      // Email payment receipt to adopter
      if (app) {
        try {
          await sendAdoptionStatusEmail(
            app.adopterEmail,
            app.adopterName,
            app.petName,
            app.shelterName,
            'payment_completed',
            'Your adoption fee payment has been verified successfully. Please select your delivery method to proceed.'
          );
        } catch (emailErr) {
          console.error('[Payment] Failed to send payment success email:', emailErr);
        }
      }
    }

    console.log(`[Payment] Transaction ${transactionId} verified successfully. Status: completed.`);
    res.json({ success: true, message: 'Payment verified and completed.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/payments/dashboard/adopter
 * @desc    Get adopter metrics and transaction history
 * @access  Private (Adopter only)
 */
router.get('/dashboard/adopter', async (req, res, next) => {
  try {
    if (req.user.role !== 'adopter') {
      return res.status(403).json({ message: 'Unauthorized access to adopter metrics' });
    }

    const completedPayments = await Payment.find({
      userId: req.user.id,
      status: 'completed'
    }).sort({ timestamp: -1 });

    const totalDonations = completedPayments
      .filter(p => p.paymentType === 'donation')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAdoptionsPaid = completedPayments
      .filter(p => p.paymentType === 'adoption')
      .reduce((sum, p) => sum + p.amount, 0);

    const recentTransactions = completedPayments
      .filter(p => p.paymentType === 'donation')
      .slice(0, 5);

    // Fetch pet images for recent transactions
    const petIds = [...new Set(recentTransactions.map(p => p.petId).filter(Boolean))];
    const pets = await Pet.find({ _id: { $in: petIds } });
    const petMap = new Map(pets.map(p => [p._id.toString(), p.images?.[0] || null]));

    recentTransactions.forEach(tx => {
      if (tx.petId && petMap.has(tx.petId)) {
        tx.petImage = petMap.get(tx.petId);
      }
    });

    const adoptionPayments = await Payment.find({
      userId: req.user.id,
      paymentType: 'adoption'
    }).sort({ timestamp: -1 });

    // Fetch pet images for adoption payments
    const adoptionPetIds = [...new Set(adoptionPayments.map(p => p.petId).filter(Boolean))];
    const adoptionPets = await Pet.find({ _id: { $in: adoptionPetIds } });
    const adoptionPetMap = new Map(adoptionPets.map(p => [p._id.toString(), p.images?.[0] || null]));

    adoptionPayments.forEach(pay => {
      if (pay.petId && adoptionPetMap.has(pay.petId)) {
        pay.petImage = adoptionPetMap.get(pay.petId);
      }
    });

    res.json({
      totalDonations,
      totalAdoptionsPaid,
      recentTransactions,
      adoptionPayments
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/payments/dashboard/shelter
 * @desc    Get shelter metrics and received payments tracking
 * @access  Private (Shelter only)
 */
router.get('/dashboard/shelter', async (req, res, next) => {
  try {
    if (req.user.role !== 'shelter') {
      return res.status(403).json({ message: 'Unauthorized access to shelter metrics' });
    }

    const completedPayments = await Payment.find({
      shelterId: req.user.id,
      status: 'completed'
    }).sort({ timestamp: -1 });

    const receivedDonations = completedPayments
      .filter(p => p.paymentType === 'donation')
      .reduce((sum, p) => sum + p.amount, 0);

    const adoptionRevenue = completedPayments
      .filter(p => p.paymentType === 'adoption')
      .reduce((sum, p) => sum + p.amount, 0);

    const recentPayments = completedPayments.slice(0, 5);

    res.json({
      receivedDonations,
      adoptionRevenue,
      recentPayments
    });
  } catch (error) {
    next(error);
  }
});

export default router;
