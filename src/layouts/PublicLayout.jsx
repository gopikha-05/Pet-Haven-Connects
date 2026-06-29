import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Subtle decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Abstract blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-200/15 to-orange-200/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-rose-200/15 to-pink-200/15 rounded-full blur-3xl translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-orange-200/15 to-amber-200/15 rounded-full blur-3xl translate-y-1/2" />
      </div>
      
      <Navbar />
      <main className="flex-1 relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
