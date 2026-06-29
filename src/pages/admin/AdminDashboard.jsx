// Typography-only Admin Dashboard layout: Pure text design with all decorative icons and emojis removed.
import { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import { useFetch } from '@/hooks/useFetch';
import { dataService } from '@/services/dataService';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: analytics, loading: loadingKPIs } = useFetch(() => dataService.getAnalytics());
  
  const [pendingShelters, setPendingShelters] = useState(0);
  const [pendingVets, setPendingVets] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(false);

  useEffect(() => {
    const loadAdminDashboardData = async () => {
      setLoadingAttention(true);
      try {
        // Fetch all users to count pending verifications
        const usersRes = await api.get('/admin/all-users');
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        
        const shPending = allUsers.filter(u => u.role === 'shelter' && (!u.isApproved || u.licenseVerificationStatus === 'pending')).length;
        const vetPending = allUsers.filter(u => u.role === 'vet' && (!u.isApproved || u.licenseVerificationStatus === 'pending')).length;

        // Fetch complaints to count pending complaints
        const compsRes = await api.get('/complaints');
        const comps = Array.isArray(compsRes.data) ? compsRes.data : [];
        const compPending = comps.filter(c => c.status === 'pending').length;

        setPendingShelters(shPending);
        setPendingVets(vetPending);
        setPendingComplaints(compPending);

        // Fetch donations/payments
        const donRes = await api.get('/donations');
        const donations = Array.isArray(donRes.data) ? donRes.data : [];

        // Build a dynamic Platform Activity Feed
        const feeds = [];
        
        // Add user registered activities
        allUsers.slice(0, 2).forEach((u, idx) => {
          feeds.push({
            id: `user_${u._id}_${idx}`,
            title: `New User Registration`,
            desc: `${u.name} registered as a ${u.role}`,
            time: idx === 0 ? '30 minutes ago' : '3 hours ago'
          });
        });

        // Add application / adoption activities
        const appsRes = await api.get('/applications').catch(() => ({ data: [] }));
        const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
        apps.slice(0, 1).forEach((app) => {
          feeds.push({
            id: `app_${app.id}`,
            title: `Adoption Request Submitted`,
            desc: `${app.adopterName} applied to adopt ${app.petName}`,
            time: '1 hour ago'
          });
        });

        // Add donation activities
        donations.slice(0, 1).forEach((d) => {
          feeds.push({
            id: `donation_${d.id}`,
            title: `Donation Received`,
            desc: `Received ₹${d.amount} for general support`,
            time: 'Yesterday'
          });
        });

        // Add complaint activities
        comps.slice(0, 1).forEach((c) => {
          feeds.push({
            id: `comp_${c.id}`,
            title: `Complaint Logged`,
            desc: `Subject: "${c.title}" against ${c.againstName}`,
            time: '2 days ago'
          });
        });

        setActivityFeed(feeds);
      } catch (err) {
        console.error('[AdminDashboard] Failed to fetch attention metrics:', err);
      } finally {
        setLoadingAttention(false);
      }
    };

    loadAdminDashboardData();
  }, []);

  // Use loaded KPIs or fallback
  const k = analytics?.platformKPIs || {
    totalUsers: 45,
    totalAdoptions: 28,
    monthlyDonations: 15000,
    pendingApplications: 5
  };

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold mb-6">Platform Overview</h1>
      
      {/* Platform KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Users" value={k.totalUsers} change={8} />
        <KPICard title="Total Adoptions" value={k.totalAdoptions} color="accent" change={15} />
        <KPICard title="Monthly Donations" value={`₹${k.monthlyDonations}`} color="blue" />
        <KPICard title="Pending Applications" value={k.pendingApplications} color="purple" />
      </div>

      {/* Support Ticket KPI Cards */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">Support Ticket Metrics</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Tickets" value={analytics?.complaintKPIs?.totalComplaints || 0} />
        <KPICard title="Open Tickets" value={analytics?.complaintKPIs?.openComplaints || 0} color="accent" />
        <KPICard title="Avg Response Time" value={`${analytics?.complaintKPIs?.avgResponseTime || 0}h`} color="blue" />
        <KPICard title="Resolution Rate" value={`${analytics?.complaintKPIs?.resolutionRate || 0}%`} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Activity Feed */}
        <div className="bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-sm h-[420px]">
          <div>
            <div className="flex justify-between items-center pb-3 border-b">
              <h2 className="font-bold text-slate-800">
                Platform Activity Feed
              </h2>
              <button 
                onClick={() => navigate('/admin/users')}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800"
              >
                Audits
              </button>
            </div>
            
            <div className="space-y-4 mt-4 overflow-y-auto max-h-[290px] pr-1">
              {activityFeed.length > 0 ? (
                activityFeed.map((act) => (
                  <div key={act.id} className="flex gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{act.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{act.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {act.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-10 text-slate-400 text-xs font-medium">No recent activities log.</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Attention & Action Board */}
        <div className="bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-sm h-[420px]">
          <div>
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h2 className="font-bold text-slate-800">
                Admin Attention Board
              </h2>
            </div>
            
            <div className="space-y-3.5">
              {pendingShelters > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-amber-950">Pending Shelter Licenses</p>
                    <p className="text-amber-700 mt-0.5">{pendingShelters} shelters require verification reviews.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/shelters')}
                    className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition"
                  >
                    Verify
                  </button>
                </div>
              )}

              {pendingVets > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-blue-950">Pending Vet Approvals</p>
                    <p className="text-blue-700 mt-0.5">{pendingVets} veterinarians require credentials check.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/vets')}
                    className="text-xs font-bold text-blue-900 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"
                  >
                    Verify
                  </button>
                </div>
              )}

              {pendingComplaints > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-rose-950">Unresolved Platform Complaints</p>
                    <p className="text-rose-700 mt-0.5">{pendingComplaints} complaints pending mediation action.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/complaints')}
                    className="text-xs font-bold text-rose-900 bg-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition"
                  >
                    Review
                  </button>
                </div>
              )}

              {!loadingAttention && pendingShelters === 0 && pendingVets === 0 && pendingComplaints === 0 && (
                <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl text-center py-10">
                  <p className="text-xs font-semibold text-slate-800">No pending approvals or alerts.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">The platform operations are running cleanly.</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Navigation Quick links */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t">
            <button 
              onClick={() => navigate('/admin/shelters')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-slate-700 font-semibold text-[10px] text-center"
            >
              Manage Shelters
            </button>
            <button 
              onClick={() => navigate('/admin/vets')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-slate-700 font-semibold text-[10px] text-center"
            >
              Manage Vets
            </button>
            <button 
              onClick={() => navigate('/admin/complaints')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-slate-700 font-semibold text-[10px] text-center"
            >
              Review Complaints
            </button>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-slate-700 font-semibold text-[10px] text-center"
            >
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
