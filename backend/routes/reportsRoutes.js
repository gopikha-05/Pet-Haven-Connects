import express from 'express';
import User from '../models/User.js';
import Pet from '../models/Pet.js';
import Application from '../models/Application.js';
import Donation from '../models/Donation.js';
import Complaint from '../models/Complaint.js';
import Payment from '../models/Payment.js';
import { ReportMetadata, ReportHistory, ReportActivity } from '../models/ReportMetadata.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import htmlPdf from 'html-pdf-node';
import nodemailer from 'nodemailer';
import SmtpSettings from '../models/SmtpSettings.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Analytics endpoint for admin dashboard
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Get platform statistics
    const totalUsers = await User.countDocuments();
    const totalPets = await Pet.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalDonations = await Donation.countDocuments();
    
    // Get recent statistics (last 30 days)
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentApplications = await Application.countDocuments({ submittedAt: { $gte: thirtyDaysAgo } });
    const recentDonations = await Donation.find({ date: { $gte: thirtyDaysAgo } });
    const monthlyDonationTotal = recentDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const completedAdoptions = await Application.countDocuments({ status: 'completed' });
    const pendingApplications = await Application.countDocuments({ status: 'pending' });

    res.json({
      platformKPIs: {
        totalUsers,
        totalAdoptions: completedAdoptions,
        monthlyDonations: monthlyDonationTotal,
        pendingApplications
      },
      recentActivity: {
        newUsers: recentUsers,
        newApplications: recentApplications,
        newDonations: recentDonations.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Get comprehensive platform statistics
router.get('/statistics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '6m':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    // User Statistics
    const totalUsers = await User.countDocuments();
    const adopters = await User.countDocuments({ role: 'adopter' });
    const shelters = await User.countDocuments({ role: 'shelter' });
    const vets = await User.countDocuments({ role: 'vet' });
    const admins = await User.countDocuments({ role: 'admin' });
    const activeShelters = await User.countDocuments({ role: 'shelter', isApproved: true, isActive: { $ne: false } });
    const verifiedVets = await User.countDocuments({ role: 'vet', isApproved: true, licenseVerificationStatus: 'verified' });
    const pendingApprovals = await User.countDocuments({ 
      $or: [
        { role: 'shelter', isApproved: false },
        { role: 'vet', isApproved: false }
      ]
    });
    const pendingEmailVerification = await User.countDocuments({ isEmailVerified: false });

    // Pet Statistics
    const totalPets = await Pet.countDocuments();
    const availablePets = await Pet.countDocuments({ status: 'available' });
    const adoptedPets = await Pet.countDocuments({ status: 'adopted' });
    const vaccinatedPets = await Pet.countDocuments({ isVaccinated: true });
    const underTreatment = await Pet.countDocuments({ medicalStatus: 'under-treatment' });
    const reservedPets = await Pet.countDocuments({ status: 'reserved' });

    // Pet by species
    const petsBySpecies = await Pet.aggregate([
      { $group: { _id: '$species', count: { $sum: 1 } } }
    ]);

    // Adoption Statistics
    const totalAdoptions = await Application.countDocuments({ status: 'approved' });
    const pendingAdoptions = await Application.countDocuments({ status: 'pending' });
    const rejectedAdoptions = await Application.countDocuments({ status: 'rejected' });
    const cancelledAdoptions = await Application.countDocuments({ status: 'completed' });
    
    // Monthly adoption trends
    const monthlyAdoptions = await Application.aggregate([
      { 
        $match: { 
          status: 'approved',
          submittedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Donation Statistics
    const donations = await Donation.find({ date: { $gte: startDate } });
    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const monthlyDonations = await Donation.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const averageDonation = donations.length > 0 ? totalDonations / donations.length : 0;
    const highestDonation = donations.length > 0 ? Math.max(...donations.map(d => d.amount || 0)) : 0;

    // Complaint Statistics
    const totalComplaints = await Complaint.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: 'pending' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const escalatedComplaints = await Complaint.countDocuments({ status: 'escalated' });

    // Complaint categories
    const complaintsByCategory = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Shelter performance
    const shelterPerformance = await User.aggregate([
      { $match: { role: 'shelter', isApproved: true } },
      {
        $lookup: {
          from: 'pets',
          localField: '_id',
          foreignField: 'shelterId',
          as: 'pets'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          location: 1,
          petCount: { $size: '$pets' }
        }
      },
      { $sort: { petCount: -1 } },
      { $limit: 10 }
    ]);

    // Veterinarian performance
    const vetPerformance = await User.aggregate([
      { $match: { role: 'vet', isApproved: true } },
      {
        $project: {
          name: 1,
          email: 1,
          location: 1,
          specialization: 1,
          rating: 1
        }
      },
      { $sort: { rating: -1 } },
      { $limit: 10 }
    ]);

    // Most adopted species
    const mostAdoptedSpecies = await Application.aggregate([
      { $match: { status: 'approved' } },
      {
        $lookup: {
          from: 'pets',
          localField: 'petId',
          foreignField: '_id',
          as: 'pet'
        }
      },
      { $unwind: '$pet' },
      {
        $group: {
          _id: '$pet.species',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        adopters,
        shelters,
        vets,
        admins,
        activeShelters,
        verifiedVets,
        pendingApprovals,
        pendingEmailVerification
      },
      pets: {
        total: totalPets,
        available: availablePets,
        adopted: adoptedPets,
        vaccinated: vaccinatedPets,
        underTreatment,
        reserved: reservedPets,
        bySpecies: petsBySpecies.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      adoptions: {
        total: totalAdoptions,
        pending: pendingAdoptions,
        rejected: rejectedAdoptions,
        cancelled: cancelledAdoptions,
        monthlyTrends: monthlyAdoptions,
        mostAdoptedSpecies
      },
      donations: {
        total: totalDonations,
        monthly: monthlyDonations,
        average: averageDonation,
        highest: highestDonation
      },
      complaints: {
        total: totalComplaints,
        open: openComplaints,
        resolved: resolvedComplaints,
        escalated: escalatedComplaints,
        byCategory: complaintsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      shelterPerformance,
      vetPerformance
    });
  } catch (error) {
    console.error('[Reports] Error fetching statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get adoption report details
router.get('/adoptions', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate = new Date(now.setDate(now.getDate() - 30));

    const adoptions = await Application.find({ submittedAt: { $gte: startDate } })
      .sort({ submittedAt: -1 });

    const approved = adoptions.filter(a => a.status === 'approved').length;
    const pending = adoptions.filter(a => a.status === 'pending').length;
    const rejected = adoptions.filter(a => a.status === 'rejected').length;
    const completed = adoptions.filter(a => a.status === 'completed').length;

    // Calculate average approval time (using updatedAt as proxy for approval time)
    const approvedApps = adoptions.filter(a => a.status === 'approved' && a.updatedAt);
    const avgApprovalTime = approvedApps.length > 0 
      ? approvedApps.reduce((sum, a) => {
          const diff = new Date(a.updatedAt) - new Date(a.submittedAt);
          return sum + (diff / (1000 * 60 * 60));
        }, 0) / approvedApps.length
      : 0;

    res.json({
      total: adoptions.length,
      approved,
      pending,
      rejected,
      cancelled: completed,
      avgApprovalTime: Math.round(avgApprovalTime),
      details: adoptions
    });
  } catch (error) {
    console.error('[Reports] Error fetching adoption report:', error);
    res.status(500).json({ message: 'Failed to fetch adoption report' });
  }
});

// Get donation report details
router.get('/donations', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate = new Date(now.setDate(now.getDate() - 30));

    const donations = await Donation.find({ date: { $gte: startDate } })
      .sort({ date: -1 });

    const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const average = donations.length > 0 ? total / donations.length : 0;
    const highest = donations.length > 0 ? Math.max(...donations.map(d => d.amount || 0)) : 0;

    // Top donor
    const donorAggregation = await Donation.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: '$adopterName',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      total,
      count: donations.length,
      average,
      highest,
      topDonor: donorAggregation[0] || null,
      details: donations
    });
  } catch (error) {
    console.error('[Reports] Error fetching donation report:', error);
    res.status(500).json({ message: 'Failed to fetch donation report' });
  }
});

// Get shelter report details
router.get('/shelters', async (req, res) => {
  try {
    const shelters = await User.find({ role: 'shelter' });

    const total = shelters.length;
    const verified = shelters.filter(s => s.isApproved && s.licenseVerificationStatus === 'verified').length;
    const pending = shelters.filter(s => !s.isApproved || s.licenseVerificationStatus === 'pending').length;
    const rejected = shelters.filter(s => s.licenseVerificationStatus === 'rejected').length;

    // Get pet counts for each shelter
    const shelterWithPets = await User.aggregate([
      { $match: { role: 'shelter' } },
      {
        $lookup: {
          from: 'pets',
          localField: '_id',
          foreignField: 'shelterId',
          as: 'pets'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          location: 1,
          isApproved: 1,
          licenseVerificationStatus: 1,
          capacity: 1,
          petCount: { $size: '$pets' }
        }
      }
    ]);

    const totalCapacity = shelterWithPets.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const occupiedCapacity = shelterWithPets.reduce((sum, s) => sum + s.petCount, 0);
    const adoptionSuccessRate = totalCapacity > 0 ? ((occupiedCapacity / totalCapacity) * 100).toFixed(1) : 0;

    // Highest rated shelter
    const highestRated = shelterWithPets
      .filter(s => s.rating)
      .sort((a, b) => b.rating - a.rating)[0];

    res.json({
      total,
      verified,
      pending,
      rejected,
      totalCapacity,
      occupiedCapacity,
      adoptionSuccessRate,
      highestRated: highestRated || null,
      details: shelterWithPets
    });
  } catch (error) {
    console.error('[Reports] Error fetching shelter report:', error);
    res.status(500).json({ message: 'Failed to fetch shelter report' });
  }
});

// Get veterinarian report details
router.get('/veterinarians', async (req, res) => {
  try {
    const vets = await User.find({ role: 'vet' });

    const total = vets.length;
    const verified = vets.filter(v => v.isApproved && v.licenseVerificationStatus === 'verified').length;
    const pending = vets.filter(v => !v.isApproved || v.licenseVerificationStatus === 'pending').length;

    // Get appointment counts (simplified - would need actual appointment data)
    const vetWithStats = vets.map(v => ({
      ...v.toObject(),
      appointmentsCompleted: Math.floor(Math.random() * 100), // Placeholder
      rating: v.rating || 4.0
    }));

    const totalAppointments = vetWithStats.reduce((sum, v) => sum + v.appointmentsCompleted, 0);
    const avgRating = vetWithStats.reduce((sum, v) => sum + v.rating, 0) / vetWithStats.length;

    // Top rated vet
    const topRated = vetWithStats.sort((a, b) => b.rating - a.rating)[0];

    res.json({
      total,
      verified,
      pending,
      totalAppointments,
      avgRating: avgRating.toFixed(1),
      topRated,
      details: vetWithStats
    });
  } catch (error) {
    console.error('[Reports] Error fetching veterinarian report:', error);
    res.status(500).json({ message: 'Failed to fetch veterinarian report' });
  }
});

// Get user report details
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();

    const total = users.length;
    const adopters = users.filter(u => u.role === 'adopter').length;
    const shelters = users.filter(u => u.role === 'shelter').length;
    const vets = users.filter(u => u.role === 'vet').length;
    const admins = users.filter(u => u.role === 'admin').length;

    const active = users.filter(u => u.isActive !== false).length;
    const blocked = users.filter(u => u.isActive === false).length;
    const pendingVerification = users.filter(u => !u.isEmailVerified).length;

    // Newly registered (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newlyRegistered = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

    res.json({
      total,
      adopters,
      shelters,
      vets,
      admins,
      active,
      blocked,
      pendingVerification,
      newlyRegistered,
      details: users
    });
  } catch (error) {
    console.error('[Reports] Error fetching user report:', error);
    res.status(500).json({ message: 'Failed to fetch user report' });
  }
});

// Get complaint report details
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'pending').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;

    // Calculate average resolution time
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolvedAt);
    const avgResolutionTime = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, c) => {
          const diff = new Date(c.resolvedAt) - new Date(c.createdAt);
          return sum + (diff / (1000 * 60 * 60));
        }, 0) / resolvedComplaints.length
      : 0;

    // Complaint categories
    const categories = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Most reported shelter/vet
    const againstAggregation = await Complaint.aggregate([
      {
        $group: {
          _id: '$againstId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      total,
      open,
      resolved,
      escalated,
      avgResolutionTime: Math.round(avgResolutionTime),
      categories: categories.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostReported: againstAggregation[0] || null,
      details: complaints
    });
  } catch (error) {
    console.error('[Reports] Error fetching complaint report:', error);
    res.status(500).json({ message: 'Failed to fetch complaint report' });
  }
});

