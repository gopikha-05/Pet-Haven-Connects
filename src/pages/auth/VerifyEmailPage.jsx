import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResend = async () => {
    if (!email) {
      toast('Please register again', 'error');
      navigate('/register');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      toast('Verification email sent successfully', 'success');
    } catch (error) {
      toast(error.response?.data?.message || 'Failed to send verification email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="mb-6 flex justify-center">
        <FiMail className="w-16 h-16 text-slate-400" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">Check Your Email</h2>

      <p className="text-slate-500 mb-6">
        {email 
          ? `A verification link has been sent to ${email}. Please click the link in your email to verify your account.`
          : 'A verification link has been sent to your email. Please click the link in your email to verify your account.'}
      </p>

      <div className="space-y-4">
        <p className="text-sm text-slate-500 text-left bg-slate-50 border border-slate-100 p-4 rounded-xl">
          📧 Please check your inbox (and spam folder) for the verification email. The link will expire in 24 hours.
        </p>
        
        <Button className="w-full" variant="outline" onClick={handleResend} loading={loading}>
          Resend Verification Email
        </Button>
        
        <Button className="w-full" variant="secondary" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </div>
    </motion.div>
  );
}
