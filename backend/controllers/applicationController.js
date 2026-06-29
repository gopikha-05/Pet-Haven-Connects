import Application from '../models/Application.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import RewardStats from '../models/RewardStats.js';
import { sendAdoptionStatusEmail } from '../services/emailService.js';
import { getNotificationService } from './notificationController.js';

/**
 * GET /api/applications
 * Get all applications with optional filters
 */
export const getApplications = async (req, res) => {
  try {
    const { adopterId, shelterId, petId, status } = req.query;
    const query = {};

    // Role-based authorization & filter enforcement
    if (req.user.role === 'adopter') {
      query.adopterId = req.user.id;
    } else if (req.user.role === 'shelter') {
      query.shelterId = req.user.id;
    }

    // Apply explicit query filters if passed and user role allows it
    if (adopterId && (req.user.role === 'admin' || req.user.role === 'shelter')) {
      query.adopterId = adopterId;
    }
    if (shelterId && (req.user.role === 'admin' || req.user.role === 'adopter')) {
      query.shelterId = shelterId;
    }
    if (petId) {
      query.petId = petId;
    }
    if (status) {
      query.status = status;
    }

    const apps = await Application.find(query).sort({ updatedAt: -1 });
    
    // Map _id to id for frontend compatibility and attach paymentStatus
    const formattedApps = await Promise.all(apps.map(async (app) => {
      const a = app.toObject();
      a.id = a._id.toString();
      const latestDonation = await Donation.findOne({ applicationId: a.id }).sort({ date: -1 });
      a.paymentStatus = latestDonation ? latestDonation.status : null;
      return a;
    }));

    res.json(formattedApps);
  } catch (error) {
    console.error('[ApplicationController] Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

/**
 * GET /api/applications/:id
 * Get a single application by ID
 */
export const getApplicationById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization checks
    if (req.user.role === 'adopter' && app.adopterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }
    if (req.user.role === 'shelter' && app.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    const latestDonation = await Donation.findOne({ applicationId: formattedApp.id }).sort({ date: -1 });
    formattedApp.paymentStatus = latestDonation ? latestDonation.status : null;
    res.json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
};

/**
 * POST /api/applications
 * Submit a new adoption application (Adopter only)
 */
export const createApplication = async (req, res) => {
  try {
    if (req.user.role !== 'adopter') {
      return res.status(403).json({ message: 'Only adopters can submit adoption applications' });
    }

    const { 
      petId, 
      notes, 
      fullName, 
      age, 
      phone, 
      email, 
      address, 
      occupation, 
      previousPetExperience, 
      experienceExplanation, 
      homeType, 
      hasYard, 
      existingPets, 
      familyMemberCount, 
      dailyAvailability, 
      financialReadiness, 
      vetReference, 
      homeImage 
    } = req.body;
    
    if (!petId) {
      return res.status(400).json({ message: 'Pet ID is required' });
    }

    // Verify pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    if (pet.status !== 'available') {
      return res.status(400).json({ message: 'Pet is no longer available for adoption' });
    }

    // Check if adopter already has a pending application for this pet
    const existingApp = await Application.findOne({
      petId,
      adopterId: req.user.id,
      status: { $in: ['pending', 'approved', 'payment_pending', 'payment_completed', 'pickup_scheduled', 'out_for_delivery'] }
    });
    if (existingApp) {
      return res.status(400).json({ message: 'You already have an active application for this pet' });
    }

    // Fetch adopter email from User details
    const adopterUser = await User.findById(req.user.id);
    if (!adopterUser) {
      return res.status(404).json({ message: 'Adopter profile not found' });
    }

    const appData = {
      petId,
      petName: pet.name,
      adopterId: req.user.id,
      adopterName: req.user.name,
      adopterEmail: adopterUser.email,
      shelterId: pet.shelterId,
      shelterName: pet.shelterName,
      status: 'pending',
      notes: notes || '',
      reason: notes || '',
      fullName: fullName || req.user.name,
      age: age ? Number(age) : undefined,
      phone: phone || '',
      email: email || adopterUser.email,
      address: address || '',
      occupation: occupation || '',
      previousPetExperience: previousPetExperience || '',
      experienceExplanation: experienceExplanation || '',
      homeType: homeType || 'apartment',
      hasYard: hasYard === true || hasYard === 'true',
      existingPets: existingPets || '',
      familyMemberCount: familyMemberCount ? Number(familyMemberCount) : undefined,
      dailyAvailability: dailyAvailability || '',
      financialReadiness: financialReadiness || '',
      vetReference: vetReference || '',
      homeImage: homeImage || '',
      timeline: [
        {
          status: 'application_submitted',
          note: 'Application submitted successfully',
          date: new Date()
        }
      ]
    };

    const app = await Application.create(appData);

    // Update pet status to pending (optional, depending on business rules, usually kept available until approved/paid)
    // pet.status = 'pending';
    // await pet.save();

    // Trigger Socket.io & DB notifications to shelter and admin
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.notifyShelterOnApplication(
          pet.shelterId,
          req.user.id,
          req.user.name,
          pet.name,
          app._id.toString()
        );
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to send WebSocket notification:', notifErr);
      }
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    res.status(201).json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error creating application:', error);
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};

/**
 * PUT /api/applications/:id/status
 * Update application status (Shelter for approved/rejected, Adopter for completed/paid)
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization validation:
    // - Shelter or admin can approve/reject
    // - Adopter can mark completed (when payment finishes)
    if (status === 'completed') {
      if (req.user.role !== 'adopter' || app.adopterId !== req.user.id) {
        return res.status(403).json({ message: 'Only the adopter can mark application as completed' });
      }
    } else {
      if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only shelter staff or admin can update status' });
      }
      if (req.user.role === 'shelter' && app.shelterId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to manage this application' });
      }
    }

    app.status = status;
    app.timeline.push({
      status,
      note: note || `Application status updated to ${status}`,
      date: new Date()
    });

    // If approving, set status to payment_pending instead of approved
    if (status === 'approved') {
      app.status = 'payment_pending';
      app.timeline[app.timeline.length - 1].status = 'payment_pending';
      app.timeline[app.timeline.length - 1].note = note || 'Application approved. Awaiting payment.';
      // Add shelter reviewed step before approval
      app.timeline.splice(app.timeline.length - 1, 0, {
        status: 'shelter_reviewed',
        note: 'Application reviewed by shelter',
        date: new Date()
      });
    }

    await app.save();

    const notificationService = getNotificationService();

    // Trigger status update workflows:
    if (status === 'approved' || status === 'payment_pending') {
      // 1. Send live socket notification to Adopter
      if (notificationService) {
        try {
          await notificationService.notifyAdopterOnStatusUpdate(
            app.adopterId,
            app.shelterName,
            app.petName,
            app.status,
            app._id.toString()
          );
        } catch (notifErr) {
          console.error('[ApplicationController] Failed to send adopter WebSocket update:', notifErr);
        }
      }

      // 2. Dispatch email to Adopter
      try {
        await sendAdoptionStatusEmail(
          app.adopterEmail,
          app.adopterName,
          app.petName,
          app.shelterName,
          app.status,
          note || 'Your application has been approved. Please complete the payment to continue.'
        );
      } catch (emailErr) {
        console.error('[ApplicationController] Failed to send status email:', emailErr);
      }
    }

    if (status === 'completed') {
      // 1. Update Pet Status to Adopted in MongoDB
      try {
        await Pet.findByIdAndUpdate(app.petId, { status: 'adopted' });
      } catch (petErr) {
        console.error('[ApplicationController] Failed to update pet status to adopted:', petErr);
      }

      // 1b. Create Mongoose Donation document to persist the transaction
      try {
        const petInfo = await Pet.findById(app.petId);
        await Donation.create({
          description: `Adoption payment for ${app.petName}`,
          amount: petInfo?.adoptionFee || 5000,
          adopterId: app.adopterId,
          adopterName: app.adopterName,
          petId: app.petId,
          petName: app.petName,
          method: 'card',
          date: new Date(),
          status: 'completed'
        });
        console.log('[ApplicationController] Successfully persisted adoption transaction in DB');
      } catch (transErr) {
        console.error('[ApplicationController] Failed to save transaction record:', transErr);
      }

      // 1c. Update reward stats for adoption completion
      try {
        let rewardStats = await RewardStats.findOne({ userId: app.adopterId });
        if (!rewardStats) {
          rewardStats = await RewardStats.create({
            userId: app.adopterId,
            badges: [
              { badgeId: 'first_paw', unlocked: false, unlockedAt: null },
              { badgeId: 'pet_parent', unlocked: false, unlockedAt: null },
              { badgeId: 'animal_hero', unlocked: false, unlockedAt: null },
              { badgeId: 'kind_heart', unlocked: false, unlockedAt: null },
              { badgeId: 'shelter_supporter', unlocked: false, unlockedAt: null },
              { badgeId: 'pet_lover', unlocked: false, unlockedAt: null },
              { badgeId: 'explorer', unlocked: false, unlockedAt: null },
              { badgeId: 'care_champion', unlocked: false, unlockedAt: null }
            ]
          });
        }
        rewardStats.petsAdopted += 1;
        rewardStats.rewardPoints += 100;
        
        // Check and unlock adoption badges
        const adoptionBadges = [
          { id: 'first_paw', condition: rewardStats.petsAdopted >= 1, points: 100 },
          { id: 'pet_parent', condition: rewardStats.petsAdopted >= 2, points: 200 },
          { id: 'animal_hero', condition: rewardStats.petsAdopted >= 5, points: 500 }
        ];
        
        for (const badge of adoptionBadges) {
          const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
          if (!userBadge.unlocked && badge.condition) {
            userBadge.unlocked = true;
            userBadge.unlockedAt = new Date();
            rewardStats.rewardPoints += badge.points;
          }
        }
        
        await rewardStats.save();
        console.log('[ApplicationController] Updated reward stats for adoption completion');
      } catch (rewardErr) {
        console.error('[ApplicationController] Failed to update reward stats:', rewardErr);
      }

      // 2. Send socket notification to Shelter
      if (notificationService) {
        try {
          await notificationService.createNotification({
            recipientId: app.shelterId,
            recipientRole: 'shelter',
            type: 'adoption',
            title: 'Adoption Finalized',
            message: `${app.adopterName} has completed the payment for ${app.petName}!`,
            data: { applicationId: app._id.toString(), petId: app.petId }
          });
        } catch (notifErr) {
          console.error('[ApplicationController] Failed to notify shelter on complete:', notifErr);
        }
      }

      // 3. Dispatch final congratulations email to Adopter
      try {
        await sendAdoptionStatusEmail(
          app.adopterEmail,
          app.adopterName,
          app.petName,
          app.shelterName,
          'completed',
          'Congratulations! Your adoption fee has been paid, and the adoption is complete.'
        );
      } catch (emailErr) {
        console.error('[ApplicationController] Failed to send final email:', emailErr);
      }
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    res.json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error updating application status:', error);
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
};

/**
 * PUT /api/applications/:id/delivery-method
 * Set delivery method after payment (Adopter only)
 */
export const setDeliveryMethod = async (req, res) => {
  try {
    const { deliveryMethod, scheduledPickupDate, scheduledPickupTime, deliveryAddress, scheduledDeliveryDate } = req.body;
    
    if (!deliveryMethod || !['take_away', 'door_delivery'].includes(deliveryMethod)) {
      return res.status(400).json({ message: 'Valid delivery method is required' });
    }

    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only adopter can set delivery method
    if (req.user.role !== 'adopter' || app.adopterId !== req.user.id) {
      return res.status(403).json({ message: 'Only the adopter can set delivery method' });
    }

    // Application must be payment_completed (payment must be done first)
    const allowedStatuses = ['payment_completed'];
    if (!allowedStatuses.includes(app.status)) {
      if (app.status === 'completed') {
        return res.status(400).json({ message: 'Adoption already completed' });
      }
      if (app.status === 'payment_pending') {
        return res.status(400).json({ message: 'Payment must be completed before selecting delivery method' });
      }
      if (app.status === 'pickup_scheduled' || app.status === 'out_for_delivery') {
        return res.status(400).json({ message: 'Delivery method already selected' });
      }
      return res.status(400).json({ message: `Application must have payment completed before setting delivery method. Current status: ${app.status}` });
    }

    app.deliveryMethod = deliveryMethod;
    
    if (deliveryMethod === 'take_away') {
      app.scheduledPickupDate = scheduledPickupDate ? new Date(scheduledPickupDate) : null;
      app.scheduledPickupTime = scheduledPickupTime || null;
      app.status = 'pickup_scheduled';
      app.timeline.push({
        status: 'pickup_scheduled',
        note: 'Pickup scheduled. Waiting for shelter confirmation.',
        date: new Date()
      });
      app.timeline.push({
        status: 'pet_ready_for_pickup',
        note: 'Pet is ready for pickup at the shelter.',
        date: new Date()
      });
    } else if (deliveryMethod === 'door_delivery') {
      app.deliveryAddress = deliveryAddress || app.address;
      app.scheduledDeliveryDate = scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : null;
      app.status = 'out_for_delivery';
      app.timeline.push({
        status: 'delivery_scheduled',
        note: 'Delivery scheduled. Pet will be handed to delivery partner.',
        date: new Date()
      });
      app.timeline.push({
        status: 'pet_handed_to_delivery',
        note: 'Pet handed to delivery partner.',
        date: new Date()
      });
      app.timeline.push({
        status: 'out_for_delivery',
        note: 'Pet is out for delivery.',
        date: new Date()
      });
    }

    await app.save();

    // Notify shelter about delivery method selection
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: app.shelterId,
          recipientRole: 'shelter',
          type: 'adoption',
          title: 'Delivery Method Selected',
          message: `${app.adopterName} has selected ${deliveryMethod === 'take_away' ? 'Take Away (Pickup)' : 'Door Delivery'} for ${app.petName}`,
          data: { applicationId: app._id.toString(), petId: app.petId }
        });
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to notify shelter about delivery method:', notifErr);
      }
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    res.json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error setting delivery method:', error);
    res.status(500).json({ message: 'Error setting delivery method', error: error.message });
  }
};

