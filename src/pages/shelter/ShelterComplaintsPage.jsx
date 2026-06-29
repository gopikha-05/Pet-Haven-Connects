import { useState, useEffect } from 'react';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/forms/Textarea';
import Input from '@/components/forms/Input';
import { formatDate } from '@/utils/formatters';
import { COMPLAINT_STATUSES } from '@/mock/complaints';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

export default function ShelterComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showRectificationForm, setShowRectificationForm] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  
  const [rectificationData, setRectificationData] = useState({
    issueAnalysis: '',
    actionTaken: '',
    resolutionNotes: '',
    proofAttachment: '',
    estimatedResolutionTime: ''
  });

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
      // Filter to show only complaints raised against this shelter
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
      case 'pending': return 'warning';
      case 'under_review': return 'primary';
      case 'action_taken': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
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
      const resolutionText = rectificationData.resolutionNotes || `Status updated to ${newStatus}`;
      await complaintService.updateStatus(complaintId, newStatus, resolutionText, user?.name, user?.role);
      await loadComplaints();
      setShowRectificationForm(false);
      setRectificationData({ issueAnalysis: '', actionTaken: '', resolutionNotes: '', proofAttachment: '', estimatedResolutionTime: '' });
      toast(`Complaint status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      toast('Failed to update complaint status', 'error');
    }
  };

  const handleRectificationSubmit = async () => {
    if (!rectificationData.issueAnalysis || !rectificationData.actionTaken) {
      toast('Please fill in issue analysis and action taken', 'error');
      return;
    }
    
    const resolutionNotes = `Issue Analysis: ${rectificationData.issueAnalysis}\nAction Taken: ${rectificationData.actionTaken}\n${rectificationData.resolutionNotes ? `Resolution Notes: ${rectificationData.resolutionNotes}` : ''}\n${rectificationData.estimatedResolutionTime ? `Estimated Resolution Time: ${rectificationData.estimatedResolutionTime}` : ''}`;
    
    await handleUpdateStatus(selectedComplaint.id, 'action_taken');
    selectedComplaint.resolutionNotes = resolutionNotes;
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

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading complaints...</div>;
  }

  if (selectedComplaint) {
    return (
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
              <Badge variant={getStatusColor(selectedComplaint.status)}>{selectedComplaint.status}</Badge>
              <Badge variant="warning">{selectedComplaint.priority}</Badge>
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

          {/* Shelter Response Section */}
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
              {!showRectificationForm ? (
                <div className="flex gap-2 flex-wrap">
                  {selectedComplaint.status === 'pending' && (
                    <Button onClick={() => handleUpdateStatus(selectedComplaint.id, 'under_review')}>
                      Start Investigation
                    </Button>
                  )}
                  {selectedComplaint.status === 'under_review' && (
                    <Button onClick={() => setShowRectificationForm(true)}>
                      Submit Rectification
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
                  <h3 className="text-lg font-semibold">Rectification Form</h3>
                  <Textarea
                    label="Issue Analysis *"
                    value={rectificationData.issueAnalysis}
                    onChange={(e) => setRectificationData(prev => ({ ...prev, issueAnalysis: e.target.value }))}
                    placeholder="Analyze the issue in detail"
                    rows={3}
                  />
                  <Textarea
                    label="Action Taken *"
                    value={rectificationData.actionTaken}
                    onChange={(e) => setRectificationData(prev => ({ ...prev, actionTaken: e.target.value }))}
                    placeholder="Describe the actions taken to resolve the issue"
                    rows={3}
                  />
                  <Textarea
                    label="Resolution Notes"
                    value={rectificationData.resolutionNotes}
                    onChange={(e) => setRectificationData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                    placeholder="Additional resolution notes"
                    rows={2}
                  />
                  <Input
                    label="Proof Attachment (Optional)"
                    value={rectificationData.proofAttachment}
                    onChange={(e) => setRectificationData(prev => ({ ...prev, proofAttachment: e.target.value }))}
                    placeholder="Link to supporting documents"
                  />
                  <Input
                    label="Estimated Resolution Time (Optional)"
                    value={rectificationData.estimatedResolutionTime}
                    onChange={(e) => setRectificationData(prev => ({ ...prev, estimatedResolutionTime: e.target.value }))}
                    placeholder="e.g., 2 days, 1 week"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleRectificationSubmit}>Submit Rectification</Button>
                    <Button variant="outline" onClick={() => setShowRectificationForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Complaints Management</h1>
      
      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-slate-500">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-2xl border p-5 cursor-pointer hover:border-primary-300 transition" onClick={() => setSelectedComplaint(complaint)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{complaint.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {complaint.raisedByUserId === user?.id ? 'You raised this complaint against' : 'Complaint raised against you'}{' '}
                    <span className="font-medium">{complaint.raisedByUserId === user?.id ? complaint.againstName : complaint.raisedByName}</span>
                    {' '}{complaint.raisedByUserId === user?.id ? `(${complaint.againstRole})` : `(${complaint.raisedByRole})`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getStatusIcon(complaint.status)}
                  <Badge variant={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                  <Badge variant="warning">{complaint.priority}</Badge>
                </div>
              </div>
              
              <p className="text-slate-600 mb-3">{complaint.description}</p>
              
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Created {formatDate(complaint.createdAt)}</span>
                <span>Category: {complaint.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
