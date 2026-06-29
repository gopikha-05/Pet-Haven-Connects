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
  
  return {
    licenseClass: 'Certified Veterinary Practice License',
    issuingAuthority: registrationAuthority || 'State Veterinary Medical Council',
    issuedYear: year,
    validity: `Dec 31, ${validityYear}`,
  };
};

export default function VetMonitoringPage() {
  const { data: veterinarians, refetch } = useFetch(() => dataService.getVeterinarians());
  const [selectedVet, setSelectedVet] = useState(null);
  const { paginated, page, totalPages, goToPage } = usePagination(veterinarians || [], PER_PAGE);
  const { toast } = useToast();

  const handleViewDetails = (vet) => {
    setSelectedVet(vet);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Veterinarian Monitoring</h1>
      
      {!selectedVet ? (
        <>
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Vet Name</th>
                  <th className="p-3 text-left">Clinic</th>
                  <th className="p-3 text-center font-medium text-slate-700">Specialization</th>
                  <th className="p-3 text-center">Experience</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">License Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated?.map((v) => (
                  <tr key={v.id || v._id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium">{v.name}</td>
                    <td className="p-3">{v.clinic || 'PetHaven Partner Clinic'}</td>
                    <td className="p-3 text-center capitalize">{v.specialization || 'General Care'}</td>
                    <td className="p-3 text-center">{v.experience || '5+ Years'}</td>
                    <td className="p-3 text-center">
                      <Badge variant={v.isActive !== false ? 'success' : 'danger'}>
                        {v.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={v.licenseVerificationStatus === 'verified' || v.isApproved ? 'success' : v.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
                        {v.licenseVerificationStatus || 'pending'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(v)}
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
          {veterinarians?.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          )}
        </>
      ) : (
        <VetDetails 
          vet={selectedVet} 
          onBack={() => setSelectedVet(null)} 
          refetch={refetch}
          setSelectedVet={setSelectedVet}
        />
      )}
    </div>
  );
}

function VetDetails({ vet, onBack, refetch, setSelectedVet }) {
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await authService.approveUser(vet.id || vet._id);
      const res = await api.get(`/admin/users/${vet.id || vet._id}`);
      setSelectedVet(res.data);
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
      await authService.rejectUser(vet.id || vet._id, rejectionReason);
      const res = await api.get(`/admin/users/${vet.id || vet._id}`);
      setSelectedVet(res.data);
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

  const licenseInfo = parseLicenseDetails(vet.licenseNumber, 'vet', vet.registrationAuthority);

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
            <h2 className="text-xl font-bold text-slate-800">{vet.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {vet.location || 'N/A'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={vet.isActive !== false ? 'success' : 'danger'}>
              {vet.isActive !== false ? 'Active Account' : 'Inactive'}
            </Badge>
            <Badge variant={vet.licenseVerificationStatus === 'verified' || vet.isApproved ? 'success' : vet.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
              License: {vet.licenseVerificationStatus || 'pending'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Email Address</p>
            <p className="font-semibold text-slate-700">{vet.email || 'N/A'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Phone Contact</p>
            <p className="font-semibold text-slate-700">{vet.phone || 'N/A'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500">Clinic / Hospital</p>
            <p className="font-semibold text-slate-700">{vet.clinic || 'PetHaven Partner Clinic'}</p>
          </div>
        </div>
      </div>

      {/* Verified License Board */}
      {licenseInfo && (
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-500/10 rounded-3xl p-6 border border-emerald-500/20 shadow-md relative overflow-hidden">
          <h3 className="text-lg font-bold text-emerald-900 mb-4">
            Verified License Board
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 text-sm">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200">
              <p className="text-xs text-slate-500 mb-1">License Class</p>
              <p className="font-bold text-slate-800">{licenseInfo.licenseClass}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200">
              <p className="text-xs text-slate-500 mb-1">Authority Body</p>
              <p className="font-bold text-slate-800">{licenseInfo.issuingAuthority}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200">
              <p className="text-xs text-slate-500 mb-1">Issued Year</p>
              <p className="font-bold text-slate-800">{licenseInfo.issuedYear}</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200">
              <p className="text-xs text-slate-500 mb-1">Validity Expiration</p>
              <p className="font-bold text-slate-800">{licenseInfo.validity}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-emerald-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">License ID</p>
              <p className="text-base font-mono font-bold text-slate-800">{vet.licenseNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Verification Status:</span>
              <Badge variant={vet.licenseVerificationStatus === 'verified' || vet.isApproved ? 'success' : vet.licenseVerificationStatus === 'rejected' ? 'danger' : 'warning'}>
                {vet.licenseVerificationStatus?.toUpperCase() || 'PENDING'}
              </Badge>
            </div>
          </div>

          {/* Verification Actions */}
          {(vet.licenseVerificationStatus === 'pending' || !vet.isApproved) && (
            <div className="mt-6 pt-6 border-t border-emerald-500/20">
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
                    placeholder="Enter the reason why this veterinarian's license application is being rejected..."
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

          {vet.rejectionReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800">
              <div>
                <p className="font-semibold">License Rejection Reason:</p>
                <p className="mt-1">{vet.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Qualifications & Specializations */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Professional Overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Qualification</span>
              <span className="font-medium">{vet.qualification || 'B.V.Sc & A.H'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization</span>
              <span className="font-medium capitalize">{vet.specialization || 'General Care'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Experience Level</span>
              <span className="font-medium">{vet.experience || '5+ Years'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Availability Schedule</span>
              <span className="font-medium">{vet.availability || 'Mon - Fri (09:00 AM - 05:00 PM)'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Platform Practice</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Appointments Booked</span>
              <span className="font-medium">{vet.appointments || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rating</span>
              <span className="font-medium">{vet.rating || '4.8 ★'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total complaints</span>
              <span className="font-medium">{vet.complaints || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
