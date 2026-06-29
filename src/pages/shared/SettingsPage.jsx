import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Input from '@/components/forms/Input';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';

const tabs = ['Profile', 'Notifications', 'Security', 'Sessions'];

export default function SettingsPage() {
  const [tab, setTab] = useState('Profile');
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fullUser = user || {};
  
  // Form states matching full backend fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    preferredPetType: '',
    capacity: 0,
    registrationAuthority: '',
    clinic: '',
    qualification: '',
    specialization: '',
    experience: '',
    availability: '',
    licenseNumber: ''
  });

  // Load user data on mount
  useEffect(() => {
    if (fullUser.id) {
      setFormData({
        name: fullUser.name || '',
        email: fullUser.email || '',
        phone: fullUser.phone || '',
        location: fullUser.location || '',
        bio: fullUser.bio || '',
        preferredPetType: fullUser.preferredPetType || '',
        capacity: fullUser.capacity || 0,
        registrationAuthority: fullUser.registrationAuthority || '',
        clinic: fullUser.clinic || '',
        qualification: fullUser.qualification || '',
        specialization: fullUser.specialization || '',
        experience: fullUser.experience || '',
        availability: fullUser.availability || '',
        licenseNumber: fullUser.licenseNumber || ''
      });
      setAvatarPreview(fullUser.avatar || '');
    }
  }, [fullUser.id]);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(fullUser.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const compressImage = (base64Str, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast('Please select an image file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result);
          setAvatarPreview(compressed);
          setAvatarFile(file);
        } catch (err) {
          toast('Failed to compress image', 'error');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    if (window.confirm('Remove profile picture?')) {
      try {
        setAvatarPreview('');
        setAvatarFile(null);
        await updateUser({ avatar: '' });
        toast('Profile picture removed successfully', 'success');
      } catch (err) {
        toast('Failed to remove profile picture', 'error');
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    adoptionUpdates: true,
    paymentReminders: true,
    vaccinationAlerts: true,
    appointmentUpdates: true,
    marketingEmails: false
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    
    // Validate inputs based on role
    if (!formData.name.trim()) {
      toast('Name field is required', 'error');
      return;
    }

    try {
      if (avatarFile) {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('phone', formData.phone);
        data.append('location', formData.location);
        data.append('bio', formData.bio);
        data.append('preferredPetType', formData.preferredPetType);
        data.append('capacity', Number(formData.capacity) || 0);
        data.append('registrationAuthority', formData.registrationAuthority);
        data.append('clinic', formData.clinic);
        data.append('qualification', formData.qualification);
        data.append('specialization', formData.specialization);
        data.append('experience', formData.experience);
        data.append('availability', formData.availability);
        data.append('avatar', avatarFile);

        await updateUser(data);
      } else {
        const updates = {
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          preferredPetType: formData.preferredPetType,
          capacity: Number(formData.capacity) || 0,
          registrationAuthority: formData.registrationAuthority,
          clinic: formData.clinic,
          qualification: formData.qualification,
          specialization: formData.specialization,
          experience: formData.experience,
          availability: formData.availability
        };

        if (avatarPreview === '') {
          updates.avatar = ''; // User explicitly cleared avatar
        }

        await updateUser(updates);
      }

      toast('Profile updated successfully', 'success');
      navigate('/profile');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile settings', 'error');
    }
  };

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }
    toast('Password updated successfully', 'success');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-2">
            {tabs.map((t) => {
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                    tab === t 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
            {tab === 'Profile' && (
              <form onSubmit={handleProfileSave} className="space-y-8">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-200">
                  <div className="relative">
                    <img 
                      src={avatarPreview || '/images/default-avatar.svg'} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-md bg-slate-50"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">{fullUser.name || 'Your Name'}</h2>
                    <p className="text-slate-600 text-sm mb-3">{fullUser.email || 'your@email.com'}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full capitalize">
                        {fullUser.role || 'User'}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="text-sm text-slate-700 hover:text-slate-900 font-medium"
                      >
                        Upload Photo
                      </button>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Form Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Personal / Business Information</h3>
                    <p className="text-sm text-slate-600 mb-6">Update details for your {fullUser.role} profile</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Common Name field */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        {fullUser.role === 'shelter' ? 'Shelter Name *' : 'Full Name *'}
                      </label>
                      <Input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder={fullUser.role === 'shelter' ? 'Enter shelter name' : 'Enter full name'}
                        required
                      />
                    </div>

                    {/* Locked Email field */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 opacity-75">
                      <label className="text-sm font-medium text-slate-500">
                        Email Address (Registered)
                      </label>
                      <Input 
                        value={formData.email}
                        disabled
                        className="bg-slate-100 cursor-not-allowed text-slate-500"
                      />
                    </div>

                    {/* Common Phone field */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Phone Number
                      </label>
                      <Input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    {/* Common Location field */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Address / City
                      </label>
                      <Input 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="City, State"
                      />
                    </div>

                    {/* SHELTER / VET License details (Read-only block) */}
                    {(fullUser.role === 'shelter' || fullUser.role === 'vet') && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-600">
                          License Number (Verification Locked)
                        </label>
                        <Input 
                          value={formData.licenseNumber}
                          disabled
                          placeholder="No license ID loaded"
                          className="bg-slate-100 font-mono text-slate-500 cursor-not-allowed"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">License modifications are only allowed through the Admin Verification Board to ensure license validation integrity.</p>
                      </div>
                    )}

                    {/* Role-Specific Fields */}
                    {fullUser.role === 'adopter' && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Preferred Pet Type (e.g. Dogs, Cats, Rabbits)
                        </label>
                        <Input 
                          value={formData.preferredPetType}
                          onChange={(e) => setFormData({...formData, preferredPetType: e.target.value})}
                          placeholder="e.g. Dogs, Cats"
                        />
                      </div>
                    )}

                    {fullUser.role === 'shelter' && (
                      <>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Capacity Limit (Animals Count)
                          </label>
                          <Input 
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({...formData, capacity: Number(e.target.value) || 0})}
                            placeholder="e.g. 50"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Registration Authority
                          </label>
                          <Input 
                            value={formData.registrationAuthority}
                            onChange={(e) => setFormData({...formData, registrationAuthority: e.target.value})}
                            placeholder="e.g. Animal Welfare Board"
                          />
                        </div>
                      </>
                    )}

                    {fullUser.role === 'vet' && (
                      <>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Clinic / Hospital Name
                          </label>
                          <Input 
                            value={formData.clinic}
                            onChange={(e) => setFormData({...formData, clinic: e.target.value})}
                            placeholder="Clinic name"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Qualification
                          </label>
                          <Input 
                            value={formData.qualification}
                            onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                            placeholder="e.g. B.V.Sc & A.H"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Specialization
                          </label>
                          <Input 
                            value={formData.specialization}
                            onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                            placeholder="e.g. Canine Specialist"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <label className="text-sm font-medium text-slate-700">
                            Years of Experience
                          </label>
                          <Input 
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                            placeholder="e.g. 8 Years"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 lg:col-span-2">
                          <label className="text-sm font-medium text-slate-700">
                            Availability Slots
                          </label>
                          <Input 
                            value={formData.availability}
                            onChange={(e) => setFormData({...formData, availability: e.target.value})}
                            placeholder="e.g. Mon - Fri (09:00 AM - 05:00 PM)"
                          />
                        </div>
                      </>
                    )}

                    {/* About me Bio description */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 lg:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        About Me / Description
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Provide details about your profile..."
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-100 outline-none transition-all resize-none text-sm bg-white"
                        maxLength={500}
                      />
                      <div className="text-right text-xs text-slate-400">
                        {formData.bio.length} / 500
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit actions */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => navigate('/profile')}
                    className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-all text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm hover:shadow transition-all"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {tab === 'Notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                      { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                      { key: 'adoptionUpdates', label: 'Adoption Updates', desc: 'Updates on pet adoption applications' },
                      { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Reminders for upcoming payments' },
                      { key: 'vaccinationAlerts', label: 'Vaccination Alerts', desc: 'Pet vaccination due reminders' },
                      { key: 'appointmentUpdates', label: 'Appointment Updates', desc: 'Updates on vet appointments' },
                      { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive promotional emails and offers' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all">
                        <div>
                          <p className="font-medium text-slate-900">{item.label}</p>
                          <p className="text-sm text-slate-600">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNotificationToggle(item.key)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            notificationSettings[item.key] ? 'bg-slate-900' : 'bg-slate-300'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              notificationSettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'Security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Current Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.current ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">New Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          placeholder="Enter new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.new ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                      <div className="relative">
                        <Input 
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          placeholder="Confirm new password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasswords.confirm ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <Button type="button" onClick={handlePasswordUpdate} className="w-full">Update Password</Button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'Sessions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    {(fullUser.sessions || [{ device: 'Chrome on Windows', location: 'Mumbai, India', current: true, lastActive: 'Now' }]).map((s, index) => (
                      <div key={index} className={cn('flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-3 transition-all', s.current ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200 hover:border-slate-300')}>
                        <div className="flex items-start gap-4">
                          <div className={cn('p-3 rounded-lg', s.current ? 'bg-slate-200' : 'bg-slate-100')}>
                            <span className={cn('text-sm font-medium', s.current ? 'text-slate-700' : 'text-slate-600')}>Device</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{s.device}</p>
                            <p className="text-sm text-slate-600">{s.location}</p>
                            <p className="text-xs text-slate-500 mt-1">Last active: {s.lastActive}</p>
                          </div>
                        </div>
                        {s.current ? (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">Current Session</span>
                        ) : (
                          <Button type="button" variant="outline" size="sm">Revoke</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
