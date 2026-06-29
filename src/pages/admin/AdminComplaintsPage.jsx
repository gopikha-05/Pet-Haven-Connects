import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/forms/Textarea';
import Input from '@/components/forms/Input';
import Pagination from '@/components/common/Pagination';
import { formatDate, formatStatusLabel } from '@/utils/formatters';
import { usePagination } from '@/hooks/usePagination';
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '@/mock/complaints';
import { 
  FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiUser, FiCalendar, 
  FiPhone, FiMail, FiLayers, FiDownload, FiEye, FiPlus, FiTrash, FiX, 
  FiCheck, FiFolder, FiBookmark, FiSearch, FiChevronRight, FiSettings,
  FiChevronDown, FiChevronUp, FiPaperclip, FiMessageSquare, FiLock, FiSend
} from 'react-icons/fi';

const PER_PAGE = 10;

const STATUS_STAGES = [
  { id: 'pending', label: 'Pending' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'waiting_for_user', label: 'Waiting for Adopter' },
  { id: 'waiting_for_internal_team', label: 'Waiting for Team' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' }
];

const CANNED_TEMPLATES = [
  { name: 'Payment Issue', text: 'Hello, regarding the payment issue you reported: we have verified the transaction records in our system. The payment is successfully processed and credited. Please refresh your dashboard or let us know if you still see any discrepancies.' },
  { name: 'Adoption Delay', text: 'Hello, regarding the delay in your adoption application: we have contacted the shelter to expedite the review process. Shelters typically take 2-3 business days to verify references. We will keep you updated as soon as they respond.' },
  { name: 'Pet Health', text: 'Hello, regarding your query about the pet\'s health records: the veterinarian has updated the medical history on the system. You can view the vaccination certificates and health reports directly in the pet\'s detail page.' },
  { name: 'License Verification', text: 'Hello, regarding the license verification status: our compliance team is currently reviewing the uploaded documents. This process usually takes 24 hours. We will notify you immediately upon verification.' },
  { name: 'Refund Request', text: 'Hello, regarding your refund request: we have initiated the refund process for your payment. It usually takes 5-7 business days to reflect in your original payment method. Thank you for your patience.' },
  { name: 'General Response', text: 'Hello, thank you for reaching out to Pet Haven Connect support. We are currently investigating your complaint and will get back to you with an update shortly. If you have any additional details to share, please reply here.' }
];

export default function AdminComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Advanced filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedStaffFilter, setAssignedStaffFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [complaintNumberFilter, setComplaintNumberFilter] = useState('');
  const [raisedByNameFilter, setRaisedByNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Saved filters state
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterNameInput, setFilterNameInput] = useState('');
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);

  // Users list for assignment
  const [usersList, setUsersList] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // SLA Timers state
  const [slaTimers, setSlaTimers] = useState({ firstResponse: { text: 'N/A', status: 'normal' }, resolution: { text: 'N/A', status: 'normal' } });

  // Related & Merged state
  const [relatedComplaints, setRelatedComplaints] = useState([]);

  // Merge modal state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSearchQuery, setMergeSearchQuery] = useState('');
  const [mergeSearchResults, setMergeSearchResults] = useState([]);
  const [selectedMergeIds, setSelectedMergeIds] = useState([]);
  const [merging, setMerging] = useState(false);

  // Investigation & Response state
  const [internalNoteText, setInternalNoteText] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [finalRemarks, setFinalRemarks] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  
  const [responseMessage, setResponseMessage] = useState('');
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [showOlderVersions, setShowOlderVersions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const { paginated, page, totalPages, goToPage } = usePagination(complaints, PER_PAGE);
  const responseTextareaRef = useRef(null);

  // Fetch complaints on load or filter change
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const filters = {
        status: statusFilter,
        priority: priorityFilter,
        assignedStaffId: assignedStaffFilter,
        category: categoryFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        complaintNumber: complaintNumberFilter,
        raisedByName: raisedByNameFilter,
        email: emailFilter,
        phone: phoneFilter
      };
      
      const response = await complaintService.getAll(filters);
      setComplaints(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assignment dropdown
  const loadUsersForAssignment = async () => {
    try {
      const response = await api.get('/admin/all-users');
      // Filter out only staff roles
      const staffList = (Array.isArray(response.data) ? response.data : [])
        .filter(u => u.role === 'admin' || u.role === 'shelter' || u.role === 'vet' || u.role === 'veterinarian');
      setUsersList(staffList);
    } catch (error) {
      console.error('Failed to load users for assignment:', error);
    }
  };

  useEffect(() => {
    loadComplaints();
    loadUsersForAssignment();
    
    // Load saved filters
    const saved = localStorage.getItem('pethaven_saved_complaint_filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved filters:', err);
      }
    }
  }, [statusFilter, priorityFilter, assignedStaffFilter, categoryFilter, startDateFilter, endDateFilter, complaintNumberFilter, raisedByNameFilter, emailFilter, phoneFilter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter - Send response
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (selectedComplaint && responseMessage.trim() && !submittingAction) {
          handleSendResponse();
        }
      }
      
      // Ctrl+S - Save draft
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (selectedComplaint && responseMessage.trim() && !submittingAction) {
          handleSaveDraft();
        }
      }
      
      // Esc - Cancel/close
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedComplaint) {
          setSelectedComplaint(null);
          setResponseMessage('');
          setIsEditingResponse(false);
        }
        if (showResolveModal) setShowResolveModal(false);
        if (showRejectModal) setShowRejectModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComplaint, responseMessage, submittingAction, showResolveModal, showRejectModal]);

  // SLA Real-time timer updates
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
    if (selectedComplaint) {
      // Set initial values
      setResponseMessage(selectedComplaint.responseDraft || selectedComplaint.responseMessage || '');
      setIsEditingResponse(!!selectedComplaint.responseMessage);
      
      // Load related tickets
      const fetchRelated = async () => {
        try {
          const related = await complaintService.getRelatedComplaints(selectedComplaint.id);
          setRelatedComplaints(related);
        } catch (err) {
          console.error('Failed to load related complaints:', err);
        }
      };
      fetchRelated();

      // Tick SLA timers every minute
      const updateSla = () => {
        const firstResponseDue = selectedComplaint.firstRespondedAt 
          ? { text: 'Responded', status: 'normal' }
          : calculateSLATimeRemaining(selectedComplaint.firstResponseDueAt);
        const resolutionDue = calculateSLATimeRemaining(selectedComplaint.resolutionDueAt);
        
        setSlaTimers({ firstResponse: firstResponseDue, resolution: resolutionDue });
      };

      updateSla();
      const interval = setInterval(updateSla, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [selectedComplaint]);

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (selectedComplaint) {
        // Esc -> Close modals
        if (e.key === 'Escape') {
          setShowRejectModal(false);
          setShowResolveModal(false);
          setShowMergeModal(false);
        }
        
        // Ctrl + S -> Save draft
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaveDraft();
        }
        
        // Ctrl + Enter -> Send Response
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleSendResponse();
        }
      }
    };
    
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [responseMessage, selectedComplaint]);

  // Auto-resize textarea handler
  const handleTextareaResize = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const handleResponseChange = (e) => {
    const value = e.target.value.slice(0, 2000);
    setResponseMessage(value);
    handleTextareaResize(e);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'; // Yellow
      case 'assigned': return 'info'; // Blue
      case 'under_review': return 'primary'; // Blue
      case 'waiting_for_user': return 'warning'; // Orange (using warning variant)
      case 'waiting_for_internal_team': return 'warning'; // Orange
      case 'resolved': return 'success'; // Green
      case 'closed': return 'default'; // Gray
      case 'reopened': return 'danger'; // Purple (using danger variant)
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-amber-500" />;
      case 'assigned': return <FiUser className="text-sky-500" />;
      case 'under_review': return <FiAlertCircle className="text-blue-500" />;
      case 'waiting_for_user': return <FiUser className="text-rose-500" />;
      case 'resolved': return <FiCheckCircle className="text-green-500" />;
      case 'closed': return <FiCheckCircle className="text-slate-400" />;
      default: return <FiClock className="text-slate-500" />;
    }
  };

  // Actions
  const handleAssignStaff = async (staffId) => {
    if (!staffId) return;
    const staff = usersList.find(u => (u.id || u._id) === staffId);
    if (!staff) return;
    if (submittingAction) return; // Prevent duplicate submissions

    setSubmittingAction(true);
    try {
      const updated = await complaintService.assign(selectedComplaint.id, {
        assignedUserId: staff.id || staff._id,
        assignedUserName: staff.name,
        assignedRole: staff.role
      });
      setSelectedComplaint(updated);
      toast(`Complaint successfully assigned to ${staff.name}`, 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to assign staff', 'error');
    } finally {
      setSubmittingAction(false);
      setIsAssigning(false);
    }
  };

  const handleAssignToMe = async () => {
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const updated = await complaintService.assign(selectedComplaint.id, {
        assignedUserId: user.id,
        assignedUserName: user.name,
        assignedRole: user.role
      });
      setSelectedComplaint(updated);
      toast('Complaint successfully assigned to you', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to assign to self', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveInternalNote = async () => {
    if (!internalNoteText.trim()) {
      toast('Note content cannot be empty', 'error');
      return;
    }
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const updated = await complaintService.addInternalNote(selectedComplaint.id, internalNoteText);
      setSelectedComplaint(updated);
      setInternalNoteText('');
      toast('Internal note saved successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save internal note', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    const text = prompt('Please enter the request message details for the adopter:');
    if (text === null) return; // cancelled
    if (!text.trim()) {
      toast('Request details cannot be empty', 'error');
      return;
    }
    if (submittingAction) return; // Prevent duplicate submissions

    setSubmittingAction(true);
    try {
      const updated = await complaintService.requestMoreInfo(selectedComplaint.id, text);
      setSelectedComplaint(updated);
      toast('Requested information from the adopter', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to request information', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendReminder = async () => {
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const updated = await complaintService.sendReminder(selectedComplaint.id);
      setSelectedComplaint(updated);
      toast('Reminder notification/email sent successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to send reminder', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleResolveComplaintSubmit = async () => {
    if (!resolutionSummary.trim()) {
      toast('Please provide a resolution summary', 'error');
      return;
    }
    if (submittingAction) return; // Prevent duplicate submissions

    setSubmittingAction(true);
    try {
      const updated = await complaintService.resolveComplaint(selectedComplaint.id, {
        resolutionSummary: resolutionSummary.trim(),
        resolutionDetails: resolutionDetails.trim(),
        preventiveAction: preventiveAction.trim(),
        finalRemarks: finalRemarks.trim()
      });
      setSelectedComplaint(updated);
      setShowResolveModal(false);
      setResolutionSummary('');
      setResolutionDetails('');
      setPreventiveAction('');
      setFinalRemarks('');
      toast('Complaint marked as resolved successfully', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to resolve complaint', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectComplaintSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast('Please provide a rejection reason', 'error');
      return;
    }
    setSubmittingAction(true);
    try {
      const updated = await complaintService.rejectComplaint(selectedComplaint.id, rejectionReason.trim());
      setSelectedComplaint(updated);
      setShowRejectModal(false);
      setRejectionReason('');
      toast('Complaint closed/rejected', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to reject complaint', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Response Composer handlers
  const handleSaveDraft = async () => {
    if (!responseMessage.trim()) return;
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const updated = await complaintService.saveDraft(selectedComplaint.id, responseMessage);
      setSelectedComplaint(updated);
      toast('Draft saved successfully (Ctrl+S)', 'success');
    } catch (err) {
      console.error('Failed to save draft:', err);
      toast('Failed to save draft', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!confirm('Are you sure you want to discard this draft?')) return;
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const updated = await complaintService.saveDraft(selectedComplaint.id, '');
      setSelectedComplaint(updated);
      setResponseMessage('');
      toast('Draft discarded', 'success');
    } catch (err) {
      console.error('Failed to discard draft:', err);
      toast('Failed to discard draft', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      toast('Response message cannot be empty', 'error');
      return;
    }
    if (submittingAction) return; // Prevent duplicate submissions
    setSubmittingAction(true);
    try {
      const status = selectedComplaint.status === 'pending' || selectedComplaint.status === 'assigned' 
        ? 'under_review' 
        : selectedComplaint.status;
      const updated = await complaintService.submitResponse(selectedComplaint.id, responseMessage.trim(), status, false);
      setSelectedComplaint(updated);
      setIsEditingResponse(false);
      toast('Response sent successfully (Ctrl+Enter)', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to send response', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Merge Dialog Search
  const handleMergeSearch = async () => {
    if (!mergeSearchQuery.trim()) return;
    try {
      const results = await complaintService.getAll({ complaintNumber: mergeSearchQuery });
      // Exclude current ticket
      const filtered = results.filter(c => c.id !== selectedComplaint.id);
      setMergeSearchResults(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMergeSubmit = async () => {
    if (selectedMergeIds.length === 0) {
      toast('Please select duplicate tickets to merge', 'error');
      return;
    }
    setMerging(true);
    try {
      const updated = await complaintService.mergeComplaints(selectedComplaint.id, selectedMergeIds);
      setSelectedComplaint(updated);
      setShowMergeModal(false);
      setSelectedMergeIds([]);
      setMergeSearchResults([]);
      setMergeSearchQuery('');
      toast('Complaints merged successfully', 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      toast('Failed to merge complaints', 'error');
    } finally {
      setMerging(false);
    }
  };

  // Saved Filters
  const handleSaveFilter = () => {
    if (!filterNameInput.trim()) return;
    const name = filterNameInput.trim();
    
    const newFilter = {
      name,
      filters: {
        status: statusFilter,
        priority: priorityFilter,
        assignedStaffId: assignedStaffFilter,
        category: categoryFilter,
        startDate: startDateFilter,
        endDate: endDateFilter,
        complaintNumber: complaintNumberFilter,
        raisedByName: raisedByNameFilter,
        email: emailFilter,
        phone: phoneFilter
      }
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('pethaven_saved_complaint_filters', JSON.stringify(updated));
    setFilterNameInput('');
    setShowSaveFilterModal(false);
    toast(`Filter "${name}" saved successfully`, 'success');
  };

  const handleRemoveSavedFilter = (e, index) => {
    e.stopPropagation();
    const updated = savedFilters.filter((_, idx) => idx !== index);
    setSavedFilters(updated);
    localStorage.setItem('pethaven_saved_complaint_filters', JSON.stringify(updated));
    toast('Saved filter removed', 'success');
  };

  const applySavedFilter = (f) => {
    setStatusFilter(f.filters.status || '');
    setPriorityFilter(f.filters.priority || '');
    setAssignedStaffFilter(f.filters.assignedStaffId || '');
    setCategoryFilter(f.filters.category || '');
    setStartDateFilter(f.filters.startDate || '');
    setEndDateFilter(f.filters.endDate || '');
    setComplaintNumberFilter(f.filters.complaintNumber || '');
    setRaisedByNameFilter(f.filters.raisedByName || '');
    setEmailFilter(f.filters.email || '');
    setPhoneFilter(f.filters.phone || '');
    toast(`Applied filter "${f.name}"`, 'success');
  };

  const clearAllFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setAssignedStaffFilter('');
    setCategoryFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setComplaintNumberFilter('');
    setRaisedByNameFilter('');
    setEmailFilter('');
    setPhoneFilter('');
    toast('Filters cleared', 'success');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isPending = selectedComplaint?.status === 'pending';
  const isAssigned = selectedComplaint?.status === 'assigned';
  const isUnderReview = selectedComplaint?.status === 'under_review' || selectedComplaint?.status === 'reopened';
  const isWaitingUser = selectedComplaint?.status === 'waiting_for_user';
  const isResolved = selectedComplaint?.status === 'resolved';
  const isClosed = selectedComplaint?.status === 'closed';

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Complaint Management</h1>
      
      {selectedComplaint ? (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm">
            <Button variant="outline" onClick={() => setSelectedComplaint(null)} className="h-10 cursor-pointer">
              ← Back to All Complaints
            </Button>
            
            {/* Quick Actions Panel */}
            <div className="flex gap-2 flex-wrap items-center">
              {isPending && (
                <>
                  <Button size="sm" onClick={handleAssignToMe} disabled={submittingAction} className="cursor-pointer">
                    Assign To Me
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAssigning(!isAssigning)} disabled={submittingAction} className="cursor-pointer">
                    Assign Staff
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectModal(true)} disabled={submittingAction} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 cursor-pointer">
                    Reject / Close
                  </Button>
                </>
              )}
              {(isAssigned || isUnderReview) && (
                <>
                  <Button size="sm" onClick={() => responseTextareaRef.current?.focus()} disabled={submittingAction} className="cursor-pointer">
                    Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRequestMoreInfo} disabled={submittingAction} className="cursor-pointer">
                    Request Info
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowResolveModal(true)} disabled={submittingAction} className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 cursor-pointer">
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAssigning(!isAssigning)} disabled={submittingAction} className="cursor-pointer">
                    Reassign
                  </Button>
                </>
              )}
              {isWaitingUser && (
                <>
                  <Button size="sm" onClick={handleSendReminder} disabled={submittingAction} className="cursor-pointer">
                    Send Reminder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => responseTextareaRef.current?.focus()} disabled={submittingAction} className="cursor-pointer">
                    Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowResolveModal(true)} disabled={submittingAction} className="text-green-600 border-green-200 hover:bg-green-50 cursor-pointer">
                    Resolve
                  </Button>
                </>
              )}
              {isResolved && (
                <Button size="sm" onClick={handleSendReminder} disabled={submittingAction} className="cursor-pointer">
                  Send Resolution Email
                </Button>
              )}
              
              <Button size="sm" variant="outline" onClick={() => window.open(complaintService.getExportPdfUrl(selectedComplaint.id))} className="cursor-pointer">
                Export PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(complaintService.getExportCsvUrl(selectedComplaint.id))} className="cursor-pointer">
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowMergeModal(true)} className="cursor-pointer">
                Merge Ticket
              </Button>
            </div>
          </div>

          {/* Status Progress Tracker */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {STATUS_STAGES.map((stage, idx) => {
                const isCurrent = selectedComplaint.status === stage.id || 
                  (stage.id === 'under_review' && selectedComplaint.status === 'reopened');
                const currentIndex = STATUS_STAGES.findIndex(s => s.id === selectedComplaint.status || (s.id === 'under_review' && selectedComplaint.status === 'reopened'));
                const isCompleted = idx < currentIndex;
                
                return (
                  <div key={stage.id} className="flex-1 w-full flex items-center justify-between md:justify-center relative group">
                    <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2">
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
                      <div className="hidden md:block absolute right-0 top-4 w-full h-[2px] bg-slate-200 -z-10 translate-x-1/2">
                        <div className={`h-full bg-teal-600 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Reassign Dropdown Panel */}
          {isAssigning && (
            <div className="bg-slate-50 rounded-2xl border p-4 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <FiUser className="text-teal-500 text-lg" />
                <span className="text-sm font-semibold text-slate-700">Assign Ticket To:</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  onChange={(e) => handleAssignStaff(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  defaultValue=""
                >
                  <option value="" disabled>Select Staff Member</option>
                  {usersList.map(u => (
                    <option key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => setIsAssigning(false)} className="cursor-pointer">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Main Layout - Zoho Desk Style 70/30 */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* LEFT Column - 70% */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Complaint Details Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedComplaint.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><FiFileText className="text-slate-400" /> {selectedComplaint.complaintNumber || selectedComplaint.id}</span>
                      <span>•</span>
                      <span>{new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(selectedComplaint.status)} className="text-sm">{formatStatusLabel(selectedComplaint.status)}</Badge>
                </div>
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                  <p className="whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>
                
                {/* Evidence Section */}
                {selectedComplaint.evidence && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidence Summary</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selectedComplaint.evidence}</p>
                  </div>
                )}

                {/* Attachments Section */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FiPaperclip /> Attachments ({selectedComplaint.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedComplaint.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex items-center gap-2 truncate">
                            <FiFileText className="text-teal-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700 truncate">{att.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400">{formatFileSize(att.size)}</span>
                            <a
                              href={att.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${att.url}` : att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-500 hover:text-teal-700 p-1"
                              title="Preview"
                              onClick={(e) => {
                                e.preventDefault();
                                setPreviewAttachment(att);
                                setShowAttachmentPreview(true);
                              }}
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
                ) : null}
              </div>

              {/* Conversation Thread - Latest Reply & Older Versions */}
              {selectedComplaint.responseMessage && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  {/* Latest Reply */}
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FiMessageSquare className="text-teal-500" /> Latest Reply
                      </h3>
                      <span className="text-xs text-slate-400">{new Date(selectedComplaint.respondedAt).toLocaleString()}</span>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                          {selectedComplaint.respondedBy?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{selectedComplaint.respondedBy}</p>
                          <p className="text-xs text-slate-500">Support Team</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedComplaint.responseMessage}</p>
                    </div>
                  </div>
                  
                  {/* Older Versions Accordion */}
                  {selectedComplaint.responseHistory && selectedComplaint.responseHistory.length > 0 && (
                    <div className="border-t border-slate-100">
                      <button
                        onClick={() => setShowOlderVersions(!showOlderVersions)}
                        className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FiClock /> Older Versions ({selectedComplaint.responseHistory.length})
                        </span>
                        {showOlderVersions ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                      {showOlderVersions && (
                        <div className="px-6 pb-6 space-y-3">
                          {selectedComplaint.responseHistory.slice().reverse().map((h, idx) => {
                            const versionNum = selectedComplaint.responseHistory.length - idx;
                            const date = new Date(h.respondedAt);
                            return (
                              <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-slate-600">Version {versionNum}</span>
                                  <span className="text-xs text-slate-400">{date.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-semibold">
                                    {h.respondedBy?.charAt(0) || 'A'}
                                  </div>
                                  <span className="text-xs text-slate-600">{h.respondedBy}</span>
                                </div>
                                <p className="text-xs text-slate-600 whitespace-pre-wrap">{h.message}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Response Composer - Single Unified Composer */}
              {(!isResolved && !isClosed) && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FiSend className="text-teal-500" /> {selectedComplaint.responseMessage ? 'Update Reply' : 'Reply to Complaint'}
                    </h3>
                    
                    {/* Canned Templates */}
                    <div className="mb-3">
                      <select
                        onChange={(e) => {
                          const template = CANNED_TEMPLATES.find(t => t.name === e.target.value);
                          if (template) setResponseMessage(template.text);
                          e.target.value = '';
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600"
                        defaultValue=""
                      >
                        <option value="" disabled>Choose a canned response...</option>
                        {CANNED_TEMPLATES.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Reply Textarea */}
                    <Textarea
                      ref={responseTextareaRef}
                      value={responseMessage}
                      onChange={handleResponseChange}
                      placeholder="Type your reply here..."
                      rows={6}
                      className="mb-3 text-sm resize-none"
                    />
                    
                    {/* Character Counter & Attachments */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-slate-400">{responseMessage.length} / 2000 characters</span>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1">
                          <FiPaperclip /> Add Attachment
                        </button>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSendResponse} disabled={submittingAction || !responseMessage.trim()} className="cursor-pointer">
                        <FiSend className="mr-1" /> Send Reply
                      </Button>
                      <Button variant="outline" onClick={handleSaveDraft} disabled={submittingAction} className="cursor-pointer">
                        Save Draft
                      </Button>
                      {selectedComplaint.responseDraft && (
                        <Button variant="outline" onClick={handleDeleteDraft} disabled={submittingAction} className="text-red-500 border-red-200 hover:bg-red-50 cursor-pointer">
                          Discard
                        </Button>
                      )}
                      {isEditingResponse && (
                        <Button variant="outline" onClick={() => {
                          setIsEditingResponse(false);
                          setResponseMessage(selectedComplaint.responseMessage);
                        }} className="cursor-pointer">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Internal Notes Section */}
              {selectedComplaint.internalNotes && selectedComplaint.internalNotes.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FiLock className="text-amber-500" /> Internal Notes
                    </h3>
                    <div className="space-y-3">
                      {selectedComplaint.internalNotes.map((note, idx) => (
                        <div key={idx} className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-700">{note.addedBy}</span>
                            <span className="text-xs text-slate-400">{new Date(note.addedAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Activity Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-6 flex items-center gap-2">
                    <FiClock className="text-teal-500" /> Activity Timeline
                  </h3>
                  <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
                    {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 ? (
                      selectedComplaint.timeline.slice().reverse().map((entry, idx) => {
                        let iconBg = 'bg-slate-100 text-slate-500';
                        let Icon = FiClock;
                        if (entry.actionType === 'created') { iconBg = 'bg-teal-100 text-teal-600'; Icon = FiCheckCircle; }
                        else if (entry.actionType === 'assigned') { iconBg = 'bg-sky-100 text-sky-600'; Icon = FiUser; }
                        else if (entry.actionType === 'internal_note') { iconBg = 'bg-amber-100 text-amber-600'; Icon = FiLock; }
                        else if (entry.actionType === 'response_sent') { iconBg = 'bg-blue-100 text-blue-600'; Icon = FiMessageSquare; }
                        else if (entry.actionType === 'response_updated') { iconBg = 'bg-indigo-100 text-indigo-600'; Icon = FiMessageSquare; }
                        else if (entry.actionType === 'resolved') { iconBg = 'bg-green-100 text-green-600'; Icon = FiCheckCircle; }
                        else if (entry.actionType === 'closed') { iconBg = 'bg-slate-200 text-slate-700'; Icon = FiCheckCircle; }
                        else if (entry.actionType === 'escalated') { iconBg = 'bg-red-100 text-red-600'; Icon = FiAlertCircle; }
                        
                        const date = new Date(entry.date);
                        
                        return (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-[38px] top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-2 border-white ${iconBg}`}>
                              <Icon className="text-sm" />
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                                <span className="text-sm font-semibold text-slate-800">{entry.note}</span>
                                <span className="text-xs text-slate-400 mt-1 sm:mt-0">{date.toLocaleDateString()} • {date.toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                By <span className="font-medium text-slate-700">{entry.actor}</span> • <span className="uppercase">{entry.actorRole || 'N/A'}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400 italic">No activity recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT Sidebar - 30% */}
            <div className="lg:col-span-3 space-y-6">
              <div className="lg:sticky lg:top-6 space-y-6">
              
              {/* Complaint Information Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiBookmark className="text-teal-500" /> Complaint Information
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <FiFileText className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Complaint ID</p>
                      <p className="font-bold text-slate-800">{selectedComplaint.complaintNumber || selectedComplaint.id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-1">Status</p>
                      <Badge variant={getStatusColor(selectedComplaint.status)}>{formatStatusLabel(selectedComplaint.status)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-1">Priority</p>
                      <Badge variant={getPriorityColor(selectedComplaint.priority)}>{selectedComplaint.priority.toUpperCase()}</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiFolder className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Category</p>
                      <p className="font-semibold text-slate-800">{selectedComplaint.category}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiUser className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Raised By</p>
                      <p className="font-semibold text-slate-800">{selectedComplaint.raisedByName}</p>
                      <p className="text-slate-400 text-[10px] uppercase font-semibold">{selectedComplaint.raisedByRole}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiCalendar className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Raised Date</p>
                      <p className="font-medium text-slate-700">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiUser className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Assigned Staff</p>
                      <p className="font-semibold text-slate-800">{selectedComplaint.assignedUserName || 'Unassigned'}</p>
                      {selectedComplaint.assignedRole && <p className="text-slate-400 text-[10px] uppercase font-semibold">{selectedComplaint.assignedRole}</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiPhone className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Preferred Contact</p>
                      <p className="font-semibold text-slate-800 capitalize">{selectedComplaint.contactPreference} ({selectedComplaint.contactDetail})</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400 mb-0.5">Last Updated</p>
                      <p className="font-medium text-slate-700">{new Date(selectedComplaint.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLA Information Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiClock className="text-teal-500" /> SLA Information
                </h3>
                <div className="space-y-3.5 text-xs">
                  {selectedComplaint.firstResponseDueAt && (
                    <div className="flex items-start gap-3">
                      <FiClock className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 mb-0.5">First Response Due</p>
                        <p className="font-medium text-slate-700">{new Date(selectedComplaint.firstResponseDueAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {selectedComplaint.resolutionDueAt && (
                    <div className="flex items-start gap-3">
                      <FiCalendar className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 mb-0.5">Resolution Due</p>
                        <p className="font-medium text-slate-700">{new Date(selectedComplaint.resolutionDueAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Notes Card */}
              {selectedComplaint.resolutionSummary && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-green-500" /> Resolution Notes
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Current Status:</span>
                        <Badge variant={getStatusColor(selectedComplaint.status)} className="text-xs">{formatStatusLabel(selectedComplaint.status)}</Badge>
                      </div>
                      {selectedComplaint.respondedBy && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Updated By:</span>
                          <span className="font-semibold text-slate-700">{selectedComplaint.respondedBy}</span>
                        </div>
                      )}
                      {selectedComplaint.respondedAt && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Updated On:</span>
                          <span className="font-semibold text-slate-700">{new Date(selectedComplaint.respondedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Notes:</span>
                        <p className="text-slate-700 mt-1 whitespace-pre-wrap">{selectedComplaint.resolutionSummary}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Bar & Saved Filters Section */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Complaint ID..."
                    value={complaintNumberFilter}
                    onChange={(e) => setComplaintNumberFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 w-48 sm:w-56 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Adopter Name..."
                    value={raisedByNameFilter}
                    onChange={(e) => setRaisedByNameFilter(e.target.value)}
                    className="px-4 py-2 w-40 sm:w-48 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <Button variant="outline" onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="h-9 text-xs cursor-pointer flex items-center gap-1.5">
                  <FiSettings /> {isFilterExpanded ? 'Hide Filters' : 'More Filters'}
                </Button>
                {(statusFilter || priorityFilter || assignedStaffFilter || categoryFilter || startDateFilter || endDateFilter || raisedByNameFilter || complaintNumberFilter || emailFilter || phoneFilter) && (
                  <Button variant="outline" onClick={clearAllFilters} className="h-9 text-xs text-red-500 border-red-100 hover:bg-red-50 cursor-pointer">
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button size="sm" onClick={() => setShowSaveFilterModal(true)} disabled={!(statusFilter || priorityFilter || assignedStaffFilter || categoryFilter)} className="cursor-pointer h-9 w-full md:w-auto">
                  <FiBookmark className="mr-1.5" /> Save Filter
                </Button>
              </div>
            </div>

            {/* Saved Filters Tags */}
            {savedFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap border-t pt-3.5">
                <span className="text-xs font-bold text-slate-500">Saved Filters:</span>
                {savedFilters.map((f, idx) => (
                  <div
                    key={idx}
                    onClick={() => applySavedFilter(f)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-100 rounded-lg text-xs font-medium cursor-pointer transition"
                  >
                    <span>{f.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSavedFilter(e, idx)}
                      className="text-teal-500 hover:text-teal-800 cursor-pointer"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Expanded Advanced Filters */}
            {isFilterExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="under_review">Under Review</option>
                    <option value="waiting_for_user">Waiting for Adopter</option>
                    <option value="waiting_for_internal_team">Waiting for Team</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Staff</label>
                  <select
                    value={assignedStaffFilter}
                    onChange={(e) => setAssignedStaffFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  >
                    <option value="">All Staff</option>
                    <option value="unassigned">Unassigned</option>
                    {usersList.map(u => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="text"
                    placeholder="Email..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Phone..."
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-600 font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Complaints Table/List */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 animate-pulse font-medium">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
              <FiFolder className="mx-auto text-5xl text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium text-sm">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white rounded-2xl border p-5 cursor-pointer hover:border-teal-300 hover:shadow-md hover:shadow-teal-500/5 transition duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="space-y-2 min-w-0 max-w-[80%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-600">{complaint.complaintNumber || 'CMP-NEW'}</span>
                      <h3 className="font-bold text-slate-800 text-base truncate">{complaint.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap font-medium">
                      <span className="flex items-center gap-1"><FiUser /> Adopter: {complaint.raisedByName}</span>
                      <span className="flex items-center gap-1"><FiCalendar /> Filed: {formatDate(complaint.createdAt)}</span>
                      <span>Category: {complaint.category}</span>
                      {complaint.assignedUserName && <span className="text-slate-500">Assigned: {complaint.assignedUserName}</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5 items-center flex-shrink-0 md:justify-end">
                    {complaint.isEscalated && (
                      <Badge variant="danger" className="animate-pulse">ESCALATED</Badge>
                    )}
                    <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority.toUpperCase()}</Badge>
                    <Badge variant={getStatusColor(complaint.status)}>{formatStatusLabel(complaint.status)}</Badge>
                    <FiChevronRight className="text-slate-400 text-lg hidden md:block" />
                  </div>
                </div>
              ))}
              
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          )}
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Save Current Filter</h3>
            <Input
              value={filterNameInput}
              onChange={(e) => setFilterNameInput(e.target.value)}
              placeholder="e.g. My Pending Tickets"
              label="Filter Name"
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={handleSaveFilter} className="cursor-pointer">Save</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowSaveFilterModal(false); setFilterNameInput(''); }} className="cursor-pointer">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Closure Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Reject & Close Complaint</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
            </div>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide reason for rejecting / closing this complaint (notified to adopter)..."
              rows={4}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleRejectComplaintSubmit} disabled={submittingAction} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                {submittingAction ? 'Processing...' : 'Confirm Rejection'}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectModal(false)} className="cursor-pointer">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Resolve Complaint</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
            </div>
            <div className="space-y-4">
              <Input
                label="Resolution Summary (Mandatory) *"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="Brief high-level summary of the resolution"
              />
              <Textarea
                label="Detailed Resolution Steps"
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                placeholder="Detailed description of the investigation and outcome..."
                rows={3}
              />
              <Textarea
                label="Preventive Action / Future Measures"
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="Actions taken to prevent this issue from recurring..."
                rows={2}
              />
              <Textarea
                label="Final Remarks / Closing Statement"
                value={finalRemarks}
                onChange={(e) => setFinalRemarks(e.target.value)}
                placeholder="Closing remarks for the adopter..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button onClick={handleResolveComplaintSubmit} disabled={submittingAction} className="bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                {submittingAction ? 'Processing...' : 'Resolve & Notify User'}
              </Button>
              <Button variant="outline" onClick={() => setShowResolveModal(false)} className="cursor-pointer">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Merge Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Merge Duplicate Tickets</h3>
              <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Search and select duplicate tickets to merge into the current primary ticket <strong>{selectedComplaint.complaintNumber}</strong>. Merged tickets will be permanently closed and linked.
            </p>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={mergeSearchQuery}
                onChange={(e) => setMergeSearchQuery(e.target.value)}
                placeholder="e.g. CMP-2026-000002"
                className="flex-1"
              />
              <Button size="sm" onClick={handleMergeSearch} className="cursor-pointer h-10 mt-1">Search</Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto mb-4 border rounded-xl p-2 bg-slate-50">
              {mergeSearchResults.length > 0 ? (
                mergeSearchResults.map(res => (
                  <label key={res.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMergeIds.includes(res.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMergeIds(prev => [...prev, res.id]);
                        } else {
                          setSelectedMergeIds(prev => prev.filter(id => id !== res.id));
                        }
                      }}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className="truncate flex-1">
                      <p className="font-bold text-slate-800 truncate">{res.title}</p>
                      <p className="text-slate-400 font-medium">{res.complaintNumber} | By: {res.raisedByName}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">No matching tickets found.</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={handleMergeSubmit} disabled={merging || selectedMergeIds.length === 0} className="cursor-pointer">
                {merging ? 'Merging...' : 'Merge Selected Tickets'}
              </Button>
              <Button variant="outline" onClick={() => { setShowMergeModal(false); setSelectedMergeIds([]); setMergeSearchResults([]); }} className="cursor-pointer">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {showAttachmentPreview && previewAttachment && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 truncate">{previewAttachment.name}</h3>
              <button onClick={() => setShowAttachmentPreview(false)} className="text-slate-400 hover:text-slate-600"><FiX /></button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {previewAttachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={previewAttachment.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${previewAttachment.url}` : previewAttachment.url} 
                  alt={previewAttachment.name}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : previewAttachment.name.match(/\.(pdf)$/i) ? (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-lg">
                  <FiFileText className="text-6xl text-slate-400 mb-4" />
                  <p className="text-slate-600">PDF Preview not available</p>
                  <a 
                    href={previewAttachment.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${previewAttachment.url}` : previewAttachment.url}
                    download={previewAttachment.name}
                    className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 cursor-pointer"
                  >
                    Download PDF
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-lg">
                  <FiFileText className="text-6xl text-slate-400 mb-4" />
                  <p className="text-slate-600">Preview not available for this file type</p>
                  <a 
                    href={previewAttachment.url.startsWith('/') ? `${api.defaults.baseURL.replace('/api', '')}${previewAttachment.url}` : previewAttachment.url}
                    download={previewAttachment.name}
                    className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 cursor-pointer"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
