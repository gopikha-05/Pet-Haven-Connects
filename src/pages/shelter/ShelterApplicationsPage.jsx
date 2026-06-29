import { useEffect, useState } from 'react';
import { applicationService } from '@/services/applicationService';
import { petService } from '@/services/petService';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import AdoptionReviewModal from '@/components/modals/AdoptionReviewModal';
import { useToast } from '@/context/ToastContext';
import { usePagination } from '@/hooks/usePagination';
import { APPLICATION_STATUS_LABELS } from '@/constants/status';

const PER_PAGE = 10;

export default function ShelterApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const { toast } = useToast();
  const { paginated, page, totalPages, goToPage } = usePagination(apps, PER_PAGE);

  const load = () => applicationService.getAll().then((r) => setApps(Array.isArray(r) ? r : (r.data || [])));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status, note) => {
    await applicationService.updateStatus(id, status, note || `Application ${status}`);
    toast(`Application ${status}`, 'success');
    
    // If approved, don't update pet status yet - wait for payment
    load();
  };

  const handleReview = (app) => {
    setSelectedApp(app);
  };

  const handleApprove = async (id) => {
    await updateStatus(id, 'approved', 'Application approved by shelter - awaiting payment');
    setSelectedApp(null);
  };

  const handleReject = async (id) => {
    const reason = prompt('Please provide rejection reason:');
    if (reason) {
      await updateStatus(id, 'rejected', reason);
      setSelectedApp(null);
    }
  };

  const handleRequestInfo = async (id) => {
    const info = prompt('What information do you need?');
    if (info) {
      await updateStatus(id, 'under_review', `Requesting more information: ${info}`);
      setSelectedApp(null);
    }
  };

  const handleMarkPickedUp = async (id) => {
    try {
      await applicationService.markAsPickedUp(id);
      toast('Pet marked as picked up. Adoption completed!', 'success');
      load();
    } catch (error) {
      console.error('Error marking as picked up:', error);
      toast('Failed to mark as picked up', 'error');
    }
  };

  const handleMarkDelivered = async (id) => {
    try {
      await applicationService.markAsDelivered(id);
      toast('Pet marked as delivered. Adoption completed!', 'success');
      load();
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast('Failed to mark as delivered', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Adoption Requests</h1>
      <div className="space-y-4">
        {paginated.map((app) => (
          <div key={app.id} className="bg-white rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">{app.petName} — {app.adopterName}</h3>
              <p className="text-sm text-slate-500">{app.reason}</p>
              <StatusBadge status={app.status} />
              {app.deliveryMethod && (
                <p className="text-xs text-slate-500 mt-1">
                  {app.deliveryMethod === 'take_away' ? 'Take Away (Pickup)' : 'Door Delivery'}
                  {app.scheduledPickupDate && ` - Pickup: ${new Date(app.scheduledPickupDate).toLocaleDateString()}`}
                  {app.scheduledDeliveryDate && ` - Delivery: ${new Date(app.scheduledDeliveryDate).toLocaleDateString()}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReview(app)}>View Details</Button>
              {app.status === 'pickup_scheduled' && (
                <Button size="sm" variant="primary" onClick={() => handleMarkPickedUp(app.id)}>
                  Mark as Picked Up
                </Button>
              )}
              {app.status === 'out_for_delivery' && (
                <Button size="sm" variant="primary" onClick={() => handleMarkDelivered(app.id)}>
                  Mark as Delivered
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {apps.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}
      
      {selectedApp && (
        <AdoptionReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestInfo={handleRequestInfo}
        />
      )}
    </div>
  );
}
