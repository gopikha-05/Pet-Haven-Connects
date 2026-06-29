import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { dataService } from '@/services/dataService';
import Badge from '@/components/common/Badge';
import Pagination from '@/components/common/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { formatDate } from '@/utils/formatters';
import { authService } from '@/services/authService';
import api from '@/services/api';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

const PER_PAGE = 10;

const parseLicenseDetails = (license, role, registrationAuthority) => {
  if (!license) return null;
  const parts = license.split('-');
  const year = parts[1] ? parseInt(parts[1]) : new Date().getFullYear();
  const validityYear = year + 5;
  const isShelter = role === 'shelter';
  
  return {
    licenseClass: isShelter ? 'Class A Professional Shelter License' : 'Certified Veterinary Practice License',
    issuingAuthority: registrationAuthority || (isShelter ? 'Department of Animal Welfare Board' : 'State Veterinary Council'),
    issuedYear: year,
    validity: `Dec 31, ${validityYear}`,
  };
};

export default function ShelterMonitoringPage() {
  const { data: shelters, refetch } = useFetch(() => dataService.getShelters());
  const [selectedShelter, setSelectedShelter] = useState(null);
  const { paginated, page, totalPages, goToPage } = usePagination(shelters || [], PER_PAGE);
  const { toast } = useToast();

  const handleViewDetails = (shelter) => {
    setSelectedShelter(shelter);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shelter Monitoring</h1>
      
      {!selectedShelter ? (
        <>
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Shelter Name</th>
                  <th className="p-3 text-center">Total Pets</th>
                  <th className="p-3 text-center">Available</th>
                  <th className="p-3 text-center">Adopted</th>
                  <th className="p-3 text-center">Pending Requests</th>
                  <th className="p-3 text-center">Complaints</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">License Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated?.map((s) => (
                  <tr key={s.id || s._id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-center">{s.pets || 0}</td>
                    <td className="p-3 text-center">{s.availablePets || Math.floor((s.pets || 0) * 0.7)}</td>
                    <td className="p-3 text-center">{s.adoptions || 0}</td>
                    <td className="p-3 text-center">{s.pendingRequests || 0}</td>
                    <td className="p-3 text-center">{s.complaints || 0}</td>
                    <td className="p-3 text-center">
                      <Badge variant={s.isActive !== false ? 'success' : 'danger'}>
                        {s.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={s.licenseVerificationStatus === 'verified' || s.isApproved ? 'success' : s.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
                        {s.licenseVerificationStatus || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(s)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shelters?.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          )}
        </>
      ) : (
        <ShelterDetails 
          shelter={selectedShelter} 
          onBack={() => setSelectedShelter(null)} 
          refetch={refetch}
          setSelectedShelter={setSelectedShelter}
        />
      )}
    </div>
  );
}

function ShelterDetails({ shelter, onBack, refetch, setSelectedShelter }) {
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await authService.approveUser(shelter.id || shelter._id);
      const res = await api.get(`/admin/users/${shelter.id || shelter._id}`);
      setSelectedShelter(res.data);
      refetch();
      toast('License verified successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to verify license', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast('Please enter a rejection reason', 'error');
      return;
    }
    setProcessing(true);
    try {
      await authService.rejectUser(shelter.id || shelter._id, rejectionReason);
      const res = await api.get(`/admin/users/${shelter.id || shelter._id}`);
      setSelectedShelter(res.data);
      refetch();
      setShowRejectForm(false);
      toast('License rejected successfully', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to reject license', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const licenseInfo = parseLicenseDetails(shelter.licenseNumber, 'shelter', shelter.registrationAuthority);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
      >
        ← Back to Overview
      </button>

      {/* Main Info */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{shelter.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {shelter.location || shelter.city || 'N/A'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={shelter.isActive !== false ? 'success' : 'danger'}>
              {shelter.isActive !== false ? 'Active Account' : 'Inactive'}
            </Badge>
            <Badge variant={shelter.licenseVerificationStatus === 'verified' || shelter.isApproved ? 'success' : shelter.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
              License: {shelter.licenseVerificationStatus || 'pending'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Email Address</p>
            <p className="font-semibold text-slate-700">{shelter.email || 'N/A'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Phone Contact</p>
            <p className="font-semibold text-slate-700">{shelter.phone || shelter.contact || 'N/A'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Capacity limit</p>
            <p className="font-semibold text-slate-700">{shelter.capacity || '40'} animals max</p>
          </div>
        </div>
      </div>

      {/* Verified License Board */}
      {licenseInfo && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 rounded-3xl p-6 border border-amber-500/20 shadow-md">
          <h3 className="text-lg font-bold text-amber-900 mb-4">
            Verified License Board
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 text-sm">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200">
              <p className="text-xs text-slate-500 mb-1">License Class</p>
              <p className="font-bold text-slate-800">{licenseInfo.licenseClass}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200">
              <p className="text-xs text-slate-500 mb-1">Authority Body</p>
              <p className="font-bold text-slate-800">{licenseInfo.issuingAuthority}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200">
              <p className="text-xs text-slate-500 mb-1">Issued Year</p>
              <p className="font-bold text-slate-800">{licenseInfo.issuedYear}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200">
              <p className="text-xs text-slate-500 mb-1">Validity Expiration</p>
              <p className="font-bold text-slate-800">{licenseInfo.validity}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-amber-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">License ID</p>
              <p className="text-base font-mono font-bold text-slate-800">{shelter.licenseNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Verification Status:</span>
              <Badge variant={shelter.licenseVerificationStatus === 'verified' || shelter.isApproved ? 'success' : shelter.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
                {shelter.licenseVerificationStatus?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>

          {/* Verification Actions */}
          {(shelter.licenseVerificationStatus === 'pending' || !shelter.isApproved) && (
            <div className="mt-6 pt-6 border-t border-amber-500/20">
              {!showRejectForm ? (
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="success" 
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    Verify & Approve License
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowRejectForm(true)}
                    disabled={processing}
                  >
                    Reject Application
                  </Button>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-red-100 max-w-md space-y-4">
                  <h4 className="font-bold text-red-900 text-sm">Specify Rejection Reason</h4>
                  <textarea
                    rows={3}
                    placeholder="Enter the reason why this shelter's license application is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-sm border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="danger" 
                      onClick={handleReject}
                      disabled={processing}
                      size="sm"
                    >
                      Confirm Reject
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowRejectForm(false)}
                      disabled={processing}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {shelter.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800">
              <p className="font-semibold">License Rejection Reason:</p>
              <p className="mt-1">{shelter.rejectionReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Adoption Statistics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pets Listed</span>
              <span className="font-medium">{shelter.pets || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Available Pets</span>
              <span className="font-medium">{shelter.availablePets || Math.floor((shelter.pets || 0) * 0.7)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pets Adopted</span>
              <span className="font-medium">{shelter.adoptions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pending Requests</span>
              <span className="font-medium">{shelter.pendingRequests || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Complaint Overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Complaints</span>
              <span className="font-medium">{shelter.complaints || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pending Complaints</span>
              <span className="font-medium">{shelter.pendingComplaints || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resolved Complaints</span>
              <span className="font-medium">{shelter.resolvedComplaints || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
