import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Textarea from '@/components/forms/Textarea';
import { useToast } from '@/context/ToastContext';
import { complaintService } from '@/services/complaintService';
import { formatStatusLabel } from '@/utils/formatters';
import { 
  FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiUser, 
  FiCalendar, FiPhone, FiMail, FiDownload, FiEye, FiX, FiCheck, FiStar 
} from 'react-icons/fi';

const STATUS_STAGES = [
  { id: 'pending', label: 'Pending' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'waiting_for_user', label: 'Waiting for You' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' }
];

export default function ComplaintDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // SLA Timers state
  const [slaTimers, setSlaTimers] = useState({ firstResponse: { text: 'N/A', status: 'normal' }, resolution: { text: 'N/A', status: 'normal' } });

  // Adopter interaction states
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Rating state
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getById(id);
      setComplaint(response);
    } catch (error) {
      console.error('Failed to load complaint:', error);
      toast('Failed to load complaint details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadComplaint();
    }
  }, [id]);

  // SLA Timer calculations
  const calculateSLATimeRemaining = (dueDate) => {
    if (!dueDate) return { text: 'N/A', status: 'normal' };
    const now = new Date().getTime();
    const due = new Date(dueDate).getTime();
    const diff = due - now;
    
    if (diff <= 0) {
      const overdueMs = Math.abs(diff);
      const hours = Math.floor(overdueMs / (1000 * 60 * 60));
      const mins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      return { text: `Overdue by: ${hours}h ${mins}m`, status: 'overdue' };
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const status = hours < 2 ? 'warning' : 'normal';
      return { text: `Due in: ${hours}h ${mins}m`, status };
    }
  };

  useEffect(() => {
    if (complaint) {
      const updateSla = () => {
        const firstResponseDue = complaint.firstRespondedAt 
          ? { text: 'Responded', status: 'normal' }
          : calculateSLATimeRemaining(complaint.firstResponseDueAt);
        const resolutionDue = calculateSLATimeRemaining(complaint.resolutionDueAt);
        
        setSlaTimers({ firstResponse: firstResponseDue, resolution: resolutionDue });
      };

      updateSla();
      const interval = setInterval(updateSla, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [complaint]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'; // Yellow
      case 'assigned': return 'info'; // Blue
      case 'under_review': return 'primary'; // Blue
      case 'waiting_for_user': return 'warning'; // Orange
      case 'waiting_for_internal_team': return 'warning'; // Orange
      case 'resolved': return 'success'; // Green
      case 'closed': return 'default'; // Gray
      case 'reopened': return 'danger'; // Purple
      case 'rejected': return 'danger'; // Red
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Actions
  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) {
      toast('Reply message cannot be empty', 'error');
      return;
    }
    setSubmittingReply(true);
    try {
      // Adopter response sets status back to 'under_review'
      const updated = await complaintService.submitResponse(complaint.id, replyMessage.trim(), 'under_review', false);
      setComplaint(updated);
      setReplyMessage('');
      toast('Reply sent successfully. Status changed back to Under Review.', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to send reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReopenSubmit = async () => {
    if (!reopenReason.trim()) {
      toast('Please enter a reason for reopening the complaint', 'error');
      return;
    }
    setSubmittingReopen(true);
    try {
      const updated = await complaintService.reopenComplaint(complaint.id, reopenReason.trim());
      setComplaint(updated);
      setShowReopenForm(false);
      setReopenReason('');
      toast('Complaint successfully reopened', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to reopen complaint', 'error');
    } finally {
      setSubmittingReopen(false);
    }
  };

  const handleSatisfactionSubmit = async () => {
    setSubmittingRating(true);
    try {
      const updated = await complaintService.submitSatisfaction(complaint.id, rating, ratingComment.trim());
      setComplaint(updated);
      setRatingComment('');
      toast('Thank you for your feedback! Ticket is now Closed.', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to submit feedback', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-500 font-medium">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="text-center py-16">
        <FiAlertCircle className="mx-auto text-6xl text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Complaint not found</h2>
        <Button onClick={() => navigate('/adopter/complaints')} className="cursor-pointer">Back to Complaints</Button>
      </div>
    );
  }

  const isPending = complaint.status === 'pending';
  const isAssigned = complaint.status === 'assigned';
  const isUnderReview = complaint.status === 'under_review' || complaint.status === 'reopened';
  const isWaitingUser = complaint.status === 'waiting_for_user';
  const isResolved = complaint.status === 'resolved';
  const isClosed = complaint.status === 'closed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white rounded-2xl border p-4 shadow-sm">
        <Button variant="outline" onClick={() => navigate('/adopter/complaints')} className="h-10 cursor-pointer">
          ← Back to Complaints
        </Button>
        <span className="text-sm font-bold text-slate-500">Ticket ID: {complaint.complaintNumber || complaint.id}</span>
      </div>

      {/* Status Progress Tracker */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {STATUS_STAGES.map((stage, idx) => {
            const isCurrent = complaint.status === stage.id || 
              (stage.id === 'under_review' && complaint.status === 'reopened');
            const currentIndex = STATUS_STAGES.findIndex(s => s.id === complaint.status || (s.id === 'under_review' && complaint.status === 'reopened'));
            const isCompleted = idx < currentIndex;
            
            return (
              <div key={stage.id} className="flex-1 w-full flex items-center justify-between sm:justify-center relative">
                <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-sm transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-teal-50 border-teal-500 text-teal-600 ring-4 ring-teal-500/20 scale-110'
                      : isCompleted
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? <FiCheck className="text-base" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${
                    isCurrent ? 'text-teal-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>{stage.label}</span>
                </div>
                {idx < STATUS_STAGES.length - 1 && (
                  <div className="hidden sm:block absolute right-0 top-4 w-full h-[2px] bg-slate-200 -z-10 translate-x-1/2">
                    <div className={`h-full bg-teal-600 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Main Details (70%) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Complaint Details Card */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">{complaint.title}</h1>
                <p className="text-xs text-slate-400">Category: {complaint.category}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority.toUpperCase()}</Badge>
                <Badge variant={getStatusColor(complaint.status)}>{formatStatusLabel(complaint.status)}</Badge>
              </div>
            </div>
            
            <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed mb-6">{complaint.description}</p>

            {/* Evidence details */}
            {complaint.evidence && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 mb-4">
                <h4 className="font-bold text-slate-700 mb-1">Evidence Summary</h4>
                <p>{complaint.evidence}</p>
              </div>
            )}

            {/* Attachments Section */}
            {complaint.attachments && complaint.attachments.length > 0 ? (
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Uploaded Attachments ({complaint.attachments.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {complaint.attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FiFileText className="text-teal-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{att.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-slate-400 mr-2">{formatFileSize(att.size)}</span>
                        <a
                          href={att.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${att.url}` : att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-500 hover:text-teal-700 p-1"
                          title="Preview"
                        >
                          <FiEye />
                        </a>
                        <a
                          href={att.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${att.url}` : att.url}
                          download={att.name}
                          className="text-teal-500 hover:text-teal-700 p-1"
                          title="Download"
                        >
                          <FiDownload />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <p className="text-xs text-slate-400 italic">No attachments uploaded.</p>
              </div>
            )}
          </div>

          {/* Admin Response Card */}
          {complaint.responseMessage && (
            <div className="bg-teal-50/30 rounded-2xl border border-teal-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-3">Official Response</h3>
              <div className="bg-white rounded-xl p-4 border border-teal-100 text-sm">
                <p className="text-slate-700 mb-3">{complaint.responseMessage}</p>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Responded by: {complaint.respondedBy} | Date: {new Date(complaint.respondedAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Adopter Response Composer (When waiting for adopter info) */}
          {isWaitingUser && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Submit Your Reply</h3>
              <p className="text-xs text-slate-400">Our staff is waiting for details. Type your response below to automatically update the ticket status back to Under Review.</p>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                rows={3}
              />
              <Button onClick={handleReplySubmit} disabled={submittingReply} className="cursor-pointer">
                {submittingReply ? 'Submitting...' : 'Send Reply'}
              </Button>
            </div>
          )}

          {/* Satisfaction Rating Card (When resolved) */}
          {isResolved && !complaint.satisfactionRating && (
            <div className="bg-amber-50/30 rounded-2xl border border-amber-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">How satisfied are you with our support?</h3>
              <p className="text-xs text-slate-500">Please take a moment to rate the resolution of your complaint. Rating this ticket will close it permanently.</p>
              
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl cursor-pointer transition focus:outline-none"
                  >
                    <FiStar 
                      className={
                        (hoverRating || rating) >= star 
                          ? 'fill-amber-400 text-amber-400 scale-110' 
                          : 'text-slate-300'
                      } 
                    />
                  </button>
                ))}
              </div>

              <Textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Optional feedback comments..."
                rows={2}
                className="bg-white border-amber-200 focus:ring-amber-500/20"
              />

              <div className="flex gap-2">
                <Button onClick={handleSatisfactionSubmit} disabled={submittingRating} className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
                  {submittingRating ? 'Submitting...' : 'Submit Rating & Close'}
                </Button>
                <Button variant="outline" onClick={() => setShowReopenForm(true)} className="text-red-500 border-red-100 hover:bg-red-50 cursor-pointer">
                  Reopen Complaint
                </Button>
              </div>
            </div>
          )}

          {/* Display Satisfaction rating if closed */}
          {complaint.satisfactionRating && (
            <div className="bg-slate-50 rounded-2xl border p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Your Feedback Rating</h3>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar key={star} className={complaint.satisfactionRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                ))}
              </div>
              {complaint.satisfactionComment && (
                <p className="text-xs text-slate-600 italic">"{complaint.satisfactionComment}"</p>
              )}
            </div>
          )}

          {/* Reopen Form */}
          {showReopenForm && (
            <div className="bg-red-50/30 rounded-2xl border border-red-100 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">Reopen Complaint</h3>
              <p className="text-xs text-slate-500">If the issue is not fully resolved, provide a reason below to reopen the ticket.</p>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why you are reopening this ticket..."
                rows={3}
                className="bg-white border-red-200 focus:ring-red-500/20"
              />
              <div className="flex gap-2">
                <Button onClick={handleReopenSubmit} disabled={submittingReopen} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                  {submittingReopen ? 'Submitting...' : 'Confirm Reopen'}
                </Button>
                <Button variant="outline" onClick={() => { setShowReopenForm(false); setReopenReason(''); }} className="cursor-pointer">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Activity Feed (Public Timeline) */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Activity Timeline</h3>
            <div className="relative border-l-2 border-slate-100 pl-6 space-y-6">
              {complaint.timeline && complaint.timeline.length > 0 ? (
                complaint.timeline.slice().reverse().map((entry, idx) => {
                  let iconBg = 'bg-slate-100 text-slate-500';
                  if (entry.actionType === 'created') iconBg = 'bg-teal-100 text-teal-600';
                  else if (entry.actionType === 'assigned') iconBg = 'bg-sky-100 text-sky-600';
                  else if (entry.actionType === 'response_sent') iconBg = 'bg-blue-100 text-blue-600';
                  else if (entry.actionType === 'resolved') iconBg = 'bg-green-100 text-green-600';
                  else if (entry.actionType === 'closed') iconBg = 'bg-slate-200 text-slate-700';
                  
                  return (
                    <div key={idx} className="relative text-xs">
                      <div className={`absolute -left-[38px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-white ${iconBg}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-semibold text-slate-800">{entry.note}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(entry.date).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Actor: {entry.actor}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic">No activity timeline available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Sidebar (30%) */}
        <div className="space-y-6">
          
          {/* SLA Tracking Card */}
          {!isResolved && !isClosed && (
            <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FiClock className="text-teal-500" /> Response Progress
              </h3>
              
              {!complaint.firstRespondedAt ? (
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>First Response:</span>
                    <span className={
                      slaTimers.firstResponse.status === 'overdue' 
                        ? 'text-red-500 font-bold' 
                        : slaTimers.firstResponse.status === 'warning'
                          ? 'text-amber-500 font-semibold animate-pulse'
                          : 'text-teal-600 font-medium'
                    }>{slaTimers.firstResponse.text}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${
                      slaTimers.firstResponse.status === 'overdue' 
                        ? 'bg-red-500 w-full' 
                        : slaTimers.firstResponse.status === 'warning'
                          ? 'bg-amber-400 w-3/4'
                          : 'bg-teal-500 w-1/2'
                    }`}></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1.5 rounded-lg">
                  <FiCheckCircle /> Response SLA Met
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Resolution SLA:</span>
                  <span className={
                    slaTimers.resolution.status === 'overdue' 
                      ? 'text-red-500 font-bold' 
                      : slaTimers.resolution.status === 'warning'
                        ? 'text-amber-500 font-semibold animate-pulse'
                        : 'text-teal-600 font-medium'
                  }>{slaTimers.resolution.text}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${
                    slaTimers.resolution.status === 'overdue' 
                      ? 'bg-red-500 w-full' 
                      : slaTimers.resolution.status === 'warning'
                        ? 'bg-amber-400 w-3/4'
                        : 'bg-teal-500 w-1/4'
                  }`}></div>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Information */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Ticket Information</h3>
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Complaint Number</p>
                <p className="font-bold text-slate-800">{complaint.complaintNumber || 'CMP-NEW'}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Current Status</p>
                <Badge variant={getStatusColor(complaint.status)}>{formatStatusLabel(complaint.status)}</Badge>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Priority</p>
                <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Complaint Against</p>
                <p className="font-semibold text-slate-800">{complaint.againstName}</p>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">{complaint.againstRole}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Preferred Contact Method</p>
                <p className="font-semibold text-slate-800 capitalize">{complaint.contactPreference} ({complaint.contactDetail})</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Assigned Investigator</p>
                <p className="font-semibold text-slate-800">{complaint.assignedUserName || 'Support Team Assignee Pending'}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Raised On</p>
                <p className="font-medium text-slate-700">{new Date(complaint.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Last Updated</p>
                <p className="font-medium text-slate-700">{new Date(complaint.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
