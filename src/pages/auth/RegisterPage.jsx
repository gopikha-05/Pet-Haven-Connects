import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiUser, FiPhone, FiFileText } from 'react-icons/fi';
import Input from '@/components/forms/Input';
import PasswordInput from '@/components/forms/PasswordInput';
import Select from '@/components/forms/Select';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authService } from '@/services/authService';
import { ROLES, ROLE_LABELS } from '@/constants/roles';

const roleOptions = ROLES && ROLE_LABELS ? Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) : [];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: ROLES?.ADOPTER || 'adopter', name: '', email: '', phone: '', password: '', license: '' });
  const [loading, setLoading] = useState(false);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const needsLicense = form.role && ROLES && [ROLES.SHELTER, ROLES.VET].includes(form.role);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLicenseChange = async (e) => {
    const license = e.target.value;
    update('license', license);
    
    if (license && needsLicense) {
      try {
        const { validateLicense } = await import('@/utils/validation');
        const isValid = validateLicense(license, form.role);
        setLicenseVerified(isValid);
      } catch (error) {
        console.error('License validation error:', error);
        setLicenseVerified(false);
      }
    } else {
      setLicenseVerified(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Form data before registration:', form);
      
      // Ensure role is set
      if (!form.role) {
        toast('Please select a role', 'error');
        setLoading(false);
        return;
      }
      
      // Map form fields to backend expected format
      const registrationData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        licenseNumber: needsLicense ? form.license : undefined
      };
      
      console.log('Registration data:', registrationData);
      
      const result = await register(registrationData);
      toast('Registration successful!', 'success');
      toast('Verification link has been sent to your email.', 'success');
      
      if (result.needsEmailVerification) {
        // Store the user email for display on the verify email page
        sessionStorage.setItem('userEmail', form.email);
        navigate('/verify-email');
      } else if (result.requiresApproval) {
        navigate('/pending-approval');
      } else if (result.redirect) {
        navigate(result.redirect);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Show specific error message if available, otherwise show generic message
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Create account</h2>
      <p className="text-slate-500 mb-6">Join PetHaven Connect — choose your role</p>

      <div className="flex gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-primary-600' : 'bg-slate-200'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 && (
          <>
            <Select label="I am a..." value={form.role} onChange={(e) => update('role', e?.target?.value || e)} options={roleOptions} />
            <Input label="Full Name" icon={FiUser} value={form.name} onChange={(e) => update('name', e.target.value)} required />
            <Input label="Email" type="email" icon={FiMail} value={form.email} onChange={(e) => update('email', e.target.value)} required />
            <Input label="Phone" icon={FiPhone} value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
            <Button type="button" className="w-full" onClick={() => setStep(2)}>Continue</Button>
          </>
        )}
        {step === 2 && (
          <>
            <PasswordInput value={form.password} onChange={(e) => update('password', e.target.value)} required />
            {needsLicense && (
              <div className="space-y-2">
                <Input 
                  label="License Number" 
                  icon={FiFileText} 
                  placeholder={form.role === (ROLES?.SHELTER) ? 'SHL-2024-10452' : 'VET-2024-88231'} 
                  value={form.license} 
                  onChange={handleLicenseChange} 
                  required 
                />
                {licenseVerified && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-sm text-emerald-800">
                    ✓ License format verified
                  </div>
                )}
                <p className="text-xs text-slate-500">Shelter/vet accounts require admin approval before login. City and clinic will be retrieved after approval.</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" className="flex-1" loading={loading}>Register</Button>
            </div>
          </>
        )}
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </motion.div>
  );
}