/**
 * PUT /api/applications/:id/mark-picked-up
 * Mark adoption as picked up (Shelter only)
 */
export const markAsPickedUp = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only shelter can mark as picked up
    if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only shelter staff can mark as picked up' });
    }
    if (req.user.role === 'shelter' && app.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage this application' });
    }

    // Must be pickup_scheduled
    if (app.status !== 'pickup_scheduled') {
      if (app.status === 'completed') {
        return res.status(400).json({ message: 'Adoption already completed' });
      }
      return res.status(400).json({ message: `Application must be pickup scheduled. Current status: ${app.status}` });
    }

    // Update status and set adoption completion date
    app.status = 'completed';
    app.adoptionCompletionDate = new Date();
    
    app.timeline.push({
      status: 'picked_up_by_adopter',
      note: 'Pet picked up by adopter.',
      date: new Date()
    });
    
    app.timeline.push({
      status: 'completed',
      note: 'Adoption completed successfully.',
      date: new Date()
    });

    await app.save();

    // Update pet status to adopted
    await Pet.findByIdAndUpdate(app.petId, { status: 'adopted' });

    // Update reward stats for adoption completion
    try {
      let rewardStats = await RewardStats.findOne({ userId: app.adopterId });
      if (!rewardStats) {
        rewardStats = await RewardStats.create({
          userId: app.adopterId,
          badges: [
            { badgeId: 'first_paw', unlocked: false, unlockedAt: null },
            { badgeId: 'pet_parent', unlocked: false, unlockedAt: null },
            { badgeId: 'animal_hero', unlocked: false, unlockedAt: null },
            { badgeId: 'kind_heart', unlocked: false, unlockedAt: null },
            { badgeId: 'shelter_supporter', unlocked: false, unlockedAt: null },
            { badgeId: 'pet_lover', unlocked: false, unlockedAt: null },
            { badgeId: 'explorer', unlocked: false, unlockedAt: null },
            { badgeId: 'care_champion', unlocked: false, unlockedAt: null }
          ]
        });
      }
      rewardStats.petsAdopted += 1;
      rewardStats.rewardPoints += 100;
      
      // Check and unlock adoption badges
      const adoptionBadges = [
        { id: 'first_paw', condition: rewardStats.petsAdopted >= 1, points: 100 },
        { id: 'pet_parent', condition: rewardStats.petsAdopted >= 2, points: 200 },
        { id: 'animal_hero', condition: rewardStats.petsAdopted >= 5, points: 500 }
      ];
      
      for (const badge of adoptionBadges) {
        const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
        if (!userBadge.unlocked && badge.condition) {
          userBadge.unlocked = true;
          userBadge.unlockedAt = new Date();
          rewardStats.rewardPoints += badge.points;
        }
      }
      
      await rewardStats.save();
      console.log('[ApplicationController] Updated reward stats for adoption completion');
    } catch (rewardErr) {
      console.error('[ApplicationController] Failed to update reward stats:', rewardErr);
    }

    // Notify adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: app.adopterId,
          recipientRole: 'adopter',
          type: 'adoption',
          title: 'Adoption Completed',
          message: `Your adoption of ${app.petName} has been successfully completed!`,
          data: { applicationId: app._id.toString(), petId: app.petId }
        });
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to notify adopter about pickup:', notifErr);
      }
    }

    // Send email to adopter
    try {
      await sendAdoptionStatusEmail(
        app.adopterEmail,
        app.adopterName,
        app.petName,
        app.shelterName,
        'completed',
        'Congratulations! Your adoption has been successfully completed. The pet has been picked up.'
      );
    } catch (emailErr) {
      console.error('[ApplicationController] Failed to send pickup completion email:', emailErr);
    }

    // Notify shelter
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: app.shelterId,
          recipientRole: 'shelter',
          type: 'adoption',
          title: 'Pickup Completed',
          message: `${app.adopterName} has picked up ${app.petName}. Adoption completed.`,
          data: { applicationId: app._id.toString(), petId: app.petId }
        });
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to notify shelter about pickup completion:', notifErr);
      }
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    res.json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error marking as picked up:', error);
    res.status(500).json({ message: 'Error marking as picked up', error: error.message });
  }
};

