import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import Input from '@/components/forms/Input';
import Button from '@/components/common/Button';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      toast('If an account exists for this email address, a password reset link has been sent.', 'success');
      setEmail('');
    } catch (err) {
      toast(err.response?.data?.message || err.message || 'Failed to send reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <FiArrowLeft /> Back to login
      </Link>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset password</h2>
      <p className="text-slate-500 mb-6">We&apos;ll send a reset link to your email</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" icon={FiMail} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
      </form>
    </motion.div>
  );
}
