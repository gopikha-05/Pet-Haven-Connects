import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import api from '@/services/api';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
      setMessage(`A verification code has been sent to ${stateEmail}. Please enter it below.`);
    } else {
      setMessage('Please enter your email address and the verification code sent to your email.');
    }
  }, [location.state]);

  useEffect(() => {
    let timer;
    if (status === 'pending' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setStatus('expired');
      setMessage('Verification code has expired. Please request a new code.');
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }
    
    if (!otp.trim()) {
      setMessage('Please enter the verification code');
      return;
    }
    
    setStatus('loading');
    setLoading(true);
    try {
      const result = await api.post('/auth/verify-otp', { 
        email: email.trim(), 
        otp: otp.trim() 
      });
      
      console.log('[VerifyOTPPage] OTP verified successfully:', result.data);
      
      setStatus('success');
      setUserData(result.data.user);
      
      const requiresApproval = result.data.needsApproval && !result.data.isApproved;
      
      if (requiresApproval) {
        setMessage('Email verified successfully! Your account is pending admin approval before you can sign in.');
      } else {
        setMessage(result.data.message || 'Email verified successfully!');
      }
    } catch (error) {
      console.error('[VerifyOTPPage] OTP verification error:', error);
      setStatus('error');
      const errorMsg = error.response?.data?.message || error.message || 'Verification failed';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      const token = location.state?.token;
      if (!token) {
        throw new Error('Missing verification token');
      }
      
      await api.post('/auth/validate-token-send-otp', { 
        token, 
        email: email.trim() 
      });
      
      setStatus('pending');
      setTimeLeft(300); // Reset timer to 5 minutes
      setOtp(''); // Clear OTP input
      setMessage(`A new verification code has been sent to ${email}. Please enter it below.`);
    } catch (error) {
      console.error('[VerifyOTPPage] Error resending OTP:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to resend verification code';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (userData) {
      const roleRedirects = {
        adopter: '/adopter/dashboard',
        shelter: '/shelter/dashboard',
        vet: '/vet/dashboard',
        admin: '/admin/dashboard'
      };
      navigate(roleRedirects[userData.role] || '/login');
    } else {
      navigate('/login');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLoader className="w-8 h-8 text-slate-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifying...</h1>
          <p className="text-slate-600">Please wait while we verify your code.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Email Verified!</h1>
          <p className="text-slate-600 mb-6">{message}</p>
          
          <button
            onClick={handleContinue}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {status === 'expired' ? 'Code Expired' : 'Verification Failed'}
          </h1>
          <p className="text-slate-600 mb-6">{message}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Code'
              )}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Enter Verification Code</h1>
          <p className="text-slate-600 text-sm">
            {message}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter the 6-character code"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-wider"
              maxLength={6}
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Code expires in: <span className="font-semibold text-blue-600">{formatTime(timeLeft)}</span>
            </p>
          </div>
          
          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>
          
          <button
            onClick={handleResendOTP}
            disabled={loading}
            className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-transparent text-slate-500 py-2 rounded-xl font-medium hover:text-slate-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
