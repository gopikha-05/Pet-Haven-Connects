import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import htmlPdf from 'html-pdf-node';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Counter from '../models/Counter.js';
import { auth, authorizeRoles } from '../middleware/auth.js';
import { getNotificationService } from '../controllers/notificationController.js';
import { sendEmail, sendComplaintEmail, sendComplaintResponseEmail } from '../services/emailService.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for complaint attachments
const COMPLAINT_ALLOWED_MIMES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (COMPLAINT_ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, WEBP, PDF, DOC, and DOCX are allowed.'), false);
  }
};

const uploadAttachment = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

/**
 * Helper to log communication
 */
const logCommunication = async (complaint, method, recipient, subject, content, status) => {
  if (!complaint.communicationLog) complaint.communicationLog = [];
  complaint.communicationLog.push({
    method,
    recipient,
    sentAt: new Date(),
    subject,
    content: content.substring(0, 500), // truncate content to prevent huge doc sizes
    status,
    retryAttempts: 0
  });
  await complaint.save();
};

/**
 * Helper to calculate SLA dates based on priority
 */
const calculateSLADates = (priority, baseDate = new Date()) => {
  let responseHours = 24;
  let resolutionHours = 72;
  
  if (priority === 'critical') {
    responseHours = 1;
    resolutionHours = 4;
  } else if (priority === 'high') {
    responseHours = 4;
    resolutionHours = 24;
  } else if (priority === 'medium') {
    responseHours = 12;
    resolutionHours = 48;
  }
  
  return {
    firstResponseDueAt: new Date(baseDate.getTime() + responseHours * 60 * 60 * 1000),
    resolutionDueAt: new Date(baseDate.getTime() + resolutionHours * 60 * 60 * 1000)
  };
};

/**
 * @route   POST /api/complaints/upload-attachment
 * @desc    Upload file attachment for complaint (with local fallback)
 * @access  Private
 */
