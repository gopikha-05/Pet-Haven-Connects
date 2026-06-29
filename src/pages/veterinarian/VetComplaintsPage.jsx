import { useState, useEffect } from 'react';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/forms/Textarea';
import Input from '@/components/forms/Input';
import { formatDate, formatStatusLabel } from '@/utils/formatters';
import { COMPLAINT_STATUSES } from '@/mock/complaints';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

export default function VetComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseForm, setResponseForm] = useState({
    issueAnalysis: '',
    actionTaken: '',
    resolutionNotes: '',
    proofAttachment: '',
    estimatedResolutionTime: ''
  });
  const [responseMessage, setResponseMessage] = useState('');
  const [isEditingResponse, setIsEditingResponse] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    if (selectedComplaint) {
      setResponseMessage(selectedComplaint.responseMessage || '');
      setIsEditingResponse(!!selectedComplaint.responseMessage);
    }
  }, [selectedComplaint]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getAll({
        userId: user?.id,
        userRole: user?.role
      });
      // Filter to show only complaints raised against this vet
      const complaintsList = Array.isArray(response) ? response : [];
      const filteredComplaints = complaintsList.filter(c => c.againstUserId === user?.id);
      setComplaints(filteredComplaints);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'; // Yellow
      case 'assigned': return 'info'; // Blue
      case 'under_review': return 'primary'; // Blue
      case 'waiting_for_user': return 'warning'; // Orange
      case 'waiting_for_internal_team': return 'warning'; // Orange
      case 'action_taken': return 'info'; // Blue
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
      case 'emergency': return 'danger';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-slate-500" />;
      case 'under_review': return <FiAlertCircle className="text-blue-500" />;
      case 'action_taken': return <FiFileText className="text-purple-500" />;
      case 'resolved': return <FiCheckCircle className="text-green-500" />;
      case 'closed': return <FiCheckCircle className="text-slate-400" />;
      default: return <FiClock className="text-slate-500" />;
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const resolutionText = responseForm.resolutionNotes || `Status updated to ${newStatus}`;
      await complaintService.updateStatus(complaintId, newStatus, resolutionText, user?.name, user?.role);
      await loadComplaints();
      setShowResponseForm(false);
      setResponseForm({ issueAnalysis: '', actionTaken: '', resolutionNotes: '', proofAttachment: '', estimatedResolutionTime: '' });
      toast(`Complaint status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      toast('Failed to update complaint status', 'error');
    }
  };

  const handleRectificationSubmit = async () => {
    if (!responseForm.issueAnalysis || !responseForm.actionTaken) {
      toast('Please fill in issue analysis and action taken', 'error');
      return;
    }
    
    const resolutionNotes = `Issue Analysis: ${responseForm.issueAnalysis}\nAction Taken: ${responseForm.actionTaken}\n${responseForm.resolutionNotes ? `Resolution Notes: ${responseForm.resolutionNotes}` : ''}\n${responseForm.estimatedResolutionTime ? `Estimated Resolution Time: ${responseForm.estimatedResolutionTime}` : ''}`;
    
    // Use submitResponse API for automatic notification
    try {
      const status = selectedComplaint.status === 'pending' ? 'under_review' : 'action_taken';
      const updated = await complaintService.submitResponse(selectedComplaint.id, resolutionNotes, status);
      setSelectedComplaint(updated);
      setIsEditingResponse(true);
      toast('Response submitted successfully', 'success');
      setShowResponseForm(false);
      setResponseForm({ issueAnalysis: '', actionTaken: '', resolutionNotes: '', proofAttachment: '', estimatedResolutionTime: '' });
      await loadComplaints();
    } catch (error) {
      console.error('Failed to submit response:', error);
      toast('Failed to submit response', 'error');
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) {
      toast('Please provide a response message', 'error');
      return;
    }
    try {
      const status = selectedComplaint.status === 'pending' ? 'under_review' : selectedComplaint.status;
      const updated = await complaintService.submitResponse(selectedComplaint.id, responseMessage, status);
      setSelectedComplaint(updated);
      setIsEditingResponse(true);
      toast(isEditingResponse ? 'Response updated successfully' : 'Response submitted successfully', 'success');
      await loadComplaints();
    } catch (error) {
      console.error('Failed to submit response:', error);
      toast('Failed to submit response', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Complaints Management</h1>
      
      {selectedComplaint ? (
        <div>
          <Button variant="outline" onClick={() => setSelectedComplaint(null)} className="mb-6">
            ← Back to Complaints
          </Button>
          
          <div className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{selectedComplaint.title}</h1>
                <p className="text-sm text-slate-500 mt-1">Complaint ID: {selectedComplaint.id}</p>
              </div>
              <div className="flex gap-2">
                {getStatusIcon(selectedComplaint.status)}
                <Badge variant={getStatusColor(selectedComplaint.status)}>{formatStatusLabel(selectedComplaint.status)}</Badge>
                <Badge variant={getPriorityColor(selectedComplaint.priority)}>{selectedComplaint.priority}</Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">Raised By</h3>
                <p className="font-medium">{selectedComplaint.raisedByName}</p>
                <p className="text-sm text-slate-500">{selectedComplaint.raisedByRole}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-600 mb-2">Category</h3>
                <p>{selectedComplaint.category}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Description</h3>
              <p className="text-slate-700">{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.evidence && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Evidence</h3>
                <p className="text-slate-700">{selectedComplaint.evidence}</p>
              </div>
            )}

            {selectedComplaint.resolutionNotes && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Resolution Notes</h3>
                <p className="text-slate-700 whitespace-pre-line">{selectedComplaint.resolutionNotes}</p>
              </div>
            )}

            {/* Admin Response Section */}
            <div className="mb-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Your Response</h3>
              
              {selectedComplaint.responseMessage && !isEditingResponse ? (
                <div className="mb-4">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Current Response</h4>
                    <p className="text-sm text-blue-700 mb-2">{selectedComplaint.responseMessage}</p>
                    <p className="text-xs text-blue-600">
                      Responded by: {selectedComplaint.respondedBy} | 
                      {selectedComplaint.respondedAt ? new Date(selectedComplaint.respondedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setIsEditingResponse(true)}>Edit Response</Button>
                </div>
              ) : (
                <div>
                  <Textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Write your response to the complainant..."
                    rows={4}
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmitResponse}>
                      {isEditingResponse ? 'Update Response' : 'Submit Response'}
                    </Button>
                    {isEditingResponse && (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingResponse(false)}>Cancel</Button>
                    )}
                  </div>
                </div>
              )}

              {/* Response History */}
              {selectedComplaint.responseHistory && selectedComplaint.responseHistory.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Response History</h4>
                  <div className="space-y-2">
                    {selectedComplaint.responseHistory.map((entry, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700">{entry.message}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          By: {entry.respondedBy} | 
                          Responded: {entry.respondedAt ? new Date(entry.respondedAt).toLocaleString() : 'N/A'}
                          {entry.updatedAt && ` | Updated: ${new Date(entry.updatedAt).toLocaleString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-600 mb-3">Timeline</h3>
              <div className="space-y-3">
                {selectedComplaint.timeline?.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${entry.status === 'resolved' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.note}</p>
                      <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                      <p className="text-xs text-slate-400">by {entry.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedComplaint.againstUserId === user?.id && selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'closed' && (
              <div className="mt-6 pt-6 border-t">
                {!showResponseForm ? (
                  <div className="flex gap-2">
                    {selectedComplaint.status === 'pending' && (
                      <Button onClick={() => handleUpdateStatus(selectedComplaint.id, 'under_review')}>
                        Start Investigation
                      </Button>
                    )}
                    {selectedComplaint.status === 'under_review' && (
                      <Button onClick={() => setShowResponseForm(true)}>
                        Submit Response
                      </Button>
                    )}
                    {selectedComplaint.status === 'action_taken' && (
                      <Button onClick={() => handleUpdateStatus(selectedComplaint.id, 'resolved')}>
                        Mark as Resolved
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Response Form</h3>
                    <Textarea
                      label="Issue Analysis *"
                      value={responseForm.issueAnalysis}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, issueAnalysis: e.target.value }))}
                      placeholder="Analyze the issue in detail"
                      rows={3}
                    />
                    <Textarea
                      label="Action Taken *"
                      value={responseForm.actionTaken}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, actionTaken: e.target.value }))}
                      placeholder="Describe the actions taken to resolve the issue"
                      rows={3}
                    />
                    <Textarea
                      label="Resolution Notes"
                      value={responseForm.resolutionNotes}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                      placeholder="Additional resolution notes"
                      rows={2}
                    />
                    <Input
                      label="Proof Attachment (Optional)"
                      value={responseForm.proofAttachment}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, proofAttachment: e.target.value }))}
                      placeholder="Link to supporting documents"
                    />
                    <Input
                      label="Estimated Resolution Time (Optional)"
                      value={responseForm.estimatedResolutionTime}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, estimatedResolutionTime: e.target.value }))}
                      placeholder="e.g., 2 days, 1 week"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleRectificationSubmit}>Submit Response</Button>
                      <Button variant="outline" onClick={() => setShowResponseForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center">
              <p className="text-slate-500">No complaints found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-white rounded-2xl border p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{complaint.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority?.toUpperCase()}</Badge>
                        <span className="text-xs text-slate-500 capitalize">{complaint.category || 'General'}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Raised by: <span className="font-medium">{complaint.raisedByName}</span> ({complaint.raisedByRole})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusIcon(complaint.status)}
                      <Badge variant={getStatusColor(complaint.status)}>{formatStatusLabel(complaint.status)}</Badge>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mb-3">{complaint.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Created {formatDate(complaint.createdAt)}</span>
                    <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(complaint)}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
