import { useEffect, useState } from 'react';
import { applicationService } from '@/services/applicationService';
import { petService } from '@/services/petService';
import StatusBadge from '@/components/common/StatusBadge';
import Pagination from '@/components/common/Pagination';
import PaymentModal from '@/components/modals/PaymentModal';
import DeliverySelectionModal from '@/components/modals/DeliverySelectionModal';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';
import { CardSkeleton } from '@/components/common/Skeleton';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/common/EmptyState';
import { FiInbox, FiEye, FiX } from 'react-icons/fi';
import { APPLICATION_STATUS_LABELS } from '@/constants/status';

const PER_PAGE = 10;

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const { paginated, page, totalPages, goToPage } = usePagination(apps || [], PER_PAGE);
  const { toast } = useToast();

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    applicationService.getAll({ adopterId: user.id })
      .then((r) => {
        const data = Array.isArray(r) ? r : (r?.data || []);
        setApps(data);
      })
      .catch((err) => {
        console.error('Failed to load applications:', err);
        setApps([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.id) {
      load();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handlePaymentComplete = async () => {
    if (showPaymentModal) {
      try {
        toast('Payment successful! Please select your delivery method.', 'success');
        setShowPaymentModal(null);
        load();
      } catch (error) {
        console.error('Failed to complete payment:', error);
        toast('Payment failed', 'error');
      }
    }
  };

  const handleDeliveryConfirm = async (details) => {
    try {
      toast('Delivery method selected successfully!', 'success');
      setShowDeliveryModal(null);
      load();
    } catch (error) {
      console.error('Failed to set delivery method:', error);
      toast('Failed to set delivery method', 'error');
    }
  };

  if (loading) return <CardSkeleton />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Application Tracker</h1>
      {!apps || apps.length === 0 ? (
        <EmptyState
          icon={FiInbox}
          title="No applications found"
          description="You haven't submitted any adoption applications yet."
        />
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl border p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{app.petName}</h3>
                    <p className="text-sm text-slate-500">Submitted {formatDate(app.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    {app.paymentStatus && (
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        (app.paymentStatus === 'failed' || app.paymentStatus === 'expired' || app.paymentStatus === 'cancelled') ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Payment {app.paymentStatus}
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setShowDetailsModal(app)}>
                      <FiEye className="mr-1" /> View Details
                    </Button>
                    {app.status === 'payment_pending' && (
                      <Button size="sm" onClick={() => setShowPaymentModal(app)}>
                        Pay Now
                      </Button>
                    )}
                    {app.status === 'payment_completed' && (
                      <Button size="sm" onClick={() => setShowDeliveryModal(app)}>
                        Select Delivery
                      </Button>
                    )}
                  </div>
                </div>
                {app.timeline && app.timeline.length > 0 && (
                  <div className="border-l-2 border-primary-200 pl-4 space-y-4 mt-4">
                    {app.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <span className={`absolute -left-[21px] w-3 h-3 rounded-full ${
                          i === app.timeline.length - 1 ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-primary-300'
                        }`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{APPLICATION_STATUS_LABELS[t.status] || t.status?.replace('_', ' ') || ''}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{t.note}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(t.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {apps.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          )}
        </>
      )}
      
      {showPaymentModal && (
        <PaymentModal
          application={showPaymentModal}
          deliveryDetails={deliveryDetails}
          onClose={() => setShowPaymentModal(null)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showDeliveryModal && (
        <DeliverySelectionModal
          application={showDeliveryModal}
          onClose={() => setShowDeliveryModal(null)}
          onDeliveryConfirm={handleDeliveryConfirm}
        />
      )}

      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Application Details</h2>
              <button onClick={() => setShowDetailsModal(null)} className="text-slate-400 hover:text-slate-600">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-700 mb-3">Pet Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Pet Name:</span>
                    <p className="font-medium">{showDetailsModal.petName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <p className="font-medium">{APPLICATION_STATUS_LABELS[showDetailsModal.status] || showDetailsModal.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Submitted:</span>
                    <p className="font-medium">{formatDate(showDetailsModal.submittedAt)}</p>
                  </div>
                  {showDetailsModal.paymentStatus && (
                    <div>
                      <span className="text-slate-500">Payment:</span>
                      <p className="font-medium capitalize">{showDetailsModal.paymentStatus}</p>
                    </div>
                  )}
                </div>
              </div>

              {showDetailsModal.shelterName && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-3">Shelter Information</h3>
                  <div className="text-sm">
                    <span className="text-slate-500">Adoption Request Sent To:</span>
                    <p className="font-medium">{showDetailsModal.shelterName}</p>
                  </div>
                </div>
              )}

              {showDetailsModal.formData && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-3">Application Form Data</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(showDetailsModal.formData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showDetailsModal.timeline && showDetailsModal.timeline.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-3">Application Timeline</h3>
                  <div className="border-l-2 border-primary-200 pl-4 space-y-4">
                    {showDetailsModal.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <span className={`absolute -left-[21px] w-3 h-3 rounded-full ${
                          i === showDetailsModal.timeline.length - 1 ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-primary-300'
                        }`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{APPLICATION_STATUS_LABELS[t.status] || t.status?.replace('_', ' ') || ''}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{t.note}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDate(t.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowDetailsModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
