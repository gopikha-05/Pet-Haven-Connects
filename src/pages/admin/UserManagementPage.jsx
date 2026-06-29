import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { dataService } from '@/services/dataService';
import Badge from '@/components/common/Badge';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import Button from '@/components/common/Button';
import api from '@/services/api';
import { authService } from '@/services/authService';
import { FiEye, FiX, FiCheck, FiFileText } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';

const PER_PAGE = 10;

export default function UserManagementPage() {
  const { data: users, loading, refetch } = useFetch(() => dataService.getUsers());
  const { paginated, page, totalPages, goToPage } = usePagination(users || [], PER_PAGE);
  const [processing, setProcessing] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  // Auto-refresh users every 30 seconds to catch verification updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleReviewLicense = (user) => {
    setSelectedUser(user);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    const userId = selectedUser.id || selectedUser._id;
    setProcessing(userId);
    try {
      console.log('[UserManagement] Approving user via backend API:', selectedUser.email);
      await authService.approveUser(userId);
      setShowModal(false);
      setSelectedUser(null);
      refetch();
      toast('User approved successfully', 'success');
    } catch (error) {
      console.error('[UserManagement] Approval error:', error);
      toast(error.response?.data?.message || 'Failed to approve user', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast('Please enter a rejection reason', 'error');
      return;
    }
    
    const userId = selectedUser.id || selectedUser._id;
    setProcessing(userId);
    try {
      console.log('[UserManagement] Rejecting user via backend API:', selectedUser.email);
      await authService.rejectUser(userId, rejectionReason.trim());
      setShowModal(false);
      setSelectedUser(null);
      setRejectionReason('');
      refetch();
      toast('User rejected successfully', 'success');
    } catch (error) {
      console.error('[UserManagement] Rejection error:', error);
      toast(error.response?.data?.message || 'Failed to reject user', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    const userId = userToToggle.id || userToToggle._id;
    setProcessing(userId);
    try {
      await api.put(`/admin/users/${userId}/toggle-status`);
      refetch();
      toast('User status updated successfully', 'success');
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast(error.response?.data?.message || 'Failed to toggle status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleSendVerificationEmail = async (userToSend) => {
    const userId = userToSend.id || userToSend._id;
    setProcessing(userId);
    try {
      await api.post(`/auth/send-verification-email/${userId}`);
      toast('Verification email sent successfully to user', 'success');
      refetch();
    } catch (error) {
      console.error('Failed to send verification email:', error);
      toast(error.response?.data?.message || 'Failed to send verification email', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const getEmailVerificationStatus = (user) => {
    if (user.isEmailVerified) {
      return { status: 'verified', label: 'Verified', variant: 'success' };
    }
    if (user.emailVerificationToken) {
      return { status: 'pending', label: 'Verification Pending', variant: 'warning' };
    }
    return { status: 'not_sent', label: 'Not Sent', variant: 'danger' };
  };

  const getStatusBadge = (user) => {
    if (user.isApproved) {
      return <Badge variant="success">Approved</Badge>;
    }
    if (user.licenseVerificationStatus === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    return <Badge variant="warning">Pending</Badge>;
  };

  const needsApproval = (user) => {
    const role = user.role?.toLowerCase();
    return (role === 'shelter' || role === 'vet' || role === 'veterinarian') && !user.isApproved && user.licenseVerificationStatus === 'pending';
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>License ID</th>
              <th>Email Verified</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4">Loading...</td></tr>
            ) : paginated?.map((u) => (
              <tr key={`${u.id || u._id}-${u.licenseVerificationStatus}`} className="border-t">
                <td className="p-3 font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td className="capitalize"><Badge variant="primary">{u.role}</Badge></td>
                <td className="font-mono text-xs">{u.licenseNumber || '-'}</td>
                <td>
                  <Badge variant={getEmailVerificationStatus(u).variant}>
                    {getEmailVerificationStatus(u).label}
                  </Badge>
                </td>
                <td>{getStatusBadge(u)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {needsApproval(u) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewLicense(u)}
                      >
                        <FiEye className="mr-1" /> Review
                      </Button>
                    )}
                    {!u.isEmailVerified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendVerificationEmail(u)}
                        disabled={processing === (u.id || u._id)}
                      >
                        Send Verification Email
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="px-2"
                      variant={u.isActive !== false ? 'danger' : 'success'}
                      onClick={() => handleToggleStatus(u)}
                      disabled={processing === (u.id || u._id)}
                    >
                      {u.isActive !== false ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  {u.rejectionReason && (
                    <span className="text-xs text-red-600 block mt-1">{u.rejectionReason}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && users?.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}

      {/* License Review Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Review License Application</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-700 mb-2">Applicant Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name:</span>
                    <span className="font-medium">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <Badge variant="primary" className="capitalize">{selectedUser.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FiFileText /> License Details
                </h3>
                <div className="bg-white rounded border border-blue-200 p-3 font-mono text-center text-lg">
                  {selectedUser.licenseNumber}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  License format: {selectedUser.role === 'shelter' ? 'SHL-YYYY-XXXXX' : 'VET-YYYY-XXXXX'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Email Verified:</span>
                {selectedUser.isEmailVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Not Verified</Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                placeholder="Enter rejection reason (if rejecting)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm resize-none"
                rows="3"
              />
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="success"
                  loading={processing === (selectedUser._id || selectedUser.id)}
                  onClick={handleApprove}
                >
                  <FiCheck className="mr-1" /> Approve License
                </Button>
                <Button
                  className="flex-1"
                  variant="danger"
                  loading={processing === (selectedUser._id || selectedUser.id)}
                  onClick={handleReject}
                >
                  <FiX className="mr-1" /> Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}   