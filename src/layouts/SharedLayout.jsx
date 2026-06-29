import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PiPawPrint } from 'react-icons/pi';

export default function SharedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Subtle decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Abstract blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl translate-y-1/2" />
        
        {/* Floating background paws */}
        <div className="absolute top-12 left-10 text-slate-400/5 text-5xl rotate-12"><PiPawPrint /></div>
        <div className="absolute top-1/4 right-20 text-slate-400/5 text-7xl -rotate-12"><PiPawPrint /></div>
        <div className="absolute bottom-24 left-1/4 text-slate-400/5 text-6xl rotate-45"><PiPawPrint /></div>
        <div className="absolute bottom-1/3 right-1/3 text-slate-400/5 text-8xl -rotate-45"><PiPawPrint /></div>
        <div className="absolute top-1/2 left-1/3 text-slate-400/5 text-5xl rotate-12"><PiPawPrint /></div>
        <div className="absolute bottom-10 right-10 text-slate-400/5 text-7xl rotate-30"><PiPawPrint /></div>
      </div>
      
      <Navbar />
      <main className="flex-1 relative">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
