import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { complaintService } from '@/services/complaintService';
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '@/mock/complaints';
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintService.getAll({ userId: user?.id, userRole: 'adopter' });
      setComplaints(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadComplaints();
    }
  }, [user?.id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-slate-500" />;
      case 'under_review':
        return <FiAlertCircle className="text-blue-500" />;
      case 'action_taken':
        return <FiFileText className="text-purple-500" />;
      case 'resolved':
        return <FiCheckCircle className="text-green-500" />;
      case 'closed':
        return <FiCheckCircle className="text-slate-400" />;
      default:
        return <FiClock className="text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'under_review':
        return 'primary';
      case 'action_taken':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      case 'emergency':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading complaints...</div>;
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-16">
        <FiAlertCircle className="mx-auto text-6xl text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No complaints yet</h2>
        <p className="text-slate-500 mb-6">Raise a complaint if you have any issues</p>
        <Button onClick={() => navigate('/adopter/raise-complaint')}>Raise a Complaint</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Complaints</h1>
        <Button onClick={() => navigate('/adopter/raise-complaint')}>Raise a Complaint</Button>
      </div>
      
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{complaint.title}</h3>
                <p className="text-sm text-slate-500">Against: {complaint.againstName}</p>
              </div>
              <div className="flex gap-2">
                {getStatusIcon(complaint.status)}
                <Badge variant={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                <Badge variant={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-3">{complaint.description}</p>

            <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
              <span>Category: {complaint.category}</span>
              <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
            </div>

            <Button size="sm" variant="outline" onClick={() => navigate(`/adopter/complaints/${complaint.id}`)}>
              View Details
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
