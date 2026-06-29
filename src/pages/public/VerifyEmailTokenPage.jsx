import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMail, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import api from '@/services/api';

export default function VerifyEmailTokenPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    console.log('[VerifyEmailTokenPage] Page loaded with token:', token);
    setStatus('pending');
    setMessage('Please enter your email address to receive a verification code.');
  }, [token]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setStatus('loading');
    try {
      const response = await api.post('/auth/validate-token-send-otp', { 
        token, 
        email: email.trim() 
      });
      
      console.log('[VerifyEmailTokenPage] OTP sent successfully:', response.data);
      
      // Navigate to OTP verification page with email
      navigate('/verify-otp', { 
        state: { 
          email: email.trim(),
          token 
        } 
      });
    } catch (error) {
      console.error('[VerifyEmailTokenPage] Error sending OTP:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="bg-paw-pattern min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full text-center transition-smooth">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLoader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verifying Your Email</h1>
          <p className="text-slate-600">Please wait while we process your request...</p>
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
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verification Failed</h1>
          <p className="text-slate-600 mb-6">{message}</p>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-card hover:shadow-card-hover"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paw-pattern min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-card p-8 max-w-md w-full transition-smooth">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Verify Your Email</h1>
          <p className="text-slate-600 text-sm">
            Please enter your email address to receive a verification code.
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
          
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-card hover:shadow-card-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:from-slate-200 hover:to-slate-300 transition-all"
          >
            Back to Login
          </button>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
