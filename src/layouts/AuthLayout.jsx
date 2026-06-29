import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiPawPrintFill } from 'react-icons/pi';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex gradient-hero flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
          <PiPawPrintFill className="text-3xl" /> PetHaven Connect
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-4">Find your perfect companion</h1>
          <p className="text-primary-100 text-lg max-w-md">Join thousands of adopters, shelters, and veterinarians building a better world for pets.</p>
        </motion.div>
        <p className="text-sm text-primary-200">© PetHaven Connect 2026</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Abstract blobs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl translate-y-1/2" />
        </div>
        
        <div className="w-full max-w-md relative">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-primary-700 font-bold text-xl mb-8">
            <PiPawPrintFill className="text-2xl" /> PetHaven Connect
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