/**
 * PUT /api/applications/:id/mark-delivered
 * Mark adoption as delivered (Shelter only)
 */
export const markAsDelivered = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only shelter can mark as delivered
    if (req.user.role !== 'shelter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only shelter staff can mark as delivered' });
    }
    if (req.user.role === 'shelter' && app.shelterId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage this application' });
    }

    // Must be out_for_delivery
    if (app.status !== 'out_for_delivery') {
      if (app.status === 'completed') {
        return res.status(400).json({ message: 'Adoption already completed' });
      }
      return res.status(400).json({ message: `Application must be out for delivery. Current status: ${app.status}` });
    }

    // Update status and set adoption completion date
    app.status = 'completed';
    app.adoptionCompletionDate = new Date();
    
    app.timeline.push({
      status: 'delivered_successfully',
      note: 'Pet delivered successfully to adopter.',
      date: new Date()
    });
    
    app.timeline.push({
      status: 'completed',
      note: 'Adoption completed successfully.',
      date: new Date()
    });

    await app.save();

    // Update pet status to adopted
    await Pet.findByIdAndUpdate(app.petId, { status: 'adopted' });

    // Update reward stats for adoption completion
    try {
      let rewardStats = await RewardStats.findOne({ userId: app.adopterId });
      if (!rewardStats) {
        rewardStats = await RewardStats.create({
          userId: app.adopterId,
          badges: [
            { badgeId: 'first_paw', unlocked: false, unlockedAt: null },
            { badgeId: 'pet_parent', unlocked: false, unlockedAt: null },
            { badgeId: 'animal_hero', unlocked: false, unlockedAt: null },
            { badgeId: 'kind_heart', unlocked: false, unlockedAt: null },
            { badgeId: 'shelter_supporter', unlocked: false, unlockedAt: null },
            { badgeId: 'pet_lover', unlocked: false, unlockedAt: null },
            { badgeId: 'explorer', unlocked: false, unlockedAt: null },
            { badgeId: 'care_champion', unlocked: false, unlockedAt: null }
          ]
        });
      }
      rewardStats.petsAdopted += 1;
      rewardStats.rewardPoints += 100;
      
      // Check and unlock adoption badges
      const adoptionBadges = [
        { id: 'first_paw', condition: rewardStats.petsAdopted >= 1, points: 100 },
        { id: 'pet_parent', condition: rewardStats.petsAdopted >= 2, points: 200 },
        { id: 'animal_hero', condition: rewardStats.petsAdopted >= 5, points: 500 }
      ];
      
      for (const badge of adoptionBadges) {
        const userBadge = rewardStats.badges.find(b => b.badgeId === badge.id);
        if (!userBadge.unlocked && badge.condition) {
          userBadge.unlocked = true;
          userBadge.unlockedAt = new Date();
          rewardStats.rewardPoints += badge.points;
        }
      }
      
      await rewardStats.save();
      console.log('[ApplicationController] Updated reward stats for adoption completion');
    } catch (rewardErr) {
      console.error('[ApplicationController] Failed to update reward stats:', rewardErr);
    }

    // Notify adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: app.adopterId,
          recipientRole: 'adopter',
          type: 'adoption',
          title: 'Adoption Completed',
          message: `Your adoption of ${app.petName} has been successfully completed! The pet has been delivered.`,
          data: { applicationId: app._id.toString(), petId: app.petId }
        });
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to notify adopter about delivery:', notifErr);
      }
    }

    // Send email to adopter
    try {
      await sendAdoptionStatusEmail(
        app.adopterEmail,
        app.adopterName,
        app.petName,
        app.shelterName,
        'completed',
        'Congratulations! Your adoption has been successfully completed. The pet has been delivered to your address.'
      );
    } catch (emailErr) {
      console.error('[ApplicationController] Failed to send delivery completion email:', emailErr);
    }

    // Notify shelter
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: app.shelterId,
          recipientRole: 'shelter',
          type: 'adoption',
          title: 'Delivery Completed',
          message: `${app.petName} has been successfully delivered to ${app.adopterName}. Adoption completed.`,
          data: { applicationId: app._id.toString(), petId: app.petId }
        });
      } catch (notifErr) {
        console.error('[ApplicationController] Failed to notify shelter about delivery completion:', notifErr);
      }
    }

    const formattedApp = app.toObject();
    formattedApp.id = formattedApp._id.toString();
    res.json(formattedApp);
  } catch (error) {
    console.error('[ApplicationController] Error marking as delivered:', error);
    res.status(500).json({ message: 'Error marking as delivered', error: error.message });
  }
};