router.post('/upload-attachment', auth, uploadAttachment.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    let fileUrl = '';
    // Try to upload to S3 first
    try {
      const { uploadToS3 } = await import('../services/s3Service.js');
      fileUrl = await uploadToS3(req.file, 'complaints');
      console.log('[Upload] Successfully uploaded to S3:', fileUrl);
    } catch (s3Err) {
      console.warn('[Upload] S3 upload failed, falling back to local storage:', s3Err.message);
      
      // Fallback: Save file locally
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      const filename = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
      const localPath = path.join(__dirname, '../public/uploads', filename);
      
      fs.writeFileSync(localPath, req.file.buffer);
      fileUrl = `/uploads/${filename}`;
      console.log('[Upload] Successfully saved file locally:', fileUrl);
    }
    
    res.json({
      name: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      uploadedAt: new Date()
    });
  } catch (error) {
    console.error('[Upload] Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

/**
 * @route   POST /api/complaints
 * @desc    Submit a new complaint
 * @access  Private (Adopter)
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      againstUserId,
      againstRole,
      againstName,
      category,
      priority,
      description,
      evidence,
      contactPreference,
      contactDetail,
      attachments
    } = req.body;

    // Generate sequential complaint number
    const year = new Date().getFullYear();
    const updatedCounter = await Counter.findOneAndUpdate(
      { id: 'complaints' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const complaintNumber = `CMP-${year}-${String(updatedCounter.seq).padStart(6, '0')}`;

    // Calculate SLA dates
    const slaDates = calculateSLADates(priority || 'medium');

    const complaint = await Complaint.create({
      complaintNumber,
      title,
      raisedByUserId: req.user.id,
      raisedByRole: req.user.role,
      raisedByName: req.user.name || 'Adopter',
      againstUserId,
      againstRole,
      againstName,
      category,
      priority: priority || 'medium',
      description,
      evidence,
      contactPreference: contactPreference || 'email',
      contactDetail,
      attachments: attachments || [],
      status: 'pending',
      firstResponseDueAt: slaDates.firstResponseDueAt,
      resolutionDueAt: slaDates.resolutionDueAt
    });

    // Add initial timeline entry
    complaint.timeline.push({
      status: 'pending',
      date: new Date(),
      note: 'Complaint raised by adopter',
      actor: req.user.name || 'Adopter',
      actorRole: req.user.role,
      actionType: 'created'
    });
    await complaint.save();

    // Notify the user who is being complained against
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: againstUserId,
          recipientRole: againstRole,
          type: 'complaint',
          title: 'Complaint Filed',
          message: `${req.user.name} has raised a complaint against you: "${title}"`,
          data: { complaintId: complaint._id.toString() }
        });

        // Notify Admin
        await notificationService.createNotification({
          recipientId: 'admin',
          recipientRole: 'admin',
          type: 'complaint',
          title: 'New Complaint Raised',
          message: `A new complaint (${complaintNumber}) was raised against ${againstName} by ${req.user.name}`,
          data: { complaintId: complaint._id.toString() }
        });
        
        await logCommunication(complaint, 'in_app', 'admin', 'New Complaint Raised', `Complaint ${complaintNumber} raised`, 'sent');
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to dispatch notifications:', notifErr);
      }
    }

    // Send email notification to the user being complained against
    try {
      const againstUser = await User.findById(againstUserId);
      if (againstUser && againstUser.email) {
        await sendComplaintEmail(
          againstUser.email,
          againstUser.name,
          title,
          againstName,
          category,
          priority
        );
        await logCommunication(complaint, 'email', againstUser.email, `New Complaint Filed: ${title}`, `A complaint has been filed against you.`, 'sent');
      }
    } catch (emailErr) {
      console.error('[ComplaintRoutes] Failed to send complaint email:', emailErr);
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.status(201).json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error creating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints
 * @desc    Get complaints (filtered by role and advanced query parameters)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const query = {};

    // Role-based scoping
    if (req.user.role === 'admin') {
      // Admin sees everything
    } else if (req.user.role === 'adopter') {
      query.$or = [
        { raisedByUserId: req.user.id },
        { againstUserId: req.user.id }
      ];
    } else {
      query.againstUserId = req.user.id;
    }

    // Don't show merged tickets in main list
    query.mergedInto = { $exists: false };

    // Apply advanced filters
    const { status, priority, assignedStaffId, category, startDate, endDate, complaintNumber, raisedByName, email, phone } = req.query;
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedStaffId) {
      if (assignedStaffId === 'unassigned') {
        query.assignedUserId = { $exists: false };
      } else {
        query.assignedUserId = assignedStaffId;
      }
    }
    if (category) query.category = category;
    
    if (complaintNumber) {
      query.complaintNumber = { $regex: complaintNumber, $options: 'i' };
    }
    
    if (raisedByName) {
      query.raisedByName = { $regex: raisedByName, $options: 'i' };
    }

    if (email) {
      query.$or = query.$or || [];
      query.$or.push(
        { contactDetail: { $regex: email, $options: 'i' } },
        { raisedByName: { $regex: email, $options: 'i' } }
      );
    }

    if (phone) {
      query.contactDetail = { $regex: phone, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const list = await Complaint.find(query).sort({ createdAt: -1 });
    const formatted = list.map(c => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json(formatted);
  } catch (error) {
    console.error('[ComplaintRoutes] Error getting complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/export/batch
 * @desc    Export multiple complaints in CSV format
 * @access  Private (Admin/Staff only)
 */
router.get('/export/batch', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Not authorized to export data' });
    }

    const { ids } = req.query;
    let query = {};
    if (ids) {
      const idArray = ids.split(',');
      query._id = { $in: idArray };
    }

    // Role scoping
    if (req.user.role !== 'admin') {
      query.againstUserId = req.user.id;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    // Generate CSV content
    let csv = 'Complaint ID,Title,Status,Priority,Category,Raised By,Against,Created Date,First Response Due,Resolution Due,Satisfaction Rating,Satisfaction Comment\n';
    
    for (const c of complaints) {
      const row = [
        c.complaintNumber || c._id.toString(),
        `"${c.title.replace(/"/g, '""')}"`,
        c.status,
        c.priority,
        c.category,
        c.raisedByName,
        c.againstName,
        c.createdAt.toISOString(),
        c.firstResponseDueAt ? c.firstResponseDueAt.toISOString() : 'N/A',
        c.resolutionDueAt ? c.resolutionDueAt.toISOString() : 'N/A',
        c.satisfactionRating || 'N/A',
        c.satisfactionComment ? `"${c.satisfactionComment.replace(/"/g, '""')}"` : 'N/A'
      ];
      csv += row.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Complaint_Batch_Export_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('[ComplaintRoutes] Error batch exporting complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role check
    const hasPermission =
      req.user.role === 'admin' ||
      complaint.raisedByUserId === req.user.id ||
      complaint.againstUserId === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error getting complaint details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/:id/related
 * @desc    Get related complaints
 * @access  Private
 */
router.get('/:id/related', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Find complaints with same adopter, target, or category (excluding the current ticket)
    const related = await Complaint.find({
      _id: { $ne: complaint._id },
      mergedInto: { $exists: false },
      $or: [
        { raisedByUserId: complaint.raisedByUserId },
        { againstUserId: complaint.againstUserId },
        { category: complaint.category }
      ]
    }).limit(5).sort({ createdAt: -1 });

    const formatted = related.map(c => {
      const obj = c.toObject();
      obj.id = obj._id.toString();
      return obj;
    });

    res.json(formatted);
  } catch (error) {
    console.error('[ComplaintRoutes] Error getting related complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/complaints/:id/assign
 * @desc    Assign/Reassign complaint to staff
 * @access  Private (Admin/Staff only)
 */
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { assignedUserId, assignedUserName, assignedRole } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can assign complaints' });
    }

    const previousAssignee = complaint.assignedUserName || 'Unassigned';

    complaint.assignedUserId = assignedUserId;
    complaint.assignedUserName = assignedUserName;
    complaint.assignedRole = assignedRole;
    complaint.assignedByUserId = req.user.id;
    complaint.assignedByUserName = req.user.name;
    complaint.assignedAt = new Date();

    if (complaint.status === 'pending') {
      complaint.status = 'assigned';
    } else if (complaint.status === 'waiting_for_user') {
      // If reassigning from waiting_for_user, move back to under_review
      complaint.status = 'under_review';
    }

    // Add timeline entry
    complaint.timeline.push({
      status: complaint.status,
      date: new Date(),
      note: `Ticket assigned to ${assignedUserName} (${assignedRole}) by ${req.user.name} (previously: ${previousAssignee})`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'assigned'
    });

    await complaint.save();

    // Notify assigned staff
    const notificationService = getNotificationService();
    if (notificationService && assignedUserId) {
      try {
        await notificationService.createNotification({
          recipientId: assignedUserId,
          recipientRole: assignedRole,
          type: 'complaint_status',
          title: 'Ticket Assigned',
          message: `Complaint #${complaint.complaintNumber || complaint._id} has been assigned to you by ${req.user.name}`,
          data: { complaintId: complaint._id.toString() }
        });
        await logCommunication(complaint, 'in_app', assignedUserId, 'Ticket Assigned', `Assigned to you`, 'sent');
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send assignment notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error assigning complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/internal-notes
 * @desc    Add an internal note to the complaint
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/internal-notes', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can add internal notes' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note content cannot be empty' });
    }

    if (!complaint.internalNotes) complaint.internalNotes = [];
    complaint.internalNotes.push({
      note: text.trim(),
      addedBy: req.user.name,
      addedByRole: req.user.role,
      addedAt: new Date(),
      isPrivate: true
    });

    // Add timeline entry
    complaint.timeline.push({
      status: complaint.status,
      date: new Date(),
      note: `Internal note added by ${req.user.name} (${req.user.role})`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'internal_note'
    });

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error adding internal note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/request-info
 * @desc    Request more information from the adopter
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/request-info', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can request more information' });
    }

    complaint.status = 'waiting_for_user';

    // Add timeline entry
    complaint.timeline.push({
      status: 'waiting_for_user',
      date: new Date(),
      note: `More information requested by ${req.user.name}: "${text || 'Please provide additional details.'}"`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'request_info'
    });

    await complaint.save();

    // Send Notification to adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: complaint.raisedByUserId,
          recipientRole: 'adopter',
          type: 'complaint_status',
          title: 'Action Required: More Information Requested',
          message: `Support team has requested more details regarding your complaint "${complaint.title}"`,
          data: { complaintId: complaint._id.toString() }
        });
        await logCommunication(complaint, 'in_app', complaint.raisedByUserId, 'More Info Requested', `Details requested`, 'sent');
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send adopter notification:', notifErr);
      }
    }

    // Send email to adopter
    try {
      const adopter = await User.findById(complaint.raisedByUserId);
      if (adopter && adopter.email) {
        const emailHtml = `
          <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header Section -->
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pet Haven Connect</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #fef3c7; font-weight: 500;">Action Required</p>
              </div>

              <!-- Content Body -->
              <div style="padding: 40px; color: #334155;">
                <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${adopter.name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                  Our support team has reviewed your complaint and requires additional information to proceed with the investigation.
                </p>

                <!-- Complaint Details Card -->
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="font-size: 12px; font-weight: 600; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Complaint Details</p>
                  <p style="font-size: 14px; color: #92400e; margin: 0;">
                    <strong>Complaint ID:</strong> #${complaint.complaintNumber || complaint._id}
                  </p>
                  <p style="font-size: 14px; color: #92400e; margin: 5px 0 0 0;">
                    <strong>Title:</strong> "${complaint.title}"
                  </p>
                  <p style="font-size: 14px; color: #92400e; margin: 5px 0 0 0;">
                    <strong>Status:</strong> <span style="text-transform: capitalize; color: #d97706; font-weight: 700;">${complaint.status}</span>
                  </p>
                </div>

                <!-- Information Request Card -->
                <div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="font-size: 12px; font-weight: 600; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Information Requested</p>
                  <p style="font-size: 15px; color: #92400e; margin: 0; line-height: 1.6; font-style: italic;">
                    "${text || 'Please provide additional details, records or photos.'}"
                  </p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin-bottom: 25px;">
                  <a href="http://localhost:5173/adopter/complaints/${complaint._id}" target="_blank" style="background-color: #f59e0b; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);">
                    Reply to Ticket
                  </a>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                  Please log in to your dashboard, navigate to your complaint details, and submit your reply as soon as possible.
                </p>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                  Thank you for your cooperation,<br />
                  <strong>Pet Haven Connect Support Team</strong>
                </p>
              </div>

              <!-- Footer Section -->
              <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                  This is an automated email. Please do not reply directly to this mail.
                </p>
                <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                  © 2026 PetHaven Connect. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        `;

        await sendEmail({
          to: adopter.email,
          subject: `Action Required: More Info Requested on Complaint #${complaint.complaintNumber || complaint._id}`,
          html: emailHtml
        });
        await logCommunication(complaint, 'email', adopter.email, 'Action Required: More Info Requested', `Requested: ${text}`, 'sent');
      }
    } catch (emailErr) {
      console.error('[ComplaintRoutes] Failed to send request info email:', emailErr);
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error requesting information:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/send-reminder
 * @desc    Send a reminder to the adopter
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/send-reminder', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can send reminders' });
    }

    // Add timeline entry
    complaint.timeline.push({
      status: complaint.status,
      date: new Date(),
      note: `Reminder sent to adopter by ${req.user.name}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'reminder_sent'
    });

    await complaint.save();

    // Send Notification to adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: complaint.raisedByUserId,
          recipientRole: 'adopter',
          type: 'complaint_status',
          title: 'Reminder: Action Required on Your Ticket',
          message: `This is a reminder that we are waiting for your response on ticket #${complaint.complaintNumber || complaint._id}`,
          data: { complaintId: complaint._id.toString() }
        });
        await logCommunication(complaint, 'in_app', complaint.raisedByUserId, 'Ticket Reminder', `Reminder sent`, 'sent');
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send reminder notification:', notifErr);
      }
    }

    // Send email to adopter
    try {
      const adopter = await User.findById(complaint.raisedByUserId);
      if (adopter && adopter.email) {
        const emailHtml = `
          <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header Section -->
              <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
                <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">🔔</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pet Haven Connect</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #ede9fe; font-weight: 500;">Ticket Reminder</p>
              </div>

              <!-- Content Body -->
              <div style="padding: 40px; color: #334155;">
                <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${adopter.name},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                  This is a gentle reminder that our support team is waiting for your response regarding your complaint.
                </p>

                <!-- Complaint Details Card -->
                <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="font-size: 12px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Complaint Details</p>
                  <p style="font-size: 14px; color: #6d28d9; margin: 0;">
                    <strong>Complaint ID:</strong> #${complaint.complaintNumber || complaint._id}
                  </p>
                  <p style="font-size: 14px; color: #6d28d9; margin: 5px 0 0 0;">
                    <strong>Title:</strong> "${complaint.title}"
                  </p>
                  <p style="font-size: 14px; color: #6d28d9; margin: 5px 0 0 0;">
                    <strong>Status:</strong> <span style="text-transform: capitalize; color: #8b5cf6; font-weight: 700;">${complaint.status}</span>
                  </p>
                </div>

                <!-- Reminder Message Card -->
                <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="font-size: 12px; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Reminder</p>
                  <p style="font-size: 15px; color: #6d28d9; margin: 0; line-height: 1.6;">
                    Our support team is waiting for your response. Please log in to submit the requested details so that we can proceed with the investigation.
                  </p>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin-bottom: 25px;">
                  <a href="http://localhost:5173/adopter/complaints/${complaint._id}" target="_blank" style="background-color: #8b5cf6; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.2), 0 2px 4px -1px rgba(139, 92, 246, 0.1);">
                    Go to Ticket
                  </a>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                  If you have already submitted your response, please disregard this reminder.
                </p>

                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                  Thank you for your cooperation,<br />
                  <strong>Pet Haven Connect Support Team</strong>
                </p>
              </div>

              <!-- Footer Section -->
              <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                  This is an automated email. Please do not reply directly to this mail.
                </p>
                <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                  © 2026 PetHaven Connect. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        `;

        await sendEmail({
          to: adopter.email,
          subject: `Reminder: Action Required on Complaint #${complaint.complaintNumber || complaint._id}`,
          html: emailHtml
        });
        await logCommunication(complaint, 'email', adopter.email, 'Ticket Reminder', `Reminder email sent`, 'sent');
      }
    } catch (emailErr) {
      console.error('[ComplaintRoutes] Failed to send reminder email:', emailErr);
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error sending reminder:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/resolve
 * @desc    Resolve a complaint
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/resolve', auth, async (req, res) => {
  try {
    const { resolutionSummary, resolutionDetails, preventiveAction, finalRemarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can resolve complaints' });
    }

    complaint.status = 'resolved';
    complaint.resolutionSummary = resolutionSummary;
    complaint.resolutionNotes = resolutionDetails || resolutionSummary; // backward compatibility
    complaint.resolvedBy = req.user.name;
    complaint.resolvedAt = new Date();

    // Store new fields
    complaint.resolutionDetails = resolutionDetails;
    complaint.preventiveAction = preventiveAction;
    complaint.finalRemarks = finalRemarks;

    // Add timeline entry
    complaint.timeline.push({
      status: 'resolved',
      date: new Date(),
      note: `Complaint resolved by ${req.user.name}. Resolution: ${resolutionSummary}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'resolved'
    });

    await complaint.save();

    // Notify the adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: complaint.raisedByUserId,
          recipientRole: 'adopter',
          type: 'complaint_status',
          title: 'Complaint Resolved',
          message: `Your complaint regarding "${complaint.title}" has been resolved. Please review and rate our support.`,
          data: { complaintId: complaint._id.toString() }
        });
        await logCommunication(complaint, 'in_app', complaint.raisedByUserId, 'Complaint Resolved', `Resolved by ${req.user.name}`, 'sent');
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send resolution notification:', notifErr);
      }
    }

    // Send email to adopter
    try {
      if (complaint.raisedByUserId) {
        const adopter = await User.findById(complaint.raisedByUserId);
        if (adopter && adopter.email) {
          const emailHtml = `
            <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
              <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header Section -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 35px 40px; text-align: center; color: #ffffff;">
                  <div style="font-size: 32px; margin-bottom: 10px; display: inline-block;">✓</div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pet Haven Connect</h1>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #d1fae5; font-weight: 500;">Complaint Resolved</p>
                </div>

                <!-- Content Body -->
                <div style="padding: 40px; color: #334155;">
                  <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600; color: #0f172a;">Hello ${adopter.name},</h2>
                  <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                    Your complaint has been successfully resolved by our support team.
                  </p>

                  <!-- Complaint Details Card -->
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                    <p style="font-size: 12px; font-weight: 600; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Complaint Details</p>
                    <p style="font-size: 14px; color: #047857; margin: 0;">
                      <strong>Complaint ID:</strong> #${complaint.complaintNumber || complaint._id}
                    </p>
                    <p style="font-size: 14px; color: #047857; margin: 5px 0 0 0;">
                      <strong>Title:</strong> "${complaint.title}"
                    </p>
                    <p style="font-size: 14px; color: #047857; margin: 5px 0 0 0;">
                      <strong>Status:</strong> <span style="text-transform: capitalize; color: #10b981; font-weight: 700;">Resolved</span>
                    </p>
                  </div>

                  <!-- Resolution Summary Card -->
                  <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                    <p style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px;">Resolution Summary</p>
                    <p style="font-size: 15px; color: #065f46; margin: 0; line-height: 1.6;">
                      ${resolutionSummary}
                    </p>
                    ${preventiveAction ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #a7f3d0;">
                      <p style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 8px;">Preventive Action Taken</p>
                      <p style="font-size: 14px; color: #065f46; margin: 0; line-height: 1.6;">
                        ${preventiveAction}
                      </p>
                    </div>
                    ` : ''}
                  </div>

                  <!-- Action Button -->
                  <div style="text-align: center; margin-bottom: 25px;">
                    <a href="http://localhost:5173/adopter/complaints/${complaint._id}" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);">
                      Rate Our Support
                    </a>
                  </div>

                  <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 0;">
                    Please let us know how satisfied you are with our support by clicking the link above.
                  </p>

                  <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 25px; margin-bottom: 0;">
                    Thank you for your patience,<br />
                    <strong>Pet Haven Connect Support Team</strong>
                  </p>
                </div>

                <!-- Footer Section -->
                <div style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                    This is an automated email. Please do not reply directly to this mail.
                  </p>
                  <p style="font-size: 11px; color: #cbd5e1; margin-top: 8px; margin-bottom: 0;">
                    © 2026 PetHaven Connect. All rights reserved.
                  </p>
                </div>

              </div>
            </div>
          `;

          await sendEmail({
            to: adopter.email,
            subject: `Resolved: Complaint #${complaint.complaintNumber || complaint._id}`,
            html: emailHtml
          });
          await logCommunication(complaint, 'email', adopter.email, `Complaint Resolved: #${complaint.complaintNumber || complaint._id}`, `Resolved: ${resolutionSummary}`, 'sent');
          console.log('[ComplaintRoutes] Resolution email sent to adopter:', adopter.email);
        } else {
          console.warn('[ComplaintRoutes] Adopter not found or has no email:', complaint.raisedByUserId);
        }
      } else {
        console.warn('[ComplaintRoutes] Complaint has no raisedByUserId:', complaint._id);
      }
    } catch (emailErr) {
      console.error('[ComplaintRoutes] Failed to send resolution email:', emailErr);
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error resolving complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/save-draft
 * @desc    Save response draft for complaint
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/save-draft', auth, async (req, res) => {
  try {
    const { draft } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can save drafts' });
    }

    complaint.responseDraft = draft;
    complaint.lastUpdatedAt = new Date();
    complaint.lastUpdatedBy = req.user.name;

    // Add timeline entry for draft save
    complaint.timeline.push({
      status: complaint.status,
      date: new Date(),
      note: `Response draft saved by ${req.user.name}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'draft_saved'
    });

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error saving draft:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/submit-response
 * @desc    Submit response (Send or Save Draft)
 * @access  Private (Admin/Staff/Target partner)
 */
router.post('/:id/submit-response', auth, async (req, res) => {
  try {
    const { responseMessage, status, isDraft } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role check: Admin, Vet, Shelter (if target of the complaint), or the adopter who raised the complaint
    const isTargetUser = complaint.againstUserId && complaint.againstUserId.toString() === req.user.id.toString();
    const isCreator = complaint.raisedByUserId && complaint.raisedByUserId.toString() === req.user.id.toString();
    const isStaff = req.user.role === 'admin' || req.user.role === 'shelter' || req.user.role === 'vet' || req.user.role === 'veterinarian';
    
    if (!isStaff && !isTargetUser && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to respond to this complaint' });
    }

    if (isDraft) {
      complaint.responseDraft = responseMessage;
      
      // Add timeline entry
      complaint.timeline.push({
        status: complaint.status,
        date: new Date(),
        note: `Response draft saved by ${req.user.name}`,
        actor: req.user.name,
        actorRole: req.user.role,
        actionType: 'draft_saved'
      });
      
      await complaint.save();
      
      const obj = complaint.toObject();
      obj.id = obj._id.toString();
      return res.json(obj);
    }

    // Sending actual response
    if (!responseMessage || !responseMessage.trim()) {
      return res.status(400).json({ message: 'Response message cannot be empty' });
    }

    // Save to history if editing existing response AND content actually changed
    if (complaint.responseMessage && complaint.responseMessage.trim() !== responseMessage.trim()) {
      if (!complaint.responseHistory) complaint.responseHistory = [];
      complaint.responseHistory.push({
        message: complaint.responseMessage,
        respondedBy: complaint.respondedBy,
        respondedAt: complaint.respondedAt,
        updatedAt: complaint.lastUpdatedAt || new Date()
      });
    }

    const isFirstResponse = !complaint.firstRespondedAt;
    if (isFirstResponse) {
      complaint.firstRespondedAt = new Date();
    }

    complaint.responseMessage = responseMessage.trim();
    complaint.responseDraft = null; // Clear draft
    complaint.respondedBy = req.user.name;
    complaint.respondedAt = new Date();
    complaint.lastUpdatedAt = new Date();
    complaint.lastUpdatedBy = req.user.name;
    complaint.responseStatus = 'sent';
    complaint.notificationStatus = 'pending';
    complaint.notificationMethod = complaint.contactPreference;
    
    if (status) {
      complaint.status = status;
    } else if (complaint.status === 'pending' || complaint.status === 'assigned') {
      complaint.status = 'under_review';
    } else if (complaint.status === 'under_review') {
      complaint.status = 'waiting_for_user';
    }

    // Add timeline entry only if this is a new response or content changed
    const isContentChanged = !complaint.responseMessage || complaint.responseMessage.trim() !== responseMessage.trim();
    if (isContentChanged) {
      complaint.timeline.push({
        status: complaint.status,
        date: new Date(),
        note: complaint.responseHistory.length > 0 ? `Response updated by ${req.user.name}` : `Response sent by ${req.user.name}`,
        actor: req.user.name,
        actorRole: req.user.role,
        actionType: complaint.responseHistory.length > 0 ? 'response_updated' : 'response_sent'
      });
    }

    await complaint.save();

    // Send notifications to adopter based on contact preferences
    try {
      const user = await User.findById(complaint.raisedByUserId);
      if (user) {
        // Always send in-app notification
        const notificationService = getNotificationService();
        if (notificationService) {
          await notificationService.createNotification({
            recipientId: complaint.raisedByUserId,
            recipientRole: 'adopter',
            type: 'complaint_status',
            title: 'New Response on Your Complaint',
            message: `A new response has been posted regarding "${complaint.title}"`,
            data: { complaintId: complaint._id.toString() }
          });
          await logCommunication(complaint, 'in_app', complaint.raisedByUserId, 'New Response on Complaint', `Response sent`, 'sent');
        }

        // Email notification
        const preferences = complaint.contactPreference ? complaint.contactPreference.split(',') : ['email'];
        if (preferences.includes('email') && user.email) {
          await sendComplaintResponseEmail(
            user.email,
            user.name,
            complaint.complaintNumber || complaint._id.toString(),
            complaint.title,
            complaint.category,
            complaint.status,
            responseMessage,
            req.user.name
          );
          complaint.notificationStatus = 'sent';
          await complaint.save();
          await logCommunication(complaint, 'email', user.email, `Update on Your Complaint #${complaint.complaintNumber || complaint._id}`, `Response: ${responseMessage}`, 'sent');
        }
        
        if (preferences.includes('phone')) {
          // Log SMS (future ready)
          await logCommunication(complaint, 'sms', complaint.contactDetail || user.phone, `Update on Complaint #${complaint.complaintNumber || complaint._id}`, `Response: ${responseMessage}`, 'pending');
          console.log('[ComplaintRoutes] SMS notification logged as pending for:', complaint.contactDetail || user.phone);
        }
      }
    } catch (notifErr) {
      console.error('[ComplaintRoutes] Failed to send response notification:', notifErr);
      complaint.notificationStatus = 'failed';
      await complaint.save();
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error submitting response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/delete-draft
 * @desc    Delete the saved response draft
 * @access  Private (Admin/Staff/Target partner)
 */
router.post('/:id/delete-draft', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const isTargetUser = complaint.againstUserId && complaint.againstUserId.toString() === req.user.id.toString();
    const isStaff = req.user.role === 'admin' || req.user.role === 'shelter' || req.user.role === 'vet' || req.user.role === 'veterinarian';
    
    if (!isStaff && !isTargetUser) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    complaint.responseDraft = null;

    // Add timeline entry for draft deletion
    complaint.timeline.push({
      status: complaint.status,
      date: new Date(),
      note: `Response draft deleted by ${req.user.name}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'draft_deleted'
    });

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error deleting draft:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/satisfaction
 * @desc    Submit adopter satisfaction feedback and close the ticket
 * @access  Private (Adopter only)
 */
router.post('/:id/satisfaction', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.raisedByUserId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the adopter who raised the complaint can rate it' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' });
    }

    complaint.satisfactionRating = rating;
    complaint.satisfactionComment = comment;
    complaint.satisfactionSubmittedAt = new Date();
    complaint.status = 'closed';

    // Add timeline entry
    complaint.timeline.push({
      status: 'closed',
      date: new Date(),
      note: `Satisfaction rating submitted by adopter: ${rating} stars. Ticket closed.`,
      actor: req.user.name,
      actorRole: 'adopter',
      actionType: 'closed'
    });

    await complaint.save();

    // Notify assignee/admin
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        const recipients = [{ id: 'admin', role: 'admin' }];
        if (complaint.assignedUserId) {
          recipients.push({ id: complaint.assignedUserId, role: complaint.assignedRole });
        }

        for (const r of recipients) {
          await notificationService.createNotification({
            recipientId: r.id,
            recipientRole: r.role,
            type: 'complaint_status',
            title: 'Satisfaction Rating Submitted',
            message: `Adopter ${req.user.name} rated complaint #${complaint.complaintNumber || complaint._id} as ${rating} stars.`,
            data: { complaintId: complaint._id.toString() }
          });
        }
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send satisfaction notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error submitting satisfaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/check-sla-breaches
 * @desc    Check for SLA breaches and auto-escalate complaints
 * @access  Private (Admin only - typically called by cron job)
 */
router.post('/check-sla-breaches', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can trigger SLA breach checks' });
    }

    const now = new Date();
    const escalatedCount = { firstResponse: 0, resolution: 0 };

    // Find complaints that are not resolved/closed and have SLA breaches
    const overdueComplaints = await Complaint.find({
      status: { $in: ['pending', 'assigned', 'under_review', 'waiting_for_user', 'waiting_for_internal_team', 'reopened'] },
      $or: [
        { firstResponseDueAt: { $lt: now }, firstRespondedAt: { $exists: false } },
        { resolutionDueAt: { $lt: now }, status: { $ne: 'resolved' }, status: { $ne: 'closed' } }
      ]
    });

    for (const complaint of overdueComplaints) {
      const wasEscalated = complaint.isEscalated;
      let breachType = null;

      // Check first response SLA
      if (!complaint.firstRespondedAt && complaint.firstResponseDueAt && new Date(complaint.firstResponseDueAt) < now) {
        breachType = 'first_response';
        escalatedCount.firstResponse++;
      }
      // Check resolution SLA
      else if (complaint.resolutionDueAt && new Date(complaint.resolutionDueAt) < now && complaint.status !== 'resolved' && complaint.status !== 'closed') {
        breachType = 'resolution';
        escalatedCount.resolution++;
      }

      if (breachType && !wasEscalated) {
        complaint.isEscalated = true;
        
        // Add timeline entry
        complaint.timeline.push({
          status: complaint.status,
          date: new Date(),
          note: `SLA Breach detected: ${breachType === 'first_response' ? 'First response deadline missed' : 'Resolution deadline missed'}. Ticket auto-escalated.`,
          actor: 'System',
          actorRole: 'automation',
          actionType: 'escalated'
        });

        await complaint.save();

        // Notify admins about escalation
        const notificationService = getNotificationService();
        if (notificationService) {
          try {
            await notificationService.createNotification({
              recipientId: 'admin',
              recipientRole: 'admin',
              type: 'complaint_status',
              title: 'SLA Breach - Ticket Escalated',
              message: `Complaint #${complaint.complaintNumber || complaint._id} has been auto-escalated due to SLA breach (${breachType}).`,
              data: { complaintId: complaint._id.toString() }
            });
          } catch (notifErr) {
            console.error('[ComplaintRoutes] Failed to send escalation notification:', notifErr);
          }
        }
      }
    }

    res.json({
      message: 'SLA breach check completed',
      escalated: escalatedCount,
      totalChecked: overdueComplaints.length
    });
  } catch (error) {
    console.error('[ComplaintRoutes] Error checking SLA breaches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/analytics/metrics
 * @desc    Get complaint analytics metrics for dashboard
 * @access  Private (Admin only)
 */
router.get('/analytics/metrics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view analytics' });
    }

    const total = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const assigned = await Complaint.countDocuments({ status: 'assigned' });
    const underReview = await Complaint.countDocuments({ status: 'under_review' });
    const waitingUser = await Complaint.countDocuments({ status: 'waiting_for_user' });
    const waitingTeam = await Complaint.countDocuments({ status: 'waiting_for_internal_team' });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const closed = await Complaint.countDocuments({ status: 'closed' });
    const reopened = await Complaint.countDocuments({ status: 'reopened' });

    const critical = await Complaint.countDocuments({ priority: 'critical' });
    const high = await Complaint.countDocuments({ priority: 'high' });
    const medium = await Complaint.countDocuments({ priority: 'medium' });
    const low = await Complaint.countDocuments({ priority: 'low' });

    const escalated = await Complaint.countDocuments({ isEscalated: true });

    // SLA metrics
    const now = new Date();
    const firstResponseOverdue = await Complaint.countDocuments({
      firstResponseDueAt: { $lt: now },
      firstRespondedAt: { $exists: false },
      status: { $nin: ['resolved', 'closed'] }
    });
    const resolutionOverdue = await Complaint.countDocuments({
      resolutionDueAt: { $lt: now },
      status: { $nin: ['resolved', 'closed'] }
    });

    // Satisfaction metrics
    const withSatisfaction = await Complaint.countDocuments({ satisfactionRating: { $exists: true } });
    const avgSatisfaction = withSatisfaction > 0 
      ? await Complaint.aggregate([
          { $match: { satisfactionRating: { $exists: true } } },
          { $group: { _id: null, avgRating: { $avg: '$satisfactionRating' } } }
        ])
      : [{ avgRating: 0 }];

    res.json({
      total,
      byStatus: {
        pending,
        assigned,
        underReview,
        waitingUser,
        waitingTeam,
        resolved,
        closed,
        reopened
      },
      byPriority: {
        critical,
        high,
        medium,
        low
      },
      sla: {
        escalated,
        firstResponseOverdue,
        resolutionOverdue
      },
      satisfaction: {
        withRating: withSatisfaction,
        averageRating: avgSatisfaction[0]?.avgRating || 0
      }
    });
  } catch (error) {
    console.error('[ComplaintRoutes] Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/audit-log
 * @desc    Get audit log for a complaint
 * @access  Private (Admin/Staff only)
 */
router.get('/:id/audit-log', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can view audit logs' });
    }

    // Build comprehensive audit log from timeline and communication log
    const auditLog = [];
    
    // Add timeline entries
    if (complaint.timeline && complaint.timeline.length > 0) {
      complaint.timeline.forEach(entry => {
        auditLog.push({
          timestamp: entry.date,
          action: entry.actionType || 'status_change',
          actor: entry.actor,
          actorRole: entry.actorRole,
          details: entry.note,
          category: 'timeline'
        });
      });
    }
    
    // Add communication log entries
    if (complaint.communicationLog && complaint.communicationLog.length > 0) {
      complaint.communicationLog.forEach(entry => {
        auditLog.push({
          timestamp: entry.sentAt,
          action: 'communication',
          actor: 'System',
          actorRole: 'system',
          details: `${entry.method} sent to ${entry.recipient} - ${entry.subject}`,
          category: 'communication',
          status: entry.status
        });
      });
    }
    
    // Add response history entries
    if (complaint.responseHistory && complaint.responseHistory.length > 0) {
      complaint.responseHistory.forEach((entry, index) => {
        auditLog.push({
          timestamp: entry.respondedAt,
          action: 'response_version',
          actor: entry.respondedBy,
          actorRole: 'staff',
          details: `Response version ${index + 1} - ${entry.message.substring(0, 100)}...`,
          category: 'response_history'
        });
      });
    }
    
    // Add internal notes entries
    if (complaint.internalNotes && complaint.internalNotes.length > 0) {
      complaint.internalNotes.forEach(entry => {
        auditLog.push({
          timestamp: entry.addedAt,
          action: 'internal_note',
          actor: entry.addedBy,
          actorRole: entry.addedByRole,
          details: entry.note.substring(0, 100),
          category: 'internal_notes'
        });
      });
    }
    
    // Sort by timestamp descending
    auditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      complaintId: complaint._id.toString(),
      complaintNumber: complaint.complaintNumber,
      auditLog
    });
  } catch (error) {
    console.error('[ComplaintRoutes] Error fetching audit log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/check-sla-breaches
 * @desc    Check for SLA breaches and auto-escalate complaints
 * @access  Private (Admin only - typically called by cron job)
 */
router.post('/check-sla-breaches', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can trigger SLA breach checks' });
    }

    const now = new Date();
    const escalatedCount = { firstResponse: 0, resolution: 0 };

    // Check first response SLA breaches
    const firstResponseBreaches = await Complaint.find({
      firstResponseDueAt: { $lt: now },
      firstRespondedAt: { $exists: false },
      status: { $nin: ['resolved', 'closed', 'escalated'] },
      isEscalated: false
    });

    for (const complaint of firstResponseBreaches) {
      complaint.isEscalated = true;
      complaint.status = 'escalated';
      
      complaint.timeline.push({
        status: 'escalated',
        date: new Date(),
        note: 'Auto-escalated due to first response SLA breach',
        actor: 'System',
        actorRole: 'system',
        actionType: 'escalated'
      });

      await complaint.save();
      escalatedCount.firstResponse++;

      // Notify admins
      const notificationService = getNotificationService();
      if (notificationService) {
        try {
          await notificationService.createNotification({
            recipientId: 'admin',
            recipientRole: 'admin',
            type: 'sla_breach',
            title: 'SLA Breach: First Response Overdue',
            message: `Complaint #${complaint.complaintNumber || complaint._id} has been auto-escalated due to first response SLA breach`,
            data: { complaintId: complaint._id.toString() }
          });
        } catch (notifErr) {
          console.error('[ComplaintRoutes] Failed to send SLA breach notification:', notifErr);
        }
      }
    }

    // Check resolution SLA breaches
    const resolutionBreaches = await Complaint.find({
      resolutionDueAt: { $lt: now },
      status: { $nin: ['resolved', 'closed', 'escalated'] },
      isEscalated: false
    });

    for (const complaint of resolutionBreaches) {
      complaint.isEscalated = true;
      complaint.status = 'escalated';
      
      complaint.timeline.push({
        status: 'escalated',
        date: new Date(),
        note: 'Auto-escalated due to resolution SLA breach',
        actor: 'System',
        actorRole: 'system',
        actionType: 'escalated'
      });

      await complaint.save();
      escalatedCount.resolution++;

      // Notify admins
      const notificationService = getNotificationService();
      if (notificationService) {
        try {
          await notificationService.createNotification({
            recipientId: 'admin',
            recipientRole: 'admin',
            type: 'sla_breach',
            title: 'SLA Breach: Resolution Overdue',
            message: `Complaint #${complaint.complaintNumber || complaint._id} has been auto-escalated due to resolution SLA breach`,
            data: { complaintId: complaint._id.toString() }
          });
        } catch (notifErr) {
          console.error('[ComplaintRoutes] Failed to send SLA breach notification:', notifErr);
        }
      }
    }

    res.json({
      message: 'SLA breach check completed',
      escalated: escalatedCount,
      totalEscalated: escalatedCount.firstResponse + escalatedCount.resolution,
      timestamp: now
    });
  } catch (error) {
    console.error('[ComplaintRoutes] Error checking SLA breaches:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/accept-resolution
 * @desc    Adopter accepts resolution and closes ticket
 * @access  Private (Adopter only)
 */
router.post('/:id/accept-resolution', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Only the adopter who raised the complaint can accept resolution
    if (complaint.raisedByUserId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the adopter who raised the complaint can accept the resolution' });
    }

    // Can only accept if complaint is resolved
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Complaint must be resolved before accepting' });
    }

    complaint.status = 'closed';
    complaint.closedAt = new Date();
    complaint.closedBy = req.user.name;

    // Add timeline entry
    complaint.timeline.push({
      status: 'closed',
      date: new Date(),
      note: 'Resolution accepted by adopter. Ticket closed.',
      actor: req.user.name,
      actorRole: 'adopter',
      actionType: 'closed'
    });

    await complaint.save();

    // Notify assignee and admins
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        const recipients = [{ id: 'admin', role: 'admin' }];
        if (complaint.assignedUserId) {
          recipients.push({ id: complaint.assignedUserId, role: complaint.assignedRole });
        }

        for (const r of recipients) {
          await notificationService.createNotification({
            recipientId: r.id,
            recipientRole: r.role,
            type: 'complaint_status',
            title: 'Complaint Closed',
            message: `Adopter ${req.user.name} has accepted the resolution for complaint #${complaint.complaintNumber || complaint._id}`,
            data: { complaintId: complaint._id.toString() }
          });
        }
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send acceptance notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error accepting resolution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/reopen
 * @desc    Reopen a resolved or closed complaint
 * @access  Private (Adopter only)
 */
router.post('/:id/reopen', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.raisedByUserId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the adopter who raised the complaint can reopen it' });
    }

    complaint.status = 'reopened';
    complaint.isEscalated = false; // Reset escalation status on reopen
    
    // If reopened, move to under_review if assigned, otherwise pending
    if (complaint.assignedUserId) {
      complaint.status = 'under_review';
    } else {
      complaint.status = 'pending';
    }

    // Add timeline entry
    complaint.timeline.push({
      status: 'reopened',
      date: new Date(),
      note: `Complaint reopened by adopter. Reason: "${reason || 'Unresolved'}"`,
      actor: req.user.name,
      actorRole: 'adopter',
      actionType: 'reopened'
    });

    await complaint.save();

    // Notify assignee and admins
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        const recipients = [{ id: 'admin', role: 'admin' }];
        if (complaint.assignedUserId) {
          recipients.push({ id: complaint.assignedUserId, role: complaint.assignedRole });
        }

        for (const r of recipients) {
          await notificationService.createNotification({
            recipientId: r.id,
            recipientRole: r.role,
            type: 'complaint_status',
            title: 'Complaint Reopened',
            message: `Adopter ${req.user.name} has reopened complaint #${complaint.complaintNumber || complaint._id}`,
            data: { complaintId: complaint._id.toString() }
          });
        }
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send reopen notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error reopening complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/merge
 * @desc    Merge duplicate complaints into this primary complaint
 * @access  Private (Admin/Staff only)
 */
router.post('/:id/merge', auth, async (req, res) => {
  try {
    const { duplicateIds } = req.body;
    const primary = await Complaint.findById(req.params.id);

    if (!primary) {
      return res.status(404).json({ message: 'Primary complaint not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'shelter' && req.user.role !== 'vet' && req.user.role !== 'veterinarian') {
      return res.status(403).json({ message: 'Only staff can merge complaints' });
    }

    if (!duplicateIds || !Array.isArray(duplicateIds) || duplicateIds.length === 0) {
      return res.status(400).json({ message: 'Duplicate complaint IDs are required' });
    }

    if (!primary.mergedComplaints) primary.mergedComplaints = [];

    for (const dupId of duplicateIds) {
      if (dupId.toString() === primary._id.toString()) continue;

      const duplicate = await Complaint.findById(dupId);
      if (duplicate) {
        duplicate.status = 'closed';
        duplicate.mergedInto = primary._id;
        
        // Add timeline entry to duplicate
        duplicate.timeline.push({
          status: 'closed',
          date: new Date(),
          note: `This complaint has been merged as a duplicate into ticket #${primary.complaintNumber || primary._id} by ${req.user.name}`,
          actor: req.user.name,
          actorRole: req.user.role,
          actionType: 'closed'
        });
        await duplicate.save();

        // Add to primary list
        primary.mergedComplaints.push(duplicate._id);

        // Add timeline entry to primary
        primary.timeline.push({
          status: primary.status,
          date: new Date(),
          note: `Duplicate complaint #${duplicate.complaintNumber || duplicate._id} has been merged into this ticket by ${req.user.name}`,
          actor: req.user.name,
          actorRole: req.user.role,
          actionType: 'merge'
        });
      }
    }

    await primary.save();

    const obj = primary.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error merging complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/:id/export/pdf
 * @desc    Export an individual complaint as PDF
 * @access  Private
 */
router.get('/:id/export/pdf', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role check
    const hasPermission =
      req.user.role === 'admin' ||
      complaint.raisedByUserId === req.user.id ||
      complaint.againstUserId === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to export this complaint' });
    }

    // Render timeline HTML
    const timelineHtml = (complaint.timeline || []).map(t => `
      <div class="timeline-item">
        <div class="timeline-meta">
          <strong>${new Date(t.date).toLocaleString()}</strong><br/>
          <span>by ${t.actor} (${t.actorRole || 'N/A'})</span>
        </div>
        <div class="timeline-content">
          <p><strong>Status: ${t.status}</strong></p>
          <p>${t.note}</p>
        </div>
      </div>
    `).join('');

    // Render internal notes HTML
    const internalNotesHtml = (complaint.internalNotes || []).map(n => `
      <div class="note-item">
        <div class="note-header">
          <strong>${n.author} (${n.authorRole})</strong> - ${new Date(n.createdAt).toLocaleString()}
        </div>
        <div class="note-body">
          ${n.text}
        </div>
      </div>
    `).join('');

    // Render response history HTML
    const responseHistoryHtml = (complaint.responseHistory || []).map(h => `
      <div class="history-item">
        <div class="history-header">
          <strong>Responded By: ${h.respondedBy}</strong> - ${new Date(h.respondedAt).toLocaleString()}
        </div>
        <div class="history-body">
          ${h.message}
        </div>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Complaint Report - ${complaint.complaintNumber || complaint._id}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #334155;
            line-height: 1.5;
            padding: 20px;
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 3px solid #0d9488;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .logo {
            width: 50px;
            height: 50px;
            margin-right: 15px;
          }
          .header-title h1 {
            font-size: 22px;
            color: #0d9488;
            margin: 0;
          }
          .header-title p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
          .title-section {
            margin-bottom: 25px;
          }
          .title-section h2 {
            font-size: 20px;
            color: #0f172a;
            margin: 0 0 5px 0;
          }
          .title-section p {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
          }
          .card h3 {
            font-size: 14px;
            color: #0d9488;
            margin: 0 0 10px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .field {
            margin-bottom: 8px;
            font-size: 13px;
          }
          .field strong {
            color: #475569;
          }
          .badge {
            background: #f1f5f9;
            color: #475569;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
          }
          .badge.pending { background: #fef3c7; color: #d97706; }
          .badge.assigned { background: #e0f2fe; color: #0284c7; }
          .badge.under_review { background: #dbeafe; color: #2563eb; }
          .badge.waiting_for_user { background: #fce7f3; color: #db2777; }
          .badge.resolved { background: #dcfce7; color: #16a34a; }
          .badge.closed { background: #f1f5f9; color: #475569; }
          .badge.reopened { background: #fee2e2; color: #dc2626; }
          
          .section {
            margin-bottom: 25px;
          }
          .section h3 {
            font-size: 16px;
            color: #0f172a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 0;
            margin-bottom: 12px;
          }
          .desc-text {
            font-size: 13px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            white-space: pre-wrap;
          }
          .timeline-item, .note-item, .history-item {
            display: flex;
            margin-bottom: 15px;
            border-left: 3px solid #cbd5e1;
            padding-left: 15px;
            font-size: 12px;
          }
          .timeline-meta, .note-header, .history-header {
            min-width: 150px;
            color: #64748b;
          }
          .timeline-content, .note-body, .history-body {
            flex-grow: 1;
          }
          .timeline-content p, .note-body p, .history-body p {
            margin: 0 0 5px 0;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#0d9488"/>
            <ellipse cx="35" cy="35" rx="12" ry="16" fill="#fff" opacity="0.9"/>
            <ellipse cx="65" cy="35" rx="12" ry="16" fill="#fff" opacity="0.9"/>
            <ellipse cx="50" cy="58" rx="18" ry="14" fill="#fff" opacity="0.9"/>
            <circle cx="50" cy="72" r="8" fill="#f97316"/>
          </svg>
          <div class="header-title">
            <h1>Pet Haven Connect</h1>
            <p>Support Ticket Management System</p>
          </div>
        </div>

        <div class="title-section">
          <h2>${complaint.title}</h2>
          <p>Ticket ID: <strong>${complaint.complaintNumber || complaint._id}</strong> | Category: <strong>${complaint.category}</strong></p>
        </div>

        <div class="grid">
          <div class="card">
            <h3>Metadata</h3>
            <div class="field"><strong>Status:</strong> <span class="badge ${complaint.status}">${complaint.status}</span></div>
            <div class="field"><strong>Priority:</strong> <span class="badge">${complaint.priority}</span></div>
            <div class="field"><strong>Created Date:</strong> ${new Date(complaint.createdAt).toLocaleString()}</div>
            <div class="field"><strong>Preferred Contact:</strong> ${complaint.contactPreference} (${complaint.contactDetail})</div>
          </div>
          <div class="card">
            <h3>Assignment & People</h3>
            <div class="field"><strong>Raised By:</strong> ${complaint.raisedByName} (${complaint.raisedByRole})</div>
            <div class="field"><strong>Against:</strong> ${complaint.againstName} (${complaint.againstRole})</div>
            <div class="field"><strong>Assigned Staff:</strong> ${complaint.assignedUserName || 'Unassigned'}</div>
            <div class="field"><strong>Escalated:</strong> ${complaint.isEscalated ? 'Yes (SLA Breach)' : 'No'}</div>
          </div>
        </div>

        <div class="section">
          <h3>Description</h3>
          <div class="desc-text">${complaint.description}</div>
        </div>

        ${complaint.responseMessage ? `
        <div class="section">
          <h3>Latest Official Response</h3>
          <div class="desc-text" style="background: #f0fdf4; border-color: #bbf7d0;">
            <p style="margin:0 0 8px 0; font-size: 11px; color:#16a34a;">Responded by: <strong>${complaint.respondedBy}</strong> on ${new Date(complaint.respondedAt).toLocaleString()}</p>
            ${complaint.responseMessage}
          </div>
        </div>
        ` : ''}

        ${complaint.resolutionSummary ? `
        <div class="section">
          <h3>Resolution Summary</h3>
          <div class="desc-text" style="background: #ecfdf5; border-color: #a7f3d0;">
            <p style="margin: 0 0 5px 0;"><strong>Summary:</strong> ${complaint.resolutionSummary}</p>
            ${complaint.resolutionDetails ? `<p style="margin: 5px 0 0 0;"><strong>Details:</strong> ${complaint.resolutionDetails}</p>` : ''}
            ${complaint.preventiveAction ? `<p style="margin: 5px 0 0 0;"><strong>Preventive Action:</strong> ${complaint.preventiveAction}</p>` : ''}
            ${complaint.finalRemarks ? `<p style="margin: 5px 0 0 0;"><strong>Remarks:</strong> ${complaint.finalRemarks}</p>` : ''}
          </div>
        </div>
        ` : ''}

        ${complaint.satisfactionRating ? `
        <div class="section">
          <h3>Satisfaction Rating</h3>
          <div class="desc-text" style="background: #fffbeb; border-color: #fde68a;">
            <strong>Rating:</strong> ${complaint.satisfactionRating} / 5 Stars<br/>
            ${complaint.satisfactionComment ? `<strong>Comment:</strong> ${complaint.satisfactionComment}` : ''}
          </div>
        </div>
        ` : ''}

        ${complaint.internalNotes && complaint.internalNotes.length > 0 && req.user.role !== 'adopter' ? `
        <div class="section">
          <h3>Internal Investigation Notes (Staff Only)</h3>
          ${internalNotesHtml}
        </div>
        ` : ''}

        <div class="section" style="page-break-before: always;">
          <h3>Activity Feed & Audit Log</h3>
          ${timelineHtml}
        </div>

        <div class="footer">
          <p>Pet Haven Connect © 2026</p>
          <p>This report is generated automatically by Pet Haven Connect Support Ticket System</p>
        </div>
      </body>
      </html>
    `;

    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true
    };

    const file = { content: htmlContent };
    htmlPdf.generatePdf(file, options).then(pdfBuffer => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Complaint_${complaint.complaintNumber || complaint._id}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    }).catch(pdfErr => {
      console.error('[Export PDF] PDF generation error:', pdfErr);
      res.status(500).json({ message: 'Failed to generate PDF document' });
    });

  } catch (error) {
    console.error('[ComplaintRoutes] Error exporting complaint to PDF:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   GET /api/complaints/:id/export/csv
 * @desc    Export an individual complaint as CSV
 * @access  Private
 */
router.get('/:id/export/csv', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const hasPermission =
      req.user.role === 'admin' ||
      complaint.raisedByUserId === req.user.id ||
      complaint.againstUserId === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to export this complaint' });
    }

    const c = complaint;
    let csv = 'Field,Value\n';
    csv += `Complaint ID,${c.complaintNumber || c._id.toString()}\n`;
    csv += `Title,"${c.title.replace(/"/g, '""')}"\n`;
    csv += `Category,${c.category}\n`;
    csv += `Priority,${c.priority}\n`;
    csv += `Status,${c.status}\n`;
    csv += `Raised By,${c.raisedByName} (${c.raisedByRole})\n`;
    csv += `Against,${c.againstName} (${c.againstRole})\n`;
    csv += `Created Date,${c.createdAt.toISOString()}\n`;
    csv += `Assigned Staff,${c.assignedUserName || 'Unassigned'}\n`;
    csv += `First Response Due,${c.firstResponseDueAt ? c.firstResponseDueAt.toISOString() : 'N/A'}\n`;
    csv += `Resolution Due,${c.resolutionDueAt ? c.resolutionDueAt.toISOString() : 'N/A'}\n`;
    csv += `Escalated,${c.isEscalated ? 'Yes' : 'No'}\n`;
    csv += `Description,"${c.description.replace(/"/g, '""')}"\n`;
    csv += `Latest Response,"${(c.responseMessage || '').replace(/"/g, '""')}"\n`;
    csv += `Resolution Summary,"${(c.resolutionSummary || '').replace(/"/g, '""')}"\n`;
    csv += `Satisfaction Rating,${c.satisfactionRating || 'N/A'}\n`;
    csv += `Satisfaction Comment,"${(c.satisfactionComment || '').replace(/"/g, '""')}"\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Complaint_${c.complaintNumber || c._id}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('[ComplaintRoutes] Error exporting complaint to CSV:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Backward compatibility endpoints
 */

/**
 * @route   PUT /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private
 */
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const isTargetUser = complaint.againstUserId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isTargetUser) {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes;
    }
    complaint.resolvedBy = req.user.name;
    
    // Timeline entry
    complaint.timeline.push({
      status,
      date: new Date(),
      note: `Status updated from ${previousStatus} to ${status}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'status_changed'
    });

    await complaint.save();

    // Notify adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: complaint.raisedByUserId,
          recipientRole: 'adopter',
          type: 'complaint_status',
          title: 'Complaint Update',
          message: `Your complaint regarding "${complaint.title}" is now ${status}.`,
          data: { complaintId: complaint._id.toString() }
        });
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send update notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error updating complaint status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/start-investigation
 * @desc    Start investigation
 * @access  Private (Admin only)
 */
router.post('/:id/start-investigation', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can start investigation' });
    }

    complaint.status = 'under_review';
    complaint.investigationStartedAt = new Date();
    complaint.investigationStartedBy = req.user.name;
    complaint.investigationProgress = {
      underReview: true,
      contactedShelter: false,
      contactedAdopter: false,
      evidenceVerified: false,
      readyForResolution: false
    };

    complaint.timeline.push({
      status: 'under_review',
      date: new Date(),
      note: 'Investigation started',
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'status_changed'
    });

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error starting investigation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   PUT /api/complaints/:id/investigation
 * @desc    Update investigation details
 * @access  Private (Admin only)
 */
router.put('/:id/investigation', auth, async (req, res) => {
  try {
    const {
      investigationNotes,
      resolutionSummary,
      evidenceReviewed,
      investigationProgress
    } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update investigation' });
    }

    if (investigationNotes !== undefined) complaint.investigationNotes = investigationNotes;
    if (resolutionSummary !== undefined) complaint.resolutionSummary = resolutionSummary;
    if (evidenceReviewed) complaint.evidenceReviewed = { ...complaint.evidenceReviewed, ...evidenceReviewed };
    if (investigationProgress) complaint.investigationProgress = { ...complaint.investigationProgress, ...investigationProgress };

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error updating investigation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/timeline
 * @desc    Add timeline entry
 * @access  Private (Admin only)
 */
router.post('/:id/timeline', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can add timeline entries' });
    }

    complaint.timeline.push({
      status: status || complaint.status,
      date: new Date(),
      note: note || 'Status updated',
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'timeline_added'
    });

    await complaint.save();

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error adding timeline entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/complaints/:id/reject
 * @desc    Reject a complaint
 * @access  Private (Admin only)
 */
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can reject complaints' });
    }

    complaint.status = 'closed';
    complaint.rejectionReason = rejectionReason;
    complaint.resolvedBy = req.user.name;
    complaint.resolvedAt = new Date();

    // Add timeline entry
    complaint.timeline.push({
      status: 'closed',
      date: new Date(),
      note: `Complaint closed / rejected. Reason: ${rejectionReason}`,
      actor: req.user.name,
      actorRole: req.user.role,
      actionType: 'closed'
    });

    await complaint.save();

    // Notify adopter
    const notificationService = getNotificationService();
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: complaint.raisedByUserId,
          recipientRole: 'adopter',
          type: 'complaint_status',
          title: 'Complaint Closed',
          message: `Your complaint regarding "${complaint.title}" has been closed.`,
          data: { complaintId: complaint._id.toString() }
        });
      } catch (notifErr) {
        console.error('[ComplaintRoutes] Failed to send rejection notification:', notifErr);
      }
    }

    const obj = complaint.toObject();
    obj.id = obj._id.toString();
    res.json(obj);
  } catch (error) {
    console.error('[ComplaintRoutes] Error rejecting complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
