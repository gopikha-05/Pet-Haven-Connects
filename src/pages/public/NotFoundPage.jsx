import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '@/components/common/Button';
import { PiPawPrintFill } from 'react-icons/pi';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <PiPawPrintFill className="text-6xl text-primary-300 mx-auto mb-4" />
        <h1 className="text-8xl font-bold text-primary-600">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 mt-2">Page not found</h2>
        <p className="text-slate-500 mt-2 max-w-md">Looks like this page wandered off. Let&apos;s get you back home.</p>
        <Link to="/" className="inline-block mt-8"><Button>Back to Home</Button></Link>
      </motion.div>
    </div>
  );
}
