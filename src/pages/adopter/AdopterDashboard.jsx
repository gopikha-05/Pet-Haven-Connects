import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '@/components/common/KPICard';
import StatusBadge from '@/components/common/StatusBadge';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { applicationService } from '@/services/applicationService';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function AdopterDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [metrics, setMetrics] = useState({
    totalDonations: 0,
    totalAdoptionsPaid: 0,
    recentTransactions: [],
    adoptionPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    setLoading(true);
    Promise.all([
      applicationService.getAll({ adopterId: user.id }),
      api.get('/payments/dashboard/adopter')
    ])
      .then(([appsRes, metricsRes]) => {
        const appsData = Array.isArray(appsRes) ? appsRes : (appsRes?.data || []);
        setApps(appsData);
        setMetrics(metricsRes.data || {
          totalDonations: 0,
          totalAdoptionsPaid: 0,
          recentTransactions: [],
          adoptionPayments: []
        });
      })
      .catch((err) => {
        console.error('Failed to load adopter dashboard stats:', err);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading dashboard...</div>;
  }

  const activeApps = apps.filter((a) => a.status !== 'completed' && a.status !== 'rejected');
  const adoptedCount = apps.filter((a) => a.status === 'completed').length;

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 mb-6">Here's what's happening with your pet adoption journey</p>
        
        {/* KPI Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Active Applications" value={activeApps.length} />
          <KPICard title="Adopted Pets" value={adoptedCount} color="blue" />
          <KPICard title="Total Donations" value={formatCurrency(metrics.totalDonations)} color="accent" />
          <KPICard title="Adoption Fees Paid" value={formatCurrency(metrics.totalAdoptionsPaid)} color="purple" />
        </div>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Applications Column */}
          <section className="bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all">
            <h2 className="font-bold text-slate-800 border-b pb-3 mb-4">Recent Applications</h2>
            <div className="space-y-3">
              {apps.slice(0, 3).map((app) => (
                <Link 
                  key={app.id} 
                  to="/adopter/applications" 
                  className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 border transition-all"
                >
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{app.petName}</span>
                    <p className="text-xs text-slate-500 mt-0.5">Submitted {formatDate(app.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    {app.paymentStatus && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        app.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        (app.paymentStatus === 'failed' || app.paymentStatus === 'expired' || app.paymentStatus === 'cancelled') ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.paymentStatus}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {apps.length === 0 && (
                <p className="text-center text-slate-500 py-8 text-sm">No applications found</p>
              )}
            </div>
          </section>
          
          {/* Donation & Payment History Column */}
          <section className="bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all space-y-6">
            <div>
              <h2 className="font-bold text-slate-800 border-b pb-3 mb-4">Donation History</h2>
              <div className="space-y-3">
                {metrics.recentTransactions.slice(0, 3).map((tx) => (
                  <div key={tx.id || tx._id} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {tx.petImage ? (
                        <img 
                          src={tx.petImage} 
                          alt={tx.petName || 'Pet'} 
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : tx.petName ? (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 text-xs">Pet</span>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{tx.petName ? `Sponsored ${tx.petName}` : 'General Donation'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(tx.date || tx.timestamp)}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">{formatCurrency(tx.amount)}</span>
                  </div>
                ))}
                {metrics.recentTransactions.length === 0 && (
                  <p className="text-center text-slate-500 py-4 text-sm">No donations made yet</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-800 border-b pb-3 mb-4">Adoption Payments</h2>
              <div className="space-y-3">
                {metrics.adoptionPayments.slice(0, 2).map((pay) => {
                  const statusVariants = {
                    completed: 'success',
                    pending: 'warning',
                    processing: 'warning',
                    failed: 'danger',
                    cancelled: 'danger',
                    expired: 'danger',
                  };
                  return (
                    <div key={pay._id} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        {pay.petImage ? (
                          <img 
                            src={pay.petImage} 
                            alt={pay.petName || 'Pet'} 
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-500 text-xs">Pet</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{pay.petName} Adoption Fee</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(pay.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-sm">{formatCurrency(pay.amount)}</p>
                        <Badge className="mt-1" variant={statusVariants[pay.status] || 'default'}>{pay.status}</Badge>
                      </div>
                    </div>
                  );
                })}
                {metrics.adoptionPayments.length === 0 && (
                  <p className="text-center text-slate-500 py-4 text-sm">No adoption payments initiated</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
