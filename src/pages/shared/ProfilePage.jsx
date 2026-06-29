import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { APPLICATION_STATUS_LABELS } from '@/constants/status';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [stats, setStats] = useState({
    petsCount: 0,
    applicationsCount: 0,
    complaintsCount: 0,
    appointmentsCount: 0
  });
  const [history, setHistory] = useState({
    applications: [],
    complaints: [],
    appointments: []
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const fullUser = user || {};

  // Fetch dynamic user stats from backend on mount
  useEffect(() => {
    if (!fullUser.id) return;
    
    const fetchUserStats = async () => {
      setLoadingStats(true);
      try {
        if (fullUser.role === 'adopter') {
          // Fetch adopter's applications
          const appRes = await api.get('/applications');
          const apps = Array.isArray(appRes.data) ? appRes.data : [];
          
          // Fetch adopter's complaints
          const compRes = await api.get('/complaints');
          const comps = Array.isArray(compRes.data) ? compRes.data : [];

          // Fetch adopter's appointments
          const aptRes = await api.get('/appointments');
          const apts = Array.isArray(aptRes.data) ? aptRes.data : [];

          setStats({
            petsCount: apps.filter(a => a.status === 'completed').length,
            applicationsCount: apps.length,
            complaintsCount: comps.length,
            appointmentsCount: apts.length
          });

          setHistory({
            applications: apps.slice(0, 5),
            complaints: comps.slice(0, 5),
            appointments: apts.slice(0, 5)
          });
        } 
        else if (fullUser.role === 'shelter') {
          // Fetch shelter's pets
          const petsRes = await api.get('/pets');
          const pets = Array.isArray(petsRes.data) ? petsRes.data : [];
          const shelterPets = pets.filter(p => p.shelterId === fullUser.id);

          // Fetch shelter's applications
          const appRes = await api.get('/applications');
          const apps = Array.isArray(appRes.data) ? appRes.data : [];

          // Fetch complaints against this shelter
          const compRes = await api.get('/complaints');
          const comps = Array.isArray(compRes.data) ? compRes.data : [];

          setStats({
            petsCount: shelterPets.filter(p => p.status === 'available').length,
            applicationsCount: apps.length,
            complaintsCount: comps.length,
            appointmentsCount: shelterPets.filter(p => p.status === 'adopted').length
          });

          setHistory({
            applications: apps.slice(0, 5),
            complaints: comps.slice(0, 5),
            appointments: []
          });
        }
        else if (fullUser.role === 'vet') {
          // Fetch vet's appointments
          const aptRes = await api.get('/appointments');
          const apts = Array.isArray(aptRes.data) ? aptRes.data : [];

          // Fetch complaints against this vet
          const compRes = await api.get('/complaints');
          const comps = Array.isArray(compRes.data) ? compRes.data : [];

          setStats({
            petsCount: 0,
            applicationsCount: 0,
            complaintsCount: comps.length,
            appointmentsCount: apts.length
          });

          setHistory({
            applications: [],
            complaints: comps.slice(0, 5),
            appointments: apts.slice(0, 5)
          });
        }
        else if (fullUser.role === 'admin') {
          // Fetch platform metrics
          const usersRes = await api.get('/admin/all-users').catch(() => ({ data: [] }));
          const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
          
          const petsRes = await api.get('/pets').catch(() => ({ data: [] }));
          const allPets = Array.isArray(petsRes.data) ? petsRes.data : [];

          const compRes = await api.get('/complaints').catch(() => ({ data: [] }));
          const allComps = Array.isArray(compRes.data) ? compRes.data : [];

          setStats({
            petsCount: allPets.length,
            applicationsCount: allUsers.length,
            complaintsCount: allComps.length,
            appointmentsCount: allUsers.filter(u => u.role === 'shelter' || u.role === 'vet').length
          });
        }
      } catch (err) {
        console.error('Failed to load profile statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [fullUser.id, fullUser.role]);

  const getRoleLabel = (role) => {
    const labels = {
      adopter: 'Pet Adopter',
      shelter: 'Shelter Partner',
      vet: 'Certified Veterinarian',
      admin: 'Platform Administrator'
    };
    return labels[role] || role;
  };

  // Render stats cards based on Role
  const renderStatsCards = () => {
    let cardData = [];
    if (fullUser.role === 'adopter') {
      cardData = [
        { label: 'Adopted Pets', value: stats.petsCount, color: 'from-rose-400 to-pink-500' },
        { label: 'Applications', value: stats.applicationsCount, color: 'from-blue-400 to-indigo-500' },
        { label: 'Vet Bookings', value: stats.appointmentsCount, color: 'from-emerald-400 to-teal-500' },
        { label: 'Raised Complaints', value: stats.complaintsCount, color: 'from-amber-400 to-orange-500' },
      ];
    } else if (fullUser.role === 'shelter') {
      cardData = [
        { label: 'Available Pets', value: stats.petsCount, color: 'from-amber-400 to-orange-500' },
        { label: 'Adoptions Completed', value: stats.appointmentsCount, color: 'from-emerald-400 to-teal-500' },
        { label: 'Adoption Requests', value: stats.applicationsCount, color: 'from-blue-400 to-indigo-500' },
        { label: 'Reported Complaints', value: stats.complaintsCount, color: 'from-rose-400 to-red-500' },
      ];
    } else if (fullUser.role === 'vet') {
      cardData = [
        { label: 'Total Appointments', value: stats.appointmentsCount, color: 'from-emerald-400 to-teal-500' },
        { label: 'Open Complaints', value: stats.complaintsCount, color: 'from-rose-400 to-red-500' },
        { label: 'Platform Rating', value: '4.9 Rating', color: 'from-amber-400 to-orange-500' },
        { label: 'Experience Level', value: fullUser.experience || '5+ Years', color: 'from-blue-400 to-indigo-500' },
      ];
    } else { // Admin
      cardData = [
        { label: 'Total Pets Listed', value: stats.petsCount, color: 'from-rose-400 to-pink-500' },
        { label: 'Registered Users', value: stats.applicationsCount, color: 'from-blue-400 to-indigo-500' },
        { label: 'Partner Accounts', value: stats.appointmentsCount, color: 'from-emerald-400 to-teal-500' },
        { label: 'Active Complaints', value: stats.complaintsCount, color: 'from-amber-400 to-orange-500' },
      ];
    }

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cardData.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <p className="text-2xl font-semibold text-slate-900">{loadingStats ? '...' : stat.value}</p>
            <p className="text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>
    );
  };

  // Tabs layout based on role
  const getTabs = () => {
    switch (fullUser.role) {
      case 'adopter':
        return [
          { id: 'info', label: 'Personal Info' },
          { id: 'preferences', label: 'Pet Preferences' },
          { id: 'history', label: 'Adoption History' },
          { id: 'complaints', label: 'Complaints' }
        ];
      case 'shelter':
        return [
          { id: 'info', label: 'Shelter Profile' },
          { id: 'stats', label: 'Performance Stats' },
          { id: 'history', label: 'Adoption Applications' },
          { id: 'complaints', label: 'Complaints History' }
        ];
      case 'vet':
        return [
          { id: 'info', label: 'Vet Profile' },
          { id: 'appointments', label: 'Appointments Stats' },
          { id: 'complaints', label: 'Complaints History' }
        ];
      case 'admin':
        return [
          { id: 'info', label: 'Admin Info' },
          { id: 'permissions', label: 'System Permissions' },
          { id: 'security', label: 'Security Log' }
        ];
      default:
        return [{ id: 'info', label: 'Personal Info' }];
    }
  };

  // Render tab contents
  const renderTabContent = () => {
    if (activeTab === 'info') {
      if (fullUser.role === 'adopter') {
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{fullUser.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{fullUser.email}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Phone Number</p>
                <p className="font-medium text-slate-900">{fullUser.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Address/Location</p>
                <p className="font-medium text-slate-900">{fullUser.location || 'Not provided'}</p>
              </div>
            </div>
            {fullUser.bio && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">About Me</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{fullUser.bio}</p>
              </div>
            )}
          </div>
        );
      }
      else if (fullUser.role === 'shelter') {
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Shelter Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Shelter Name</p>
                <p className="font-medium text-slate-900">{fullUser.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">License Number</p>
                <p className="font-medium text-slate-900 font-mono text-xs">{fullUser.licenseNumber || 'Not verified'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Registration details</p>
                <p className="font-medium text-slate-900">{fullUser.registrationAuthority || 'Department of Animal Husbandry'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Shelter Capacity</p>
                <p className="font-medium text-slate-900">{fullUser.capacity || '40'} Animals max</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Contact Phone</p>
                <p className="font-medium text-slate-900">{fullUser.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Address/Location</p>
                <p className="font-medium text-slate-900">{fullUser.location || 'Not provided'}</p>
              </div>
            </div>
            {fullUser.bio && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Shelter Description</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{fullUser.bio}</p>
              </div>
            )}
          </div>
        );
      }
      else if (fullUser.role === 'vet') {
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Veterinary Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Veterinarian Name</p>
                <p className="font-medium text-slate-900">{fullUser.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Clinic/Hospital Name</p>
                <p className="font-medium text-slate-900">{fullUser.clinic || 'PetHaven Partner Clinic'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Qualification</p>
                <p className="font-medium text-slate-900">{fullUser.qualification || 'B.V.Sc & A.H'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Specialization</p>
                <p className="font-medium text-slate-900">{fullUser.specialization || 'Small Animal Surgery & Care'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Experience Level</p>
                <p className="font-medium text-slate-900">{fullUser.experience || '5+ Years'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Contact Phone</p>
                <p className="font-medium text-slate-900">{fullUser.phone || 'Not provided'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 col-span-1 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1">Weekly Availability</p>
                <p className="font-medium text-slate-900">{fullUser.availability || 'Mon - Fri (09:00 AM - 05:00 PM)'}</p>
              </div>
            </div>
            {fullUser.bio && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Biography / Professional Statement</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{fullUser.bio}</p>
              </div>
            )}
          </div>
        );
      }
      else { // Admin
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">Admin Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Admin Name</p>
                <p className="font-medium text-slate-900">{fullUser.name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{fullUser.email}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Role Assigned</p>
                <Badge variant="primary" className="font-medium uppercase">{fullUser.role}</Badge>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Joined Date</p>
                <p className="font-medium text-slate-900">
                  {fullUser.createdAt ? new Date(fullUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    if (activeTab === 'preferences' && fullUser.role === 'adopter') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Pet Preferences</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Preferred Pet Type</p>
              <p className="font-medium text-slate-900 capitalize">{fullUser.preferredPetType || 'Dogs, Cats'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Age Preference</p>
              <p className="font-medium text-slate-900">Young Adult (1-3 years)</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Size Preference</p>
              <p className="font-medium text-slate-900">Medium Size</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
          {history.applications.length > 0 ? (
            <div className="divide-y divide-slate-200 text-sm">
              {history.applications.map((app) => (
                <div key={app.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">{app.petName}</p>
                    <p className="text-xs text-slate-500">To: {app.shelterName} · {new Date(app.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={app.status === 'approved' || app.status === 'payment_completed' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}>
                    {APPLICATION_STATUS_LABELS[app.status] || app.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4">No adoption applications submitted yet.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'complaints') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Raised Complaints</h3>
          {history.complaints.length > 0 ? (
            <div className="divide-y divide-slate-200 text-sm">
              {history.complaints.map((comp) => (
                <div key={comp.id} className="py-3.5 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{comp.title}</p>
                    <p className="text-xs text-slate-500 mb-1">Against: {comp.againstName} ({comp.againstRole})</p>
                    <p className="text-xs text-slate-400 font-medium">{comp.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={comp.status === 'resolved' ? 'success' : 'warning'}>
                      {comp.status}
                    </Badge>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(comp.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4">No complaints recorded.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'stats' && fullUser.role === 'shelter') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Shelter Performance Metrics</h3>
          <div className="space-y-4">
            {['Medical Compliance', 'Cleanliness & Space', 'Staff Training Rate', 'Adopter Satisfaction'].map((metric, index) => {
              const percentages = [98, 95, 92, 94];
              return (
                <div key={metric} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-slate-700">{metric}</span>
                    <span className="text-slate-900">{percentages[index]}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: `${percentages[index]}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activeTab === 'appointments' && fullUser.role === 'vet') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Active Appointments List</h3>
          {history.appointments.length > 0 ? (
            <div className="divide-y divide-slate-200 text-sm">
              {history.appointments.map((apt) => (
                <div key={apt.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">Pet: {apt.petName} ({apt.type})</p>
                    <p className="text-xs text-slate-500">By Adopter: {apt.adopterName} on {apt.date} at {apt.time}</p>
                  </div>
                  <Badge variant={apt.status === 'confirmed' ? 'success' : apt.status === 'rejected' ? 'danger' : 'warning'}>
                    {apt.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm py-4">No appointments found.</p>
          )}
        </div>
      );
    }

    if (activeTab === 'permissions' && fullUser.role === 'admin') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Platform Authorization Scope</h3>
          <div className="space-y-2">
            {[
              'Approve/Reject Shelters & Veterinarian Licenses',
              'Override platform configurations & SMTP parameters',
              'Audit platform activity feeds & analytics metrics',
              'Access user listings & manage statuses dynamically',
              'Investigate platform complaints'
            ].map((perm, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm text-slate-700 font-medium">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'security' && fullUser.role === 'admin') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">Admin Access Info</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <p className="text-slate-500 mb-1">Statistics Access Level</p>
              <p className="font-medium text-slate-900">Full System Analytics Access</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <p className="text-slate-500 mb-1">Encryption Mode</p>
              <p className="font-medium text-slate-900">SHA-256 JWT Signed Sessions</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Hero Banner Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="h-32 bg-slate-100" />
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-slate-200">
                <img 
                  src={fullUser.avatar || '/images/default-avatar.svg'} 
                  alt="Profile" 
                  className="w-full h-full object-cover bg-slate-50"
                />
              </div>
            </div>

            {/* Profile Intro info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-slate-900">{fullUser.name || 'Profile Name'}</h1>
                <Badge variant="primary" className="font-semibold">
                  {getRoleLabel(fullUser.role)}
                </Badge>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-slate-600 mb-3">
                <span className="text-slate-900 font-medium">{fullUser.email}</span>
                {fullUser.phone && <span className="text-slate-900 font-medium">{fullUser.phone}</span>}
                {fullUser.location && <span className="text-slate-900 font-medium">{fullUser.location}</span>}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {fullUser.isEmailVerified ? (
                  <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                    Email Verification Pending
                  </span>
                )}
                {(fullUser.role === 'shelter' || fullUser.role === 'vet') && (
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                    fullUser.licenseVerificationStatus === 'verified' || fullUser.isApproved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : fullUser.licenseVerificationStatus === 'rejected'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    License: {fullUser.licenseVerificationStatus || 'Pending'}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Link to="/settings" className="shrink-0">
              <Button variant="outline" className="font-medium px-6 py-2.5 rounded-lg">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      {renderStatsCards()}

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
            {getTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* Right side static guide panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Security Status</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Joined Platform</span>
                <span className="font-medium text-slate-900">
                  {fullUser.createdAt ? new Date(fullUser.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'June 2026'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Security Check</span>
                <span className="text-emerald-600 font-medium">Secured</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Role Authority</span>
                <span className="font-medium text-slate-900 uppercase">{fullUser.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
