import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { complaintService } from '@/services/complaintService';
import { dataService } from '@/services/dataService';
import { SHELTER_COMPLAINT_CATEGORIES, VET_COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, CONTACT_PREFERENCES } from '@/mock/complaints';

export default function RaiseComplaintPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [sheltersList, setSheltersList] = useState([]);
  const [vetsList, setVetsList] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    targetType: 'shelter',
    targetId: '',
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
    evidence: '',
    contactPreference: 'email',
    contactDetail: ''
  });

  const [errors, setErrors] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const newAttachments = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast(`File ${file.name} exceeds 10MB limit`, 'error');
          continue;
        }
        const uploaded = await complaintService.uploadAttachment(file);
        newAttachments.push(uploaded);
      }
      setUploadedAttachments(prev => [...prev, ...newAttachments]);
      toast('Files uploaded successfully', 'success');
    } catch (err) {
      console.error('File upload failed:', err);
      toast('Failed to upload files', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setUploadedAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Fetch active shelters and vets from backend on mount
  useEffect(() => {
    const fetchTargets = async () => {
      setLoadingDropdown(true);
      try {
        const sheltersRes = await dataService.getShelters();
        const shelters = (Array.isArray(sheltersRes) ? sheltersRes : (sheltersRes?.data || []))
          .filter(s => s.isApproved !== false);
        
        const vetsRes = await dataService.getVeterinarians();
        const vets = (Array.isArray(vetsRes) ? vetsRes : (vetsRes?.data || []))
          .filter(v => v.isApproved !== false);

        setSheltersList(shelters);
        setVetsList(vets);
      } catch (err) {
        console.error('Failed to load complaint targets:', err);
      } finally {
        setLoadingDropdown(false);
      }
    };
    fetchTargets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear selected target ID if target type changes
    if (name === 'targetType') {
      setFormData(prev => ({ ...prev, targetType: value, targetId: '', category: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.targetId) newErrors.targetId = 'Please select a target user';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    // Validate contact detail based on preference
    if (!formData.contactDetail.trim()) {
      newErrors.contactDetail = formData.contactPreference === 'email' 
        ? 'Email is required' 
        : 'Phone number is required';
    } else if (formData.contactPreference === 'email') {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactDetail)) {
        newErrors.contactDetail = 'Please enter a valid email address';
      }
    } else if (formData.contactPreference === 'phone') {
      // Basic phone validation (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.contactDetail.replace(/\s/g, ''))) {
        newErrors.contactDetail = 'Please enter a valid 10-digit phone number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const selectedTarget = formData.targetType === 'shelter' 
        ? sheltersList.find(s => (s.id || s._id) === formData.targetId)
        : vetsList.find(v => (v.id || v._id) === formData.targetId);

      const targetUserId = formData.targetId;
      const targetName = selectedTarget ? selectedTarget.name : 'Unknown Partner';

      const complaintData = {
        title: formData.subject,
        raisedByUserId: user?.id,
        raisedByRole: 'adopter',
        raisedByName: user?.name || 'Adopter',
        againstUserId: targetUserId,
        againstRole: formData.targetType,
        againstName: targetName,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
        evidence: formData.evidence,
        contactPreference: formData.contactPreference,
        contactDetail: formData.contactDetail,
        attachments: uploadedAttachments
      };

      // 1. Submit complaint to database
      await complaintService.create(complaintData);
      
      // 2. Add in-memory notification fallback
      const targetNotification = {
        id: Date.now(),
        recipientId: targetUserId,
        recipientRole: formData.targetType,
        type: 'complaint',
        title: 'New Complaint Raised Against You',
        message: `${user?.name} has raised a complaint regarding "${formData.subject}"`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      const adminNotification = {
        id: Date.now() + 1,
        recipientId: 'admin',
        recipientRole: 'admin',
        type: 'complaint',
        title: 'New Complaint Raised',
        message: `${user?.name} has raised a complaint against ${targetName}: "${formData.subject}"`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      localStorage.setItem('notifications', JSON.stringify([...existingNotifications, targetNotification, adminNotification]));
      
      toast('Complaint submitted successfully. Target and admin have been notified.', 'success');
      navigate('/adopter/complaints');
    } catch (error) {
      console.error('Failed to submit complaint:', error);
      toast('Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = formData.targetType === 'shelter' ? SHELTER_COMPLAINT_CATEGORIES : VET_COMPLAINT_CATEGORIES;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Raise a Complaint</h1>
      
      <div className="bg-white rounded-2xl border p-6 max-w-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Complaint Against *</label>
            <select
              name="targetType"
              value={formData.targetType}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-medium text-slate-700"
            >
              <option value="shelter">Shelter</option>
              <option value="vet">Veterinarian</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select {formData.targetType === 'shelter' ? 'Shelter' : 'Veterinarian'} *
            </label>
            <select
              name="targetId"
              value={formData.targetId}
              onChange={handleInputChange}
              disabled={loadingDropdown}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-medium text-slate-700"
            >
              <option value="">
                {loadingDropdown 
                  ? 'Loading partners...' 
                  : `Select a registered ${formData.targetType === 'shelter' ? 'shelter' : 'veterinarian'}`
                }
              </option>
              {formData.targetType === 'shelter' ? (
                sheltersList.map(s => (
                  <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                ))
              ) : (
                vetsList.map(v => (
                  <option key={v.id || v._id} value={v.id || v._id}>{v.name}</option>
                ))
              )}
            </select>
            {errors.targetId && <p className="mt-1 text-xs text-red-500">{errors.targetId}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Complaint Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-medium text-slate-700"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <Input
            label="Complaint Subject *"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            error={errors.subject}
            placeholder="Brief title of your complaint"
          />

          <Textarea
            label="Complaint Description *"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            error={errors.description}
            placeholder="Provide detailed description of the issue"
            rows={5}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Priority *</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-medium text-slate-700"
            >
              {Object.values(COMPLAINT_PRIORITIES).map(p => (
                <option key={p} value={p.toLowerCase()}>{p}</option>
              ))}
            </select>
          </div>

          <Textarea
            label="Evidence Summary (Optional)"
            name="evidence"
            value={formData.evidence}
            onChange={handleInputChange}
            placeholder="Describe any evidence you have (photos, records, transcripts)"
            rows={3}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Attachments (Optional)</label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">Supported formats: JPG, PNG, PDF, DOC, DOCX. Max 10MB per file.</p>
            
            {uploading && <p className="mt-2 text-xs text-primary-500 font-medium animate-pulse">Uploading files...</p>}
            
            {uploadedAttachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Uploaded Files ({uploadedAttachments.length}):</p>
                {uploadedAttachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100 text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[250px]">{att.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{formatFileSize(att.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Contact Method *</label>
            <select
              name="contactPreference"
              value={formData.contactPreference}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-medium text-slate-700"
            >
              {CONTACT_PREFERENCES.map(p => (
                <option key={p} value={p.toLowerCase()}>{p}</option>
              ))}
            </select>
          </div>

          <Input
            label={formData.contactPreference === 'email' ? 'Email Address *' : 'Phone Number *'}
            name="contactDetail"
            value={formData.contactDetail}
            onChange={handleInputChange}
            error={errors.contactDetail}
            placeholder={formData.contactPreference === 'email' ? 'your.email@example.com' : 'Enter 10-digit phone number'}
            type={formData.contactPreference === 'email' ? 'email' : 'tel'}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/adopter/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