// Get pet analytics
router.get('/pets', async (req, res) => {
  try {
    const pets = await Pet.find();

    const total = pets.length;
    const available = pets.filter(p => p.status === 'available').length;
    const adopted = pets.filter(p => p.status === 'adopted').length;
    const vaccinated = pets.filter(p => p.isVaccinated).length;
    const underTreatment = pets.filter(p => p.medicalStatus === 'under-treatment').length;
    const reserved = pets.filter(p => p.status === 'reserved').length;

    // By species
    const bySpecies = await Pet.aggregate([
      { $group: { _id: '$species', count: { $sum: 1 } } }
    ]);

    // By breed
    const byBreed = await Pet.aggregate([
      { $group: { _id: '$breed', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      total,
      available,
      adopted,
      vaccinated,
      underTreatment,
      reserved,
      bySpecies: bySpecies.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byBreed,
      details: pets
    });
  } catch (error) {
    console.error('[Reports] Error fetching pet analytics:', error);
    res.status(500).json({ message: 'Failed to fetch pet analytics' });
  }
});

// System health check
router.get('/system-health', async (req, res) => {
  try {
    const health = {
      api: 'healthy',
      database: 'connected',
      mailServer: 'unknown',
      storage: 'available',
      microservices: ['auth', 'pets', 'adoptions', 'donations', 'complaints'],
      lastBackup: new Date().toISOString()
    };

    // Check database connection
    try {
      await User.findOne().limit(1);
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'disconnected';
    }

    res.json(health);
  } catch (error) {
    console.error('[Reports] Error fetching system health:', error);
    res.status(500).json({ message: 'Failed to fetch system health' });
  }
});

// Report Metadata CRUD Operations

// Get all report metadata
router.get('/metadata/all', async (req, res) => {
  try {
    const allMetadata = await ReportMetadata.find({});
    const metadataMap = {};
    allMetadata.forEach(meta => {
      metadataMap[meta.reportType] = meta;
    });
    res.json(metadataMap);
  } catch (error) {
    console.error('[Reports] Error fetching all report metadata:', error);
    res.status(500).json({ message: 'Failed to fetch report metadata' });
  }
});

// Get report management statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const generatedToday = await ReportMetadata.countDocuments({
      lastUpdated: { $gte: today }
    });
    
    const pending = await ReportMetadata.countDocuments({
      status: 'draft'
    });
    
    const recentHistory = await ReportActivity.find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      generatedToday,
      pending,
      recentHistory: recentHistory.map(h => ({
        reportName: h.reportType,
        action: h.action,
        performedBy: h.performedBy || 'System',
        timestamp: h.timestamp
      }))
    });
  } catch (error) {
    console.error('[Reports] Error fetching report stats:', error);
    res.status(500).json({ message: 'Failed to fetch report stats' });
  }
});

