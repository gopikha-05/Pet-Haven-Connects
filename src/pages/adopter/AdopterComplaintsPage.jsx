import { useState } from 'react';
import { complaintService } from '@/services/complaintService';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';

const COMPLAINT_STATUS = {
  pending: 'Pending',
  under_review: 'Under Review',
  action_taken: 'Action Taken',
  waiting_confirmation: 'Waiting Confirmation',
  resolved: 'Resolved'
};

const STATUS_COLORS = {
  pending: 'warning',
  under_review: 'primary',
  action_taken: 'info',
  waiting_confirmation: 'warning',
  resolved: 'success'
};

export default function AdopterComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getAll({
        userId: user?.id,
        userRole: user?.role
      });
      setComplaints(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadComplaints();
  }, []);

  const getStatusColor = (status) => STATUS_COLORS[status] || 'default';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Complaints</h1>
      
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
                  <p className="text-sm text-slate-500 mt-1">
                    {complaint.raisedByUserId === user?.id ? 'You raised this complaint against' : 'Complaint raised against you'}{' '}
                    <span className="font-medium">{complaint.raisedByUserId === user?.id ? complaint.againstName : complaint.raisedByName}</span>
                    {' '}{complaint.raisedByUserId === user?.id ? `(${complaint.againstRole})` : `(${complaint.raisedByRole})`}
                  </p>
                </div>
                <Badge variant={getStatusColor(complaint.status)}>{COMPLAINT_STATUS[complaint.status]}</Badge>
              </div>
              
              <p className="text-slate-600 mb-3">{complaint.description}</p>
              
              {complaint.evidence && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Evidence:</p>
                  <p className="text-sm text-slate-700">{complaint.evidence}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Created {formatDate(complaint.createdAt)}</span>
                {complaint.resolutionNotes && (
                  <span className="text-slate-600">Resolution: {complaint.resolutionNotes}</span>
                )}
              </div>
              
              {complaint.timeline && complaint.timeline.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Timeline:</p>
                  <div className="space-y-2">
                    {complaint.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-400">{formatDate(event.date)}</span>
                        <span className="text-slate-600">
                          <span className="font-medium capitalize">{event.status.replace('_', ' ')}</span>
                          {' - '}{event.note}
                          {event.actor && <span className="text-slate-400"> (by {event.actor})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
