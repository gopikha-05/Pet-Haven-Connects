import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiBell, FiSearch, FiLogOut, FiUser, FiSettings, FiChevronDown } from 'react-icons/fi';
import { PiPawPrint } from 'react-icons/pi';
import Sidebar, { MobileSidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { ROLE_DASHBOARD_PATHS } from '@/constants/roles';
import SearchBar from '@/components/common/SearchBar';

export default function DashboardLayout({ sidebarItems, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#f5f3ef] bg-gradient-to-br from-[#f7f6f2] via-[#eef3f2] to-[#e8edea]">
      {/* Subtle decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Abstract blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-200/8 to-teal-200/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-br from-amber-200/8 to-orange-200/8 rounded-full blur-3xl translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-teal-200/8 to-stone-200/8 rounded-full blur-3xl translate-y-1/2" />
      </div>
      
      <Sidebar items={sidebarItems} title={title} />
      <MobileSidebar items={sidebarItems} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="sticky top-0 z-20 bg-white/60 backdrop-blur-md border-b border-neutral-200/40 px-4 sm:px-6 h-16 flex items-center gap-4 shadow-sm">
          <button type="button" className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileOpen(true)}>
            <FiMenu size={22} />
          </button>
          <div className="flex-1 max-w-md hidden sm:block">
            <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link to="/notifications" className="p-2 rounded-lg hover:bg-slate-100 relative">
              <FiBell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
            </Link>
            
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                </div>
                <FiChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl border shadow-lg py-2 z-50"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email || 'user@email.com'}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                            {user?.role || 'user'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FiUser className="w-4 h-4" />
                        View Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FiSettings className="w-4 h-4" />
                        Settings
                      </Link>
                      <Link
                        to={ROLE_DASHBOARD_PATHS[user?.role] || '/'}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FiUser className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/');
                          setUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-transparent">
          <Outlet context={{ search }} />
        </main>
      </div>
    </div>
  );
}
