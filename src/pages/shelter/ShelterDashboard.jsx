import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';
import KPICard from '@/components/common/KPICard';
import api from '@/services/api';
import { formatCurrency } from '@/utils/formatters';

export default function ShelterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fullUser = user || {};

  const [stats, setStats] = useState({
    availablePets: 0,
    pendingApps: 0,
    completedAdoptions: 0,
    receivedDonations: 0,
    adoptionRevenue: 0
  });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fullUser.id) return;
    
    const loadShelterDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch pets, applications, and shelter payment metrics in parallel
        const [petsRes, appsRes, paymentsRes] = await Promise.all([
          api.get('/pets'),
          api.get('/applications'),
          api.get('/payments/dashboard/shelter')
        ]);

        const pets = Array.isArray(petsRes.data) ? petsRes.data : [];
        const shelterPets = pets.filter(p => p.shelterId === fullUser.id);
        const availCount = shelterPets.filter(p => p.status === 'available').length;

        const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
        const pendingCount = apps.filter(a => a.status === 'pending').length;
        const completedCount = apps.filter(a => a.status === 'completed').length;

        const paymentData = paymentsRes.data || {
          receivedDonations: 0,
          adoptionRevenue: 0,
          recentPayments: []
        };

        setStats({
          availablePets: availCount,
          pendingApps: pendingCount,
          completedAdoptions: completedCount,
          receivedDonations: paymentData.receivedDonations,
          adoptionRevenue: paymentData.adoptionRevenue
        });

        setPayments(paymentData.recentPayments || []);
      } catch (err) {
        console.error('Failed to load shelter dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadShelterDashboardData();
  }, [fullUser.id]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Loading shelter dashboard...</div>;
  }

  return (
    <div className="bg-paw-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Shelter Dashboard</h1>
        <p className="text-slate-500 mb-6">Manage your pets, applications, and shelter activities</p>
        
        {/* KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Available Pets" value={stats.availablePets} />
          <KPICard title="Pending Applications" value={stats.pendingApps} color="accent" />
          <KPICard title="Received Donations" value={formatCurrency(stats.receivedDonations)} color="blue" />
          <KPICard title="Adoption Revenue" value={formatCurrency(stats.adoptionRevenue)} color="purple" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Payment Tracking Panel */}
          <div className="bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-card hover:shadow-card-hover h-[400px]">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center pb-3 border-b">
                <h2 className="font-bold text-slate-800">
                  Recent Received Payments
                </h2>
              </div>
              
              <div className="space-y-3 mt-4 overflow-y-auto flex-1 pr-1">
                {payments.map((p) => (
                  <div key={p.id || p._id} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {p.paymentType === 'adoption' 
                          ? `${p.petName} Adoption Fee` 
                          : `${p.petName ? p.petName + ' Sponsorship' : 'General Donation'}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Payer: {p.userName || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(p.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-sm">{formatCurrency(p.amount)}</span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.razorpayPaymentId || 'N/A'}</p>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-center text-slate-500 py-16 text-sm">No payments received yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Priority tasks & Quick Action Panel */}
          <div className="bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-sm h-[400px]">
            <div>
              <div className="flex justify-between items-center pb-3 border-b mb-4">
                <h2 className="font-bold text-slate-800">
                  Priority Tasks & Alerts
                </h2>
              </div>
              
              <div className="space-y-3.5">
                {stats.pendingApps > 0 && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div className="text-xs">
                      <p className="font-bold text-indigo-950">Pending Adoption Applications</p>
                      <p className="text-indigo-700 mt-0.5">You have {stats.pendingApps} requests pending review.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/shelter/applications')}
                      className="text-xs font-bold text-indigo-900 bg-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition border-0 cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-amber-950">Vaccination Records Check</p>
                    <p className="text-amber-700 mt-0.5">Annual immunizations checkup due for listed dogs.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/shelter/pets')}
                    className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition border-0 cursor-pointer"
                  >
                    Manage
                  </button>
                </div>

                {fullUser.capacity && stats.availablePets >= fullUser.capacity * 0.9 && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
                    <FiAlertTriangle className="text-rose-600 w-5 h-5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-rose-950">Shelter Capacity Warning</p>
                      <p className="text-rose-700 mt-0.5">Your shelter is currently at {stats.availablePets}/{fullUser.capacity} capacity limit.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t">
              <button 
                onClick={() => navigate('/shelter/add-pet')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition text-slate-700 font-semibold text-xs text-center cursor-pointer"
              >
                Add Pet
              </button>
              <button 
                onClick={() => navigate('/shelter/applications')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition text-slate-700 font-semibold text-xs text-center cursor-pointer"
              >
                Applications
              </button>
              <button 
                onClick={() => navigate('/shelter/complaints')}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition text-slate-700 font-semibold text-xs text-center cursor-pointer"
              >
                Complaints
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
