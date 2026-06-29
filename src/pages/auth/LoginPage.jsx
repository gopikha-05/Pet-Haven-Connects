import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiAlertCircle } from 'react-icons/fi';
import Input from '@/components/forms/Input';
import PasswordInput from '@/components/forms/PasswordInput';
import Button from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

const demoAccounts = [
  { email: 'adopter@pethaven.com', password: 'Adopter@123', role: 'Adopter' },
  { email: 'shelter@pethaven.com', password: 'Shelter@123', role: 'Shelter' },
  { email: 'vet@pethaven.com', password: 'Vet@123456', role: 'Vet' },
  { email: 'admin@pethaven.com', password: 'Admin@123456', role: 'Admin' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [warningEmail, setWarningEmail] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleResendVerification = async () => {
    try {
      await api.post('/auth/resend-verification', { email: warningEmail });
      toast('Verification email sent successfully', 'success');
      setShowEmailWarning(false);
    } catch (error) {
      toast(error.response?.data?.message || 'Failed to send verification email', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { redirect } = await login(email, password, remember);
      navigate(from || redirect, { replace: true });
      toast('Welcome back!', 'success');
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.requiresEmailVerification) {
        setShowEmailWarning(true);
        setWarningEmail(email);
        toast(errorData.message || 'Please verify your email', 'warning');
      } else if (errorData?.requiresApproval) {
        toast(errorData.message || 'Your account is pending approval', 'warning');
        if (errorData.licenseVerificationStatus === 'rejected') {
          toast(`Rejection reason: ${errorData.rejectionReason}`, 'error');
        }
      } else {
        toast(errorData?.message || 'Login failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
      <p className="text-slate-500 mb-6">Sign in to your PetHaven account</p>
      
      {showEmailWarning && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">Your email is not verified</p>
            <p className="text-xs text-amber-700 mb-2">Please verify your email to continue using your account.</p>
            <button
              type="button"
              onClick={handleResendVerification}
              className="text-xs font-medium text-amber-800 hover:text-amber-900 underline"
            >
              Resend Verification Code
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" icon={FiMail} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-slate-300 text-primary-600" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-primary-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={loading}>Sign In</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Register</Link>
      </p>
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-2">Demo accounts (click to fill):</p>
        <div className="flex flex-wrap gap-2">
          {demoAccounts.map((acc) => (
            <button key={acc.email} type="button" onClick={() => fillDemo(acc)} className="text-xs px-2 py-1 bg-white border rounded-lg hover:border-primary-300">
              {acc.role}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
