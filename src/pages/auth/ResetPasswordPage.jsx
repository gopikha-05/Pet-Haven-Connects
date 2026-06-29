import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import PasswordInput from '@/components/forms/PasswordInput';
import Button from '@/components/common/Button';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { validatePassword } from '@/utils/validation';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid = validToken && passwordValidation.valid && passwordsMatch;

  useEffect(() => {
    // Get token from URL params
    const tokenFromUrl = searchParams.get('token');
    console.log('[ResetPasswordPage] Token from URL:', tokenFromUrl ? `${tokenFromUrl.substring(0, 8)}...` : 'MISSING');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setValidToken(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validToken || !token) {
      toast('Invalid or missing reset token', 'error');
      return;
    }
    
    if (!passwordValidation.valid) {
      toast('Password does not meet security requirements.', 'error');
      return;
    }
    
    if (!passwordsMatch) {
      toast('Passwords do not match.', 'error');
      return;
    }
    
    console.log('[ResetPasswordPage] Submitting reset password with token:', token ? `${token.substring(0, 8)}...` : 'MISSING');
    
    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      toast('Password reset successfully!', 'success');
      navigate('/login');
    } catch (err) {
      console.error('[ResetPasswordPage] Reset password error:', err);
      toast(err.response?.data?.message || err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4">
          <FiArrowLeft /> Back to login
        </Link>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Reset Link</h2>
        <p className="text-slate-500 mb-6">This password reset link is invalid or has expired.</p>
        <Button onClick={() => navigate('/forgot-password')}>Request New Reset Link</Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4">
        <FiArrowLeft /> Back to login
      </Link>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset password</h2>
      <p className="text-slate-500 mb-6">Enter your new password below</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <PasswordInput 
            label="New Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          {password && (
            <div className="mt-3 space-y-1 text-xs">
              <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {password.length >= 8 ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                {/[A-Z]/.test(password) ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                <span>One uppercase letter</span>
              </div>
              <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                {/[a-z]/.test(password) ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                <span>One lowercase letter</span>
              </div>
              <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                {/[0-9]/.test(password) ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                <span>One number</span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <PasswordInput 
            label="Confirm Password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          {confirmPassword && (
            <div className={`mt-2 text-xs flex items-center gap-2 ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
              {passwordsMatch ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>
        
        <Button type="submit" className="w-full" loading={loading} disabled={!isFormValid}>
          Reset Password
        </Button>
      </form>
    </motion.div>
  );
}