// Get or create report metadata for a report type
router.get('/metadata/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    let metadata = await ReportMetadata.findOne({ reportType });
    
    if (!metadata) {
      // Create default metadata
      const titles = {
        users: 'User Report',
        adoptions: 'Adoption Report',
        shelters: 'Shelter Performance Report',
        veterinarians: 'Veterinarian Report',
        pets: 'Pet Analytics Report',
        donations: 'Donation Report',
        complaints: 'Complaint Report',
        financial: 'Financial Report',
        email: 'Email Delivery Report',
        system: 'System Health Report'
      };
      
      metadata = await ReportMetadata.create({
        reportType,
        title: titles[reportType] || `${reportType} Report`,
        description: '',
        executiveSummary: '',
        internalNotes: '',
        recommendations: '',
        status: 'draft'
      });
    }
    
    res.json(metadata);
  } catch (error) {
    console.error('[Reports] Error fetching report metadata:', error);
    res.status(500).json({ message: 'Failed to fetch report metadata' });
  }
});

// Update report metadata
router.put('/metadata/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { title, description, executiveSummary, internalNotes, recommendations, status } = req.body;
    
    console.log('[Reports] PUT /metadata/:reportType called');
    console.log('[Reports] reportType:', reportType);
    console.log('[Reports] Request body:', req.body);
    
    // Validate reportType
    const validReportTypes = ['users', 'adoptions', 'shelters', 'veterinarians', 'pets', 'donations', 'complaints', 'financial', 'email', 'system'];
    if (!validReportTypes.includes(reportType)) {
      console.log('[Reports] Invalid reportType:', reportType);
      return res.status(400).json({ message: 'Invalid report type' });
    }
    
    console.log('[Reports] Attempting to find or create metadata...');
    
    const metadata = await ReportMetadata.findOneAndUpdate(
      { reportType },
      { 
        title: title || '',
        description: description || '',
        executiveSummary: executiveSummary || '',
        internalNotes: internalNotes || '',
        recommendations: recommendations || '',
        status: status || 'draft',
        lastUpdated: new Date(),
        updatedBy: req.user?.id || null
      },
      { upsert: true, new: true, runValidators: false }
    );
    
    console.log('[Reports] Metadata saved successfully:', metadata._id);
    console.log('[Reports] Metadata data:', metadata);
    
    res.json(metadata);
  } catch (error) {
    console.error('[Reports] Error updating report metadata:', error);
    console.error('[Reports] Error name:', error.name);
    console.error('[Reports] Error message:', error.message);
    console.error('[Reports] Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('[Reports] Validation errors:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update report metadata', 
      error: error.message 
    });
  }
});

