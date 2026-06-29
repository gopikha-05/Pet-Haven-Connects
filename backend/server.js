import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { initNotificationController } from './controllers/notificationController.js';
import notificationRoutes from './routes/notificationRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import petRoutes from './routes/petRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import Donation from './models/Donation.js';
import Pet from './models/Pet.js';
import Payment from './models/Payment.js';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Server] Application routes imported successfully');

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Serve local uploads folder
app.use('/uploads', express.static(uploadsDir));

// Make io available to controllers
app.set('io', io);

// Initialize notification controller with Socket.io instance
initNotificationController(io);

// Import and use auth routes
import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

// Import and use admin routes
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);

// Import and use reports routes
import reportsRoutes from './routes/reportsRoutes.js';
app.use('/api/reports', reportsRoutes);

// Analytics endpoint for admin dashboard
app.get('/api/analytics', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const Pet = (await import('./models/Pet.js')).default;
    const Application = (await import('./models/Application.js')).default;
    const Donation = (await import('./models/Donation.js')).default;
    const Complaint = (await import('./models/Complaint.js')).default;
    
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

    // Complaint Analytics
    const totalComplaints = await Complaint.countDocuments({ mergedInto: { $exists: false } });
    const openComplaints = await Complaint.countDocuments({ 
      status: { $in: ['pending', 'assigned', 'under_review', 'waiting_for_user', 'waiting_for_internal_team', 'reopened'] },
      mergedInto: { $exists: false }
    });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved', mergedInto: { $exists: false } });
    const closedComplaints = await Complaint.countDocuments({ status: 'closed', mergedInto: { $exists: false } });
    
    // Average ratings and times
    const satisfactionRatings = await Complaint.find({ satisfactionRating: { $exists: true } }).select('satisfactionRating');
    const avgSatisfactionRating = satisfactionRatings.length > 0
      ? Number((satisfactionRatings.reduce((sum, c) => sum + c.satisfactionRating, 0) / satisfactionRatings.length).toFixed(1))
      : 0;
      
    const respondedComplaints = await Complaint.find({ firstRespondedAt: { $exists: true } }).select('createdAt firstRespondedAt');
    const avgResponseTime = respondedComplaints.length > 0
      ? Number((respondedComplaints.reduce((sum, c) => sum + (new Date(c.firstRespondedAt) - new Date(c.createdAt)), 0) / respondedComplaints.length / (1000 * 60 * 60)).toFixed(1))
      : 0; // in hours

    const resolvedTimes = await Complaint.find({ resolvedAt: { $exists: true } }).select('createdAt resolvedAt');
    const avgResolutionTime = resolvedTimes.length > 0
      ? Number((resolvedTimes.reduce((sum, c) => sum + (new Date(c.resolvedAt) - new Date(c.createdAt)), 0) / resolvedTimes.length / (1000 * 60 * 60)).toFixed(1))
      : 0; // in hours

    // Most common category
    const categoriesGroup = await Complaint.aggregate([
      { $match: { mergedInto: { $exists: false } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostCommonCategory = categoriesGroup.length > 0 ? categoriesGroup[0]._id : 'N/A';

    // Pending by priority
    const pendingByPriority = { critical: 0, high: 0, medium: 0, low: 0 };
    const prioritiesGroup = await Complaint.aggregate([
      { $match: { status: { $in: ['pending', 'assigned', 'under_review', 'waiting_for_user', 'waiting_for_internal_team', 'reopened'] }, mergedInto: { $exists: false } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    prioritiesGroup.forEach(g => {
      const key = g._id ? g._id.toLowerCase() : '';
      if (pendingByPriority[key] !== undefined) {
        pendingByPriority[key] = g.count;
      }
    });

    // Most active staff
    const staffGroup = await Complaint.aggregate([
      { $match: { assignedUserName: { $exists: true, $ne: null } } },
      { $group: { _id: '$assignedUserName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostActiveStaff = staffGroup.length > 0 ? staffGroup[0]._id : 'N/A';

    // Resolution rate
    const resolutionRate = totalComplaints > 0
      ? Number(((resolvedComplaints + closedComplaints) / totalComplaints * 100).toFixed(0))
      : 100;

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
      complaintKPIs: {
        totalComplaints,
        openComplaints,
        resolvedComplaints,
        closedComplaints,
        avgResponseTime,
        avgResolutionTime,
        avgSatisfactionRating,
        mostCommonCategory,
        mostActiveStaff,
        resolutionRate,
        pendingByPriority
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analytics] Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Socket.io connection handling
/**
 * Socket.io Connection Handler
 * Manages real-time WebSocket connections for notifications
 */
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user with their socket ID for targeted notifications
  socket.on('register_user', async (userId) => {
    try {
      const { getNotificationService } = await import('./controllers/notificationController.js');
      const notificationService = getNotificationService();
      
      if (notificationService) {
        await notificationService.registerSocket(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
        
        // Send initial unread count
        const unreadCount = await notificationService.getUnreadCount(userId);
        socket.emit('notification_count', { count: unreadCount });
      }
    } catch (error) {
      console.error('Error registering user socket:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      const { getNotificationService } = await import('./controllers/notificationController.js');
      const notificationService = getNotificationService();
      
      if (notificationService) {
        // Find user by socket ID and unregister
        const User = (await import('./models/User.js')).default;
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          await notificationService.unregisterSocket(user._id);
          console.log(`User ${user._id} disconnected`);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/pets', petRoutes);

// Applications routes
try {
  app.use('/api/applications', applicationRoutes);
  console.log('[Server] Application routes mounted successfully');
} catch (error) {
  console.error('[Server] Error mounting application routes:', error);
}

// Registered routers
app.use('/api/complaints', complaintRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/payments', paymentRoutes);

// Direct Node.js handler for donations to bypass offline Java service
app.post('/api/donations', async (req, res) => {
  try {
    const { amount, method, petId, petName } = req.body;
    
    // Manual token decoding if auth header present (not enforcing for public donations page)
    let adopterId = null;
    let adopterName = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        adopterId = decoded.sub;
        adopterName = decoded.name;
      } catch (jwtErr) {
        // Ignore token decode error for public donation page
      }
    }

    const description = petId ? `Donation for Pet: ${petName}` : `General Donation`;
    const donation = await Donation.create({
      description,
      amount: Number(amount) || 1000,
      method: method || 'upi',
      petId,
      petName,
      adopterId,
      adopterName,
      date: new Date(),
      status: 'completed'
    });

    const invoiceId = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    res.json({
      success: true,
      data: {
        invoiceId,
        id: donation._id.toString(),
        ...donation.toObject()
      }
    });
  } catch (error) {
    console.error('[Donation] Error saving donation record:', error);
    res.status(500).json({ message: 'Error processing donation record', error: error.message });
  }
});

// Retrieve all donations
app.get('/api/donations', async (req, res) => {
  try {
    let query = {};
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'adopter') {
          query.adopterId = decoded.sub;
        }
      } catch (jwtErr) {
        // Ignore token decode error
      }
    }
    const list = await Donation.find(query).sort({ date: -1 });
    const enrichedList = await Promise.all(list.map(async (d) => {
      const obj = d.toObject();
      obj.id = obj._id.toString();
      if (obj.petId) {
        const pet = await Pet.findById(obj.petId);
        if (pet) {
          obj.petImage = pet.images?.[0] || pet.image || '';
          obj.shelterName = pet.shelterName || 'Pet Haven Shelter';
        }
      }
      if (!obj.shelterName) {
        obj.shelterName = 'Pet Haven Shelter';
      }
      return obj;
    }));
    res.json(enrichedList);
  } catch (error) {
    console.error('[Donation] Error fetching donations:', error);
    res.status(500).json({ message: 'Error retrieving donations', error: error.message });
  }
});

// Retrieve all billing/transactions (alias to donations)
app.get('/api/billing/transactions', async (req, res) => {
  try {
    let query = {};
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'adopter') {
          query.adopterId = decoded.sub;
        }
      } catch (jwtErr) {
        // Ignore token decode error
      }
    }
    const list = await Donation.find(query).sort({ date: -1 });
    const enrichedList = await Promise.all(list.map(async (d) => {
      const obj = d.toObject();
      obj.id = obj._id.toString();
      if (obj.petId) {
        const pet = await Pet.findById(obj.petId);
        if (pet) {
          obj.petImage = pet.images?.[0] || pet.image || '';
          obj.shelterName = pet.shelterName || 'Pet Haven Shelter';
        }
      }
      if (!obj.shelterName) {
        obj.shelterName = 'Pet Haven Shelter';
      }
      return obj;
    }));
    res.json(enrichedList);
  } catch (error) {
    console.error('[Donation] Error fetching transactions:', error);
    res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PetHaven Backend API is running' });
});

// Proxy middleware for unhandled /api requests to Java backend on port 8081
// Only proxy specific routes that are not handled by this backend
app.use(['/api/billing', '/api/supplies'], async (req, res) => {
  try {
    const targetUrl = `http://localhost:8081${req.originalUrl}`;
    const headers = { ...req.headers };
    
    // Remove host header to avoid conflicts with target server
    delete headers.host;
    
    console.log(`[Proxy] Forwarding ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    // Copy headers from response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    res.status(response.status);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error('[Proxy] Error forwarding request:', error);
    res.status(500).json({ message: 'Error communicating with main service', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized global error handler
app.use((err, req, res, next) => {
  console.error('[Centralized Error Handler]:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  let friendlyMessage = 'We encountered an error processing your request. Please try again later.';
  
  if (err.name === 'ValidationError') {
    friendlyMessage = 'Invalid input data provided. Please verify your fields.';
  } else if (err.name === 'CastError') {
    friendlyMessage = 'The requested resource format is invalid.';
  } else if (err.code === 11000) {
    friendlyMessage = 'A duplicate entry was found in our records.';
  } else if (err.message && statusCode < 500) {
    friendlyMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: friendlyMessage,
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected successfully');
    
    // Run Complaint Migration
    try {
      const Complaint = (await import('./models/Complaint.js')).default;
      const Counter = (await import('./models/Counter.js')).default;

      // Ensure counter is initialized
      let counter = await Counter.findOne({ id: 'complaints' });
      if (!counter) {
        await Counter.create({ id: 'complaints', seq: 0 });
      }

      const complaintsWithoutNumber = await Complaint.find({ complaintNumber: { $exists: false } }).sort({ createdAt: 1 });
      if (complaintsWithoutNumber.length > 0) {
        console.log(`[Migration] Found ${complaintsWithoutNumber.length} complaints without a complaintNumber. Migrating...`);
        for (const c of complaintsWithoutNumber) {
          const year = new Date(c.createdAt || Date.now()).getFullYear();
          const updatedCounter = await Counter.findOneAndUpdate(
            { id: 'complaints' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );
          c.complaintNumber = `CMP-${year}-${String(updatedCounter.seq).padStart(6, '0')}`;
          
          // Set initial SLA dates based on priority if missing
          let responseHours = 24;
          let resolutionHours = 72;
          if (c.priority === 'critical') { responseHours = 1; resolutionHours = 4; }
          else if (c.priority === 'high') { responseHours = 4; resolutionHours = 24; }
          else if (c.priority === 'medium') { responseHours = 12; resolutionHours = 48; }

          c.firstResponseDueAt = new Date(new Date(c.createdAt).getTime() + responseHours * 60 * 60 * 1000);
          c.resolutionDueAt = new Date(new Date(c.createdAt).getTime() + resolutionHours * 60 * 60 * 1000);

          await c.save();
        }
        console.log('[Migration] Complaint numbers and SLA dates migrated successfully.');
      }
    } catch (migrationErr) {
      console.error('[Migration] Failed to run complaint migration:', migrationErr);
    }
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server ready for connections`);
    });

    // Background job for SLA Escalation (runs every 1 minute)
    setInterval(async () => {
      try {
        const Complaint = (await import('./models/Complaint.js')).default;
        const { getNotificationService } = await import('./controllers/notificationController.js');
        const notificationService = getNotificationService();

        const now = new Date();
        // Find unresolved and unescalated complaints that have breached SLA
        const breachedComplaints = await Complaint.find({
          status: { $in: ['pending', 'assigned', 'under_review', 'waiting_for_internal_team', 'reopened'] },
          isEscalated: false,
          $or: [
            { firstResponseDueAt: { $lt: now }, firstRespondedAt: { $exists: false } },
            { resolutionDueAt: { $lt: now } }
          ]
        });

        for (const c of breachedComplaints) {
          c.isEscalated = true;
          const oldPriority = c.priority;
          let newPriority = oldPriority;
          
          // Escalate priority
          if (oldPriority === 'low') newPriority = 'medium';
          else if (oldPriority === 'medium') newPriority = 'high';
          else if (oldPriority === 'high') newPriority = 'critical';
          
          c.priority = newPriority;
          
          // Add timeline entry
          if (!c.timeline) c.timeline = [];
          c.timeline.push({
            status: c.status,
            date: now,
            note: `SLA Breached. Ticket automatically escalated. Priority upgraded from ${oldPriority} to ${newPriority}.`,
            actor: 'System',
            actorRole: 'system',
            actionType: 'priority_changed'
          });

          await c.save();
          console.log(`[SLA Escalation] Escalated complaint ${c.complaintNumber} due to SLA breach.`);

          // Notify assignee and admins
          if (notificationService) {
            const recipients = [];
            if (c.assignedUserId) {
              recipients.push({ id: c.assignedUserId, role: c.assignedRole });
            }
            // Always notify admin
            recipients.push({ id: 'admin', role: 'admin' });

            for (const r of recipients) {
              try {
                await notificationService.createNotification({
                  recipientId: r.id,
                  recipientRole: r.role,
                  type: 'complaint_status',
                  title: 'Complaint Escalated',
                  message: `Complaint ${c.complaintNumber || c._id} has been automatically escalated due to SLA breach.`,
                  data: { complaintId: c._id.toString() }
                });
              } catch (notifErr) {
                console.error('[SLA Escalation] Failed to send notification:', notifErr);
              }
            }
          }
        }
      } catch (slaErr) {
        console.error('[SLA Escalation Job] Error running SLA checks:', slaErr);
      }
    }, 60 * 1000);

    // Background job to mark pending transactions older than 30 minutes as expired
    setInterval(async () => {
      try {
        const expiryTime = new Date(Date.now() - 30 * 60 * 1000);
        const result = await Payment.updateMany(
          {
            status: 'pending',
            timestamp: { $lt: expiryTime }
          },
          {
            $set: { status: 'expired' }
          }
        );
        if (result.modifiedCount > 0) {
          console.log(`[Payment Cleanup] Marked ${result.modifiedCount} abandoned pending Razorpay transactions as expired.`);
        }
      } catch (error) {
        console.error('[Payment Cleanup] Error marking pending payments as expired:', error);
      }
    }, 10 * 60 * 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io }; // Export for use in other modules
