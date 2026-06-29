import { motion } from 'framer-motion';
import { FiClock, FiMail, FiCheckCircle } from 'react-icons/fi';
import Button from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovalPage() {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="mb-6 flex justify-center">
        <FiClock className="w-16 h-16 text-amber-500" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted</h2>
      
      <p className="text-slate-500 mb-6">
        Your account has been submitted for admin approval. This process typically takes 24-48 hours.
      </p>

      <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <FiCheckCircle className="text-green-500" />
          Next Steps:
        </h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex items-start gap-2">
            <FiMail className="mt-1 text-slate-400" />
            <span>Check your email for verification link and click to verify your email address</span>
          </li>
          <li className="flex items-start gap-2">
            <FiClock className="mt-1 text-slate-400" />
            <span>Wait for admin to review your license and approve your account</span>
          </li>
          <li className="flex items-start gap-2">
            <FiCheckCircle className="mt-1 text-slate-400" />
            <span>Once approved, you'll receive a confirmation email</span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button className="w-full" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
        <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </motion.div>
  );
}