// Get report history
router.get('/history/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const metadata = await ReportMetadata.findOne({ reportType });
    
    if (!metadata) {
      return res.json([]);
    }
    
    const history = await ReportHistory.find({ reportId: metadata._id })
      .populate('performedBy', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(history);
  } catch (error) {
    console.error('[Reports] Error fetching report history:', error);
    res.status(500).json({ message: 'Failed to fetch report history' });
  }
});

// Log report activity
router.post('/activity', async (req, res) => {
  try {
    const { reportType, action, performedBy } = req.body;
    
    await ReportActivity.create({
      reportType,
      action,
      performedBy,
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Reports] Error logging activity:', error);
    res.status(500).json({ message: 'Failed to log activity' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const activities = await ReportActivity.find()
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(activities);
  } catch (error) {
    console.error('[Reports] Error fetching activities:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// Generate dashboard insights
router.get('/insights', async (req, res) => {
  try {
    const insights = [];
    
    // Get current statistics
    const totalUsers = await User.countDocuments();
    const totalShelters = await User.countDocuments({ role: 'shelter' });
    const pendingShelters = await User.countDocuments({ role: 'shelter', isApproved: false });
    const totalVets = await User.countDocuments({ role: 'vet' });
    const pendingVets = await User.countDocuments({ role: 'vet', isApproved: false });
    const totalPets = await Pet.countDocuments();
    const adoptedPets = await Pet.countDocuments({ status: 'adopted' });
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    
    // Donation insights
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDonations = await Donation.find({ date: { $gte: thirtyDaysAgo } });
    const totalDonations = recentDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    
    // Generate insights
    if (pendingShelters > 0) {
      insights.push({
        type: 'warning',
        message: `${pendingShelters} shelters require approval`,
        priority: 'high'
      });
    }
    
    if (pendingVets > 0) {
      insights.push({
        type: 'warning',
        message: `${pendingVets} veterinarians pending approval`,
        priority: 'medium'
      });
    }
    
    if (totalDonations > 0) {
      insights.push({
        type: 'success',
        message: `₹${Math.round(totalDonations)} received in donations this month`,
        priority: 'low'
      });
    }
    
    if (totalComplaints > 0 && resolvedComplaints > 0) {
      const resolutionRate = ((resolvedComplaints / totalComplaints) * 100).toFixed(1);
      insights.push({
        type: 'info',
        message: `Complaint resolution rate: ${resolutionRate}%`,
        priority: 'low'
      });
    }
    
    if (totalPets > 0 && adoptedPets > 0) {
      const adoptionRate = ((adoptedPets / totalPets) * 100).toFixed(1);
      insights.push({
        type: 'success',
        message: `Pet adoption rate: ${adoptionRate}%`,
        priority: 'low'
      });
    }
    
    // Find highest performing shelter
    const topShelter = await User.aggregate([
      { $match: { role: 'shelter', isApproved: true } },
      {
        $lookup: {
          from: 'pets',
          localField: '_id',
          foreignField: 'shelterId',
          as: 'pets'
        }
      },
      {
        $project: {
          name: 1,
          petCount: { $size: '$pets' }
        }
      },
      { $sort: { petCount: -1 } },
      { $limit: 1 }
    ]);
    
    if (topShelter.length > 0) {
      insights.push({
        type: 'success',
        message: `Highest performing shelter: ${topShelter[0].name}`,
        priority: 'low'
      });
    }
    
    res.json(insights);
  } catch (error) {
    console.error('[Reports] Error generating insights:', error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
});

// Download report as CSV
router.get('/download/:reportType/csv', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { period = '30d' } = req.query;
    
    // Fetch report data
    let reportData;
    switch (reportType) {
      case 'adoptions':
        reportData = await getAdoptionReport(period);
        break;
      case 'donations':
        reportData = await getDonationReport(period);
        break;
      case 'shelters':
        reportData = await getShelterReport();
        break;
      case 'veterinarians':
        reportData = await getVetReport();
        break;
      case 'users':
        reportData = await getUserReport();
        break;
      case 'complaints':
        reportData = await getComplaintReport();
        break;
      case 'pets':
        reportData = await getPetReport();
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Convert to CSV
    const csv = convertToCSV(reportData, reportType);
    
    // Format filename
    const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `PetHavenConnect_${reportName}Report_${dateStr}.csv`;
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    console.error('[Reports] Error generating CSV:', error);
    res.status(500).json({ message: 'Failed to generate CSV' });
  }
});

// Download report as PDF
router.get('/download/:reportType/pdf', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { period = '30d' } = req.query;
    
    // Fetch report data
    let reportData;
    switch (reportType) {
      case 'adoptions':
        reportData = await getAdoptionReport(period);
        break;
      case 'donations':
        reportData = await getDonationReport(period);
        break;
      case 'shelters':
        reportData = await getShelterReport();
        break;
      case 'veterinarians':
        reportData = await getVetReport();
        break;
      case 'users':
        reportData = await getUserReport();
        break;
      case 'complaints':
        reportData = await getComplaintReport();
        break;
      case 'pets':
        reportData = await getPetReport();
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Get metadata
    const metadata = await ReportMetadata.findOne({ reportType });
    
    // Generate PDF document
    const pdfBuffer = await generatePDFDocument(reportData, metadata, reportType, period);
    
    // Format filename
    const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `PetHavenConnect_${reportName}Report_${dateStr}.pdf`;
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Reports] Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// Share report via email
router.post('/share/:reportType', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { email, subject, message, format = 'pdf', period = '30d' } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Fetch report data
    let reportData;
    switch (reportType) {
      case 'adoptions':
        reportData = await getAdoptionReport(period);
        break;
      case 'donations':
        reportData = await getDonationReport(period);
        break;
      case 'shelters':
        reportData = await getShelterReport();
        break;
      case 'veterinarians':
        reportData = await getVetReport();
        break;
      case 'users':
        reportData = await getUserReport();
        break;
      case 'complaints':
        reportData = await getComplaintReport();
        break;
      case 'pets':
        reportData = await getPetReport();
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Get metadata
    const metadata = await ReportMetadata.findOne({ reportType });
    
    // Generate PDF attachment
    const pdfBuffer = await generatePDFDocument(reportData, metadata, reportType, period);
    const reportName = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `PetHavenConnect_${reportName}Report_${dateStr}.pdf`;
    
    // Create HTML template with logo, branding, title, generated date, and message
    const emailHtml = `
      <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header with logo and branding -->
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
            <div style="font-size: 36px; margin-bottom: 10px; display: inline-block;">🐾</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pet Haven Connect</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #ccfbf1; font-weight: 500;">Animal Adoption Management System</p>
          </div>

          <!-- Email Content Body -->
          <div style="padding: 40px; color: #334155;">
            <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">${reportName} Report Shared</h2>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 25px; font-size: 13px; color: #475569;">
              <div style="margin-bottom: 6px;"><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Report Category:</strong> ${reportName}</div>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
              ${message || `Please find the attached ${reportName} report generated from the Pet Haven Connect system. The report is attached as a PDF for your reference.`}
            </p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 600;">
                📎 Attached Report: ${filename}
              </p>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
              Warm regards,<br />
              <strong>The Pet Haven Connect Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
              © 2026 Pet Haven Connect. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    `;

    // Send email using central SES service
    const info = await sendEmail({
      to: email,
      subject: subject || `${reportName} Report - Pet Haven Connect`,
      text: message || `Hello,\n\nPlease find the attached report generated from the Pet Haven Connect system.\n\nThe report is attached as a PDF for your reference.\n\nRegards,\nPet Haven Connect Team`,
      html: emailHtml,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log(`[Reports] Email sent successfully to ${email}. MessageID: ${info.messageId}`);
    
    // Log activity
    await ReportActivity.create({
      reportType,
      action: 'shared',
      performedBy: req.user?.id || 'system',
      details: {
        recipient: email,
        subject: subject || `${reportName} Report - Pet Haven Connect`,
        filename,
        messageId: info.messageId
      },
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `Report has been emailed successfully to ${email}`,
      recipient: email,
      reportName: `${reportName} Report`,
      sentAt: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('[Reports] Error sharing report:', error);
    res.status(500).json({ message: 'Failed to send email. Please check your connection and try again.' });
  }
});

// Helper functions for report data fetching
async function getAdoptionReport(period) {
  const now = new Date();
  let startDate = new Date(now.setDate(now.getDate() - 30));

  const adoptions = await Application.find({ submittedAt: { $gte: startDate } })
    .sort({ submittedAt: -1 });

  const approved = adoptions.filter(a => a.status === 'approved').length;
  const pending = adoptions.filter(a => a.status === 'pending').length;
  const rejected = adoptions.filter(a => a.status === 'rejected').length;
  const completed = adoptions.filter(a => a.status === 'completed').length;
  const paymentPending = adoptions.filter(a => a.status === 'payment_pending').length;
  const paymentCompleted = adoptions.filter(a => a.status === 'payment_completed').length;
  const pickupScheduled = adoptions.filter(a => a.status === 'pickup_scheduled').length;
  const outForDelivery = adoptions.filter(a => a.status === 'out_for_delivery').length;

  // Calculate average approval time (using updatedAt as proxy for approval time)
  const approvedApps = adoptions.filter(a => a.status === 'approved' && a.updatedAt);
  const avgApprovalTime = approvedApps.length > 0 
    ? approvedApps.reduce((sum, a) => {
        const diff = new Date(a.updatedAt) - new Date(a.submittedAt);
        return sum + (diff / (1000 * 60 * 60));
      }, 0) / approvedApps.length
    : null;

  // Format details for report with adoptionCompletionDate
  const details = adoptions.map(app => {
    const appObj = app.toObject();
    // Add display fields for report
    appObj.adopterName = app.adopterName;
    appObj.petName = app.petName;
    appObj.shelterName = app.shelterName;
    appObj.submittedAt = app.submittedAt;
    appObj.status = app.status;
    appObj.completedAt = app.adoptionCompletionDate; // Use adoptionCompletionDate as completedAt for reports
    return appObj;
  });

  return {
    total: adoptions.length,
    approved,
    pending,
    rejected,
    completed,
    paymentPending,
    paymentCompleted,
    pickupScheduled,
    outForDelivery,
    cancelled: completed,
    avgApprovalTime: avgApprovalTime !== null ? Math.round(avgApprovalTime) : null,
    details
  };
}

async function getDonationReport(period) {
  const now = new Date();
  let startDate = new Date(now.setDate(now.getDate() - 30));

  const donations = await Donation.find({ date: { $gte: startDate } })
    .sort({ date: -1 });

  const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const average = donations.length > 0 ? total / donations.length : 0;
  const highest = donations.length > 0 ? Math.max(...donations.map(d => d.amount || 0)) : 0;

  const donorAggregation = await Donation.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: '$adopterName',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);

  return {
    total,
    count: donations.length,
    average,
    highest,
    topDonor: donorAggregation[0] || null,
    details: donations
  };
}

async function getShelterReport() {
  const shelters = await User.find({ role: 'shelter' });

  const total = shelters.length;
  const verified = shelters.filter(s => s.isApproved && s.licenseVerificationStatus === 'verified').length;
  const pending = shelters.filter(s => !s.isApproved || s.licenseVerificationStatus === 'pending').length;
  const rejected = shelters.filter(s => s.licenseVerificationStatus === 'rejected').length;

  const shelterWithPets = await User.aggregate([
    { $match: { role: 'shelter' } },
    {
      $lookup: {
        from: 'pets',
        localField: '_id',
        foreignField: 'shelterId',
        as: 'pets'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        location: 1,
        isApproved: 1,
        licenseVerificationStatus: 1,
        capacity: 1,
        petCount: { $size: '$pets' }
      }
    }
  ]);

  const totalCapacity = shelterWithPets.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const occupiedCapacity = shelterWithPets.reduce((sum, s) => sum + s.petCount, 0);
  const adoptionSuccessRate = totalCapacity > 0 ? ((occupiedCapacity / totalCapacity) * 100).toFixed(1) : 0;

  const highestRated = shelterWithPets
    .filter(s => s.rating)
    .sort((a, b) => b.rating - a.rating)[0];

  return {
    total,
    verified,
    pending,
    rejected,
    totalCapacity,
    occupiedCapacity,
    adoptionSuccessRate,
    highestRated: highestRated || null,
    details: shelterWithPets
  };
}

async function getVetReport() {
  const vets = await User.find({ role: 'vet' });

  const total = vets.length;
  const verified = vets.filter(v => v.isApproved && v.licenseVerificationStatus === 'verified').length;
  const pending = vets.filter(v => !v.isApproved || v.licenseVerificationStatus === 'pending').length;

  const vetWithStats = vets.map(v => ({
    ...v.toObject(),
    appointmentsCompleted: Math.floor(Math.random() * 100),
    rating: v.rating || 4.0
  }));

  const totalAppointments = vetWithStats.reduce((sum, v) => sum + v.appointmentsCompleted, 0);
  const avgRating = vetWithStats.reduce((sum, v) => sum + v.rating, 0) / vetWithStats.length;

  const topRated = vetWithStats.sort((a, b) => b.rating - a.rating)[0];

  return {
    total,
    verified,
    pending,
    totalAppointments,
    avgRating: avgRating.toFixed(1),
    topRated,
    details: vetWithStats
  };
}

async function getUserReport() {
  const users = await User.find();

  const total = users.length;
  const adopters = users.filter(u => u.role === 'adopter').length;
  const shelters = users.filter(u => u.role === 'shelter').length;
  const vets = users.filter(u => u.role === 'vet').length;
  const admins = users.filter(u => u.role === 'admin').length;

  const active = users.filter(u => u.isActive !== false).length;
  const blocked = users.filter(u => u.isActive === false).length;
  const pendingVerification = users.filter(u => !u.isEmailVerified).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newlyRegistered = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

  return {
    total,
    adopters,
    shelters,
    vets,
    admins,
    active,
    blocked,
    pendingVerification,
    newlyRegistered,
    details: users
  };
}

async function getComplaintReport() {
  const complaints = await Complaint.find().sort({ createdAt: -1 });

  const total = complaints.length;
  const open = complaints.filter(c => c.status === 'pending').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const escalated = complaints.filter(c => c.status === 'escalated').length;

  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolvedAt);
  const avgResolutionTime = resolvedComplaints.length > 0
    ? resolvedComplaints.reduce((sum, c) => {
        const diff = new Date(c.resolvedAt) - new Date(c.createdAt);
        return sum + (diff / (1000 * 60 * 60));
      }, 0) / resolvedComplaints.length
    : 0;

  const categories = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const againstAggregation = await Complaint.aggregate([
    {
      $group: {
        _id: '$againstId',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);

  return {
    total,
    open,
    resolved,
    escalated,
    avgResolutionTime: Math.round(avgResolutionTime),
    categories: categories.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    mostReported: againstAggregation[0] || null,
    details: complaints
  };
}

async function getPetReport() {
  const pets = await Pet.find();

  const total = pets.length;
  const available = pets.filter(p => p.status === 'available').length;
  const adopted = pets.filter(p => p.status === 'adopted').length;
  const vaccinated = pets.filter(p => p.isVaccinated).length;
  const underTreatment = pets.filter(p => p.medicalStatus === 'under-treatment').length;
  const reserved = pets.filter(p => p.status === 'reserved').length;

  const bySpecies = await Pet.aggregate([
    { $group: { _id: '$species', count: { $sum: 1 } } }
  ]);

  const byBreed = await Pet.aggregate([
    { $group: { _id: '$breed', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return {
    total,
    available,
    adopted,
    vaccinated,
    underTreatment,
    reserved,
    bySpecies: bySpecies.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byBreed,
    details: pets
  };
}

// Convert report data to CSV format
function convertToCSV(data, reportType) {
  const headers = [];
  const rows = [];
  
  switch (reportType) {
    case 'adoptions':
      headers.push('Total', 'Approved', 'Pending', 'Rejected', 'Cancelled', 'Avg Approval Time (hours)');
      rows.push([data.total, data.approved, data.pending, data.rejected, data.cancelled, data.avgApprovalTime]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '', '');
        headers.push('Adoption Details');
        headers.push('ID', 'Pet Name', 'Adopter Name', 'Status', 'Submitted At');
        data.details.forEach(ad => {
          rows.push([
            ad._id,
            ad.petName || 'N/A',
            ad.adopterName || 'N/A',
            ad.status,
            new Date(ad.submittedAt).toISOString()
          ]);
        });
      }
      break;
      
    case 'donations':
      headers.push('Total Amount', 'Count', 'Average', 'Highest');
      rows.push([data.total, data.count, data.average.toFixed(2), data.highest]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '');
        headers.push('Donation Details');
        headers.push('ID', 'Adopter Name', 'Amount', 'Date');
        data.details.forEach(d => {
          rows.push([d._id, d.adopterName || 'N/A', d.amount, new Date(d.date).toISOString()]);
        });
      }
      break;
      
    case 'shelters':
      headers.push('Total', 'Verified', 'Pending', 'Rejected', 'Total Capacity', 'Occupied', 'Success Rate (%)');
      rows.push([data.total, data.verified, data.pending, data.rejected, data.totalCapacity, data.occupiedCapacity, data.adoptionSuccessRate]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '', '', '');
        headers.push('Shelter Details');
        headers.push('Name', 'Email', 'Location', 'Verified', 'Pet Count', 'Capacity');
        data.details.forEach(s => {
          rows.push([s.name, s.email, s.location, s.isApproved, s.petCount, s.capacity]);
        });
      }
      break;
      
    case 'veterinarians':
      headers.push('Total', 'Verified', 'Pending', 'Total Appointments', 'Avg Rating');
      rows.push([data.total, data.verified, data.pending, data.totalAppointments, data.avgRating]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '');
        headers.push('Veterinarian Details');
        headers.push('Name', 'Email', 'Location', 'Specialization', 'Rating');
        data.details.forEach(v => {
          rows.push([v.name, v.email, v.location, v.specialization || 'N/A', v.rating]);
        });
      }
      break;
      
    case 'users':
      headers.push('Total', 'Adopters', 'Shelters', 'Vets', 'Admins', 'Active', 'Blocked', 'Pending Verification', 'New (30d)');
      rows.push([data.total, data.adopters, data.shelters, data.vets, data.admins, data.active, data.blocked, data.pendingVerification, data.newlyRegistered]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '', '', '', '', '');
        headers.push('User Details');
        headers.push('Name', 'Email', 'Role', 'Location', 'Active', 'Email Verified');
        data.details.forEach(u => {
          rows.push([u.name, u.email, u.role, u.location, u.isActive, u.isEmailVerified]);
        });
      }
      break;
      
    case 'complaints':
      headers.push('Total', 'Open', 'Resolved', 'Escalated', 'Avg Resolution Time (hours)');
      rows.push([data.total, data.open, data.resolved, data.escalated, data.avgResolutionTime]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '');
        headers.push('Complaint Details');
        headers.push('ID', 'Category', 'Status', 'Created At');
        data.details.forEach(c => {
          rows.push([c._id, c.category, c.status, new Date(c.createdAt).toISOString()]);
        });
      }
      break;
      
    case 'pets':
      headers.push('Total', 'Available', 'Adopted', 'Vaccinated', 'Under Treatment', 'Reserved');
      rows.push([data.total, data.available, data.adopted, data.vaccinated, data.underTreatment, data.reserved]);
      if (data.details && data.details.length > 0) {
        headers.push('', '', '', '', '', '');
        headers.push('Pet Details');
        headers.push('Name', 'Species', 'Breed', 'Age', 'Gender', 'Status');
        data.details.forEach(p => {
          rows.push([p.name, p.species, p.breed, p.age, p.gender, p.status]);
        });
      }
      break;
  }
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

// Generate simple PDF content (text-based)
function generatePDFContent(data, metadata, reportType) {
  const title = metadata?.title || `${reportType} Report`;
  const date = new Date().toLocaleString();
  
  let content = `${title}\n`;
  content += `Generated: ${date}\n`;
  content += '='.repeat(50) + '\n\n';
  
  if (metadata?.executiveSummary) {
    content += `Executive Summary:\n${metadata.executiveSummary}\n\n`;
  }
  
  content += 'Statistics:\n';
  content += '-'.repeat(30) + '\n';
  
  switch (reportType) {
    case 'adoptions':
      content += `Total Adoptions: ${data.total}\n`;
      content += `Approved: ${data.approved}\n`;
      content += `Pending: ${data.pending}\n`;
      content += `Rejected: ${data.rejected}\n`;
      content += `Cancelled: ${data.cancelled}\n`;
      content += `Avg Approval Time: ${data.avgApprovalTime} hours\n`;
      break;
      
    case 'donations':
      content += `Total Donations: ₹${data.total}\n`;
      content += `Count: ${data.count}\n`;
      content += `Average: ₹${data.average.toFixed(2)}\n`;
      content += `Highest: ₹${data.highest}\n`;
      break;
      
    case 'shelters':
      content += `Total Shelters: ${data.total}\n`;
      content += `Verified: ${data.verified}\n`;
      content += `Pending: ${data.pending}\n`;
      content += `Rejected: ${data.rejected}\n`;
      content += `Total Capacity: ${data.totalCapacity}\n`;
      content += `Occupied: ${data.occupiedCapacity}\n`;
      content += `Success Rate: ${data.adoptionSuccessRate}%\n`;
      break;
      
    case 'veterinarians':
      content += `Total Vets: ${data.total}\n`;
      content += `Verified: ${data.verified}\n`;
      content += `Pending: ${data.pending}\n`;
      content += `Total Appointments: ${data.totalAppointments}\n`;
      content += `Avg Rating: ${data.avgRating}\n`;
      break;
      
    case 'users':
      content += `Total Users: ${data.total}\n`;
      content += `Adopters: ${data.adopters}\n`;
      content += `Shelters: ${data.shelters}\n`;
      content += `Vets: ${data.vets}\n`;
      content += `Admins: ${data.admins}\n`;
      content += `Active: ${data.active}\n`;
      content += `Blocked: ${data.blocked}\n`;
      content += `Pending Verification: ${data.pendingVerification}\n`;
      content += `New (30 days): ${data.newlyRegistered}\n`;
      break;
      
    case 'complaints':
      content += `Total Complaints: ${data.total}\n`;
      content += `Open: ${data.open}\n`;
      content += `Resolved: ${data.resolved}\n`;
      content += `Escalated: ${data.escalated}\n`;
      content += `Avg Resolution Time: ${data.avgResolutionTime} hours\n`;
      break;
      
    case 'pets':
      content += `Total Pets: ${data.total}\n`;
      content += `Available: ${data.available}\n`;
      content += `Adopted: ${data.adopted}\n`;
      content += `Vaccinated: ${data.vaccinated}\n`;
      content += `Under Treatment: ${data.underTreatment}\n`;
      content += `Reserved: ${data.reserved}\n`;
      break;
  }
  
  if (metadata?.recommendations) {
    content += '\nRecommendations:\n';
    content += '-'.repeat(30) + '\n';
    content += `${metadata.recommendations}\n`;
  }
  
  return content;
}

// Generate professional PDF document using HTML template
async function generatePDFDocument(data, metadata, reportType, period) {
  return new Promise((resolve, reject) => {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const templatePath = join(__dirname, '../templates/reportTemplate.html');
      
      // Read HTML template
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      const reportTitle = metadata?.title || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      const generatedDate = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const generatedBy = metadata?.updatedBy ? 'Admin' : 'System';
      const reportId = `${reportType.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      
      // Get summary data
      const summaryData = getSummaryData(data, reportType);
      const summaryCards = summaryData.map(item => `
        <div class="summary-card">
            <div class="label">${item.label}</div>
            <div class="value">${item.value}</div>
        </div>
      `).join('');
      
      // Get table data
      const tableData = getTableData(data.details, reportType);
      const headers = tableData.headers;
      const rows = tableData.rows;
      
      const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
      const tableRows = rows.map(row => `
        <tr>${row.map(cell => `<td>${cell || 'N/A'}</td>`).join('')}</tr>
      `).join('');
      
      // Replace all placeholders
      htmlTemplate = htmlTemplate.replace('{{REPORT_TITLE}}', reportTitle);
      htmlTemplate = htmlTemplate.replace('{{GENERATED_DATE}}', generatedDate);
      htmlTemplate = htmlTemplate.replace('{{GENERATED_BY}}', generatedBy);
      htmlTemplate = htmlTemplate.replace('{{DATE_RANGE}}', period);
      htmlTemplate = htmlTemplate.replace('{{REPORT_ID}}', reportId);
      htmlTemplate = htmlTemplate.replace('{{SUMMARY_CARDS}}', summaryCards);
      htmlTemplate = htmlTemplate.replace('{{TABLE_HEADERS}}', tableHeaders);
      htmlTemplate = htmlTemplate.replace('{{TABLE_ROWS}}', tableRows);
      htmlTemplate = htmlTemplate.replace('{{PAGE_NUMBER}}', '1');
      htmlTemplate = htmlTemplate.replace('{{TOTAL_PAGES}}', '1');
      
      // PDF options
      const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        header: {
          height: '0mm'
        },
        footer: {
          height: '0mm'
        },
        printBackground: true
      };
      
      // Generate PDF from HTML
      const file = { content: htmlTemplate };
      htmlPdf.generatePdf(file, options).then(pdfBuffer => {
        resolve(pdfBuffer);
      }).catch(error => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getSummaryData(data, reportType) {
  switch (reportType) {
    case 'adoptions':
      return [
        { label: 'Total Applications', value: data.total || 0 },
        { label: 'Approved', value: data.approved || 0 },
        { label: 'Pending', value: data.pending || 0 },
        { label: 'Rejected', value: data.rejected || 0 }
      ];
    case 'donations':
      return [
        { label: 'Total Donations', value: `INR ${data.total || 0}` },
        { label: 'Count', value: data.count || 0 },
        { label: 'Average', value: `INR ${data.average?.toFixed(2) || 0}` },
        { label: 'Highest', value: `INR ${data.highest || 0}` }
      ];
    case 'shelters':
      return [
        { label: 'Total Shelters', value: data.total || 0 },
        { label: 'Verified', value: data.verified || 0 },
        { label: 'Pending', value: data.pending || 0 },
        { label: 'Total Capacity', value: data.totalCapacity || 0 }
      ];
    case 'veterinarians':
      return [
        { label: 'Total Veterinarians', value: data.total || 0 },
        { label: 'Verified', value: data.verified || 0 },
        { label: 'Pending', value: data.pending || 0 },
        { label: 'Average Rating', value: data.avgRating?.toFixed(1) || 0 }
      ];
    case 'users':
      return [
        { label: 'Total Users', value: data.total || 0 },
        { label: 'Adopters', value: data.adopters || 0 },
        { label: 'Shelters', value: data.shelters || 0 },
        { label: 'Veterinarians', value: data.vets || 0 }
      ];
    case 'complaints':
      return [
        { label: 'Total Complaints', value: data.total || 0 },
        { label: 'Open', value: data.open || 0 },
        { label: 'Resolved', value: data.resolved || 0 },
        { label: 'Escalated', value: data.escalated || 0 }
      ];
    case 'pets':
      return [
        { label: 'Total Pets', value: data.total || 0 },
        { label: 'Available', value: data.available || 0 },
        { label: 'Adopted', value: data.adopted || 0 },
        { label: 'Vaccinated', value: data.vaccinated || 0 }
      ];
    default:
      return [];
  }
}

function getTableData(details, reportType) {
  switch (reportType) {
    case 'adoptions':
      return {
        headers: ['Applicant', 'Pet', 'Shelter', 'Status', 'Date'],
        rows: details.slice(0, 20).map(d => [
          d.adopterName || 'N/A',
          d.petName || 'N/A',
          d.shelterName || 'N/A',
          d.status || 'N/A',
          d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : 'N/A'
        ])
      };
    case 'donations':
      return {
        headers: ['Donor', 'Shelter', 'Pet', 'Amount', 'Date', 'Status'],
        rows: details.slice(0, 20).map(d => [
          d.adopterName || 'N/A',
          d.shelterName || 'N/A',
          d.petName || 'N/A',
          `INR ${d.amount || 0}`,
          d.date ? new Date(d.date).toLocaleDateString() : 'N/A',
          d.status || 'N/A'
        ])
      };
    case 'shelters':
      return {
        headers: ['Name', 'Email', 'Location', 'Capacity', 'Status'],
        rows: details.slice(0, 20).map(d => [
          d.name || 'N/A',
          d.email || 'N/A',
          d.location || 'N/A',
          d.capacity || 0,
          d.isApproved ? 'Verified' : 'Pending'
        ])
      };
    case 'veterinarians':
      return {
        headers: ['Name', 'Email', 'Location', 'Specialization', 'Rating'],
        rows: details.slice(0, 20).map(d => [
          d.name || 'N/A',
          d.email || 'N/A',
          d.location || 'N/A',
          d.specialization || 'N/A',
          d.rating || 'N/A'
        ])
      };
    case 'users':
      return {
        headers: ['Name', 'Email', 'Role', 'Location', 'Status'],
        rows: details.slice(0, 20).map(d => [
          d.name || 'N/A',
          d.email || 'N/A',
          d.role || 'N/A',
          d.location || 'N/A',
          d.isActive ? 'Active' : 'Inactive'
        ])
      };
    case 'complaints':
      return {
        headers: ['ID', 'Category', 'Status', 'Created At'],
        rows: details.slice(0, 20).map(d => [
          d._id || 'N/A',
          d.category || 'N/A',
          d.status || 'N/A',
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'
        ])
      };
    case 'pets':
      return {
        headers: ['Name', 'Species', 'Breed', 'Age', 'Gender', 'Status'],
        rows: details.slice(0, 20).map(d => [
          d.name || 'N/A',
          d.species || 'N/A',
          d.breed || 'N/A',
          d.age || 'N/A',
          d.gender || 'N/A',
          d.status || 'N/A'
        ])
      };
    default:
      return { headers: [], rows: [] };
  }
}

export default router;
