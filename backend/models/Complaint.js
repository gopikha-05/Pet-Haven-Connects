import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintNumber: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  raisedByUserId: { type: String, required: true },
  raisedByRole: { type: String, required: true },
  raisedByName: { type: String, required: true },
  againstUserId: { type: String, required: true },
  againstRole: { type: String, required: true },
  againstName: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true, default: 'medium' },
  description: { type: String, required: true },
  evidence: { type: String },
  contactPreference: { type: String, default: 'email' },
  contactDetail: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'under_review', 'waiting_for_user', 'waiting_for_internal_team', 'resolved', 'closed', 'reopened', 'rejected', 'escalated'], 
    default: 'pending' 
  },
  // Resolution fields (backward compatibility)
  resolutionNotes: { type: String, default: '' },
  resolutionSummary: { type: String }, // New field for detailed resolution
  resolutionDetails: { type: String }, // Additional resolution details
  preventiveAction: { type: String }, // Preventive action taken
  finalRemarks: { type: String }, // Final remarks
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  closedBy: { type: String },
  
  // Assignment fields
  assignedUserId: { type: String },
  assignedUserName: { type: String },
  assignedRole: { type: String },
  assignedByUserId: { type: String },
  assignedByUserName: { type: String },
  assignedAt: { type: Date },

  // SLA fields
  firstResponseDueAt: { type: Date },
  resolutionDueAt: { type: Date },
  firstRespondedAt: { type: Date },
  isEscalated: { type: Boolean, default: false },

  // Satisfaction Rating fields
  satisfactionRating: { type: Number, min: 1, max: 5 },
  satisfactionComment: { type: String },
  satisfactionSubmittedAt: { type: Date },

  // Duplicate Merge fields
  mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  mergedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],

  // Communication Log
  communicationLog: [{
    method: { type: String, enum: ['email', 'sms', 'in_app'], default: 'in_app' },
    recipient: { type: String },
    sentAt: { type: Date, default: Date.now },
    subject: { type: String },
    content: { type: String },
    status: { type: String, enum: ['sent', 'pending', 'failed'], default: 'sent' },
    retryAttempts: { type: Number, default: 0 }
  }],

  // Investigation fields (backward compatibility)
  investigationStartedAt: { type: Date },
  investigationStartedBy: { type: String },
  investigationNotes: { type: String },
  // resolutionSummary moved to Resolution fields above for better organization
  evidenceReviewed: {
    complaintDescription: { type: Boolean, default: false },
    uploadedEvidence: { type: Boolean, default: false },
    shelterResponse: { type: Boolean, default: false },
    paymentDetails: { type: Boolean, default: false },
    adoptionHistory: { type: Boolean, default: false }
  },
  investigationProgress: {
    underReview: { type: Boolean, default: false },
    contactedShelter: { type: Boolean, default: false },
    contactedAdopter: { type: Boolean, default: false },
    evidenceVerified: { type: Boolean, default: false },
    readyForResolution: { type: Boolean, default: false }
  },
  rejectionReason: { type: String },

  // Internal Notes (for admin/vet internal communication)
  internalNotes: [{
    note: { type: String, required: true },
    addedBy: { type: String, required: true },
    addedByRole: { type: String },
    addedAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: true }
  }],

  // Response fields
  responseMessage: { type: String },
  responseDraft: { type: String }, // Saved response draft
  respondedBy: { type: String },
  respondedAt: { type: Date },
  responseStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  lastUpdatedAt: { type: Date },
  lastUpdatedBy: { type: String },
  responseHistory: [{
    message: { type: String },
    respondedBy: { type: String },
    respondedAt: { type: Date },
    updatedAt: { type: Date }
  }],
  notificationStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  notificationMethod: { type: String },
  
  // Enhanced Timeline
  timeline: [{
    status: { type: String },
    date: { type: Date, default: Date.now },
    note: { type: String },
    actor: { type: String },
    actorRole: { type: String },
    actionType: { type: String }
  }],
  attachments: [{
    name: { type: String },
    url: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

complaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate complaint number if not set
  if (!this.complaintNumber) {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    this.complaintNumber = `CMP-${year}-${random}`;
  }
  
  next();
});

export default mongoose.model('Complaint', complaintSchema);
