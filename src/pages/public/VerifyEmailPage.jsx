import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      console.log('[VerifyEmailPage] Starting email verification with token:', token);
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        console.log('[VerifyEmailPage] Verification response:', response.data);
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Email verified successfully!');
          setUserData(response.data.user);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('[VerifyEmailPage] Verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Invalid or expired verification link');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      console.error('[VerifyEmailPage] No token provided');
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

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

  const handleResend = () => {
    navigate('/login');
  };

  if (status === 'loading') {
    return (
      <div className="bg-paw-pattern min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center transition-smooth">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifying Your Email</h1>
          <p className="text-slate-600">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-paw-pattern min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center transition-smooth">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Email Verified Successfully</h1>
          <p className="text-slate-600 mb-6">Your email has been verified successfully.</p>
          
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-card hover:shadow-card-hover"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-paw-pattern min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center transition-smooth">
          <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verification Link Expired</h1>
          <p className="text-slate-600 mb-6">{message}</p>
          
          <button
            onClick={handleResend}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-card hover:shadow-card-hover"
          >
            Resend Verification Email
          </button>
        </div>
      </div>
    );
  }

  return null;
}
