import mongoose from 'mongoose';

const reportMetadataSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: ['users', 'adoptions', 'shelters', 'veterinarians', 'pets', 'donations', 'complaints', 'financial', 'email', 'system']
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  executiveSummary: {
    type: String,
    default: ''
  },
  internalNotes: {
    type: String,
    default: ''
  },
  recommendations: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'in-review', 'published', 'archived'],
    default: 'draft'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  recordCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const ReportHistorySchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportMetadata',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'edited', 'status-changed', 'exported', 'archived', 'published']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ReportActivitySchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ReportMetadata = mongoose.model('ReportMetadata', reportMetadataSchema);
const ReportHistory = mongoose.model('ReportHistory', ReportHistorySchema);
const ReportActivity = mongoose.model('ReportActivity', ReportActivitySchema);

export { ReportMetadata, ReportHistory, ReportActivity };
