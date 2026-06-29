import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut, FiSettings, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import { PiPawPrintFill } from 'react-icons/pi';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { ROLE_DASHBOARD_PATHS } from '@/constants/roles';
import Button from '@/components/common/Button';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/stories', label: 'Stories' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
  { to: '/donate', label: 'Donate' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Check if there's navigation history to show back button
  const canGoBack = window.history.length > 1 && location.pathname !== '/';

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

  // Listen for notification count updates
  useEffect(() => {
    const handleNotificationCount = (event) => {
      // Count is updated via SocketContext
    };
    window.addEventListener('notification_count', handleNotificationCount);
    return () => window.removeEventListener('notification_count', handleNotificationCount);
  }, []);

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                title="Go back"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            <Link to={isAuthenticated ? '/profile' : '/'} className="flex items-center gap-2 text-primary-700 font-bold text-xl">
              <PiPawPrintFill className="text-2xl text-primary-600" />
              <span className="font-display hidden sm:inline">PetHaven Connect</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {publicLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'}`
              }>{l.label}</NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="p-2 rounded-lg hover:bg-slate-100 relative text-slate-600">
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-accent-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(ROLE_DASHBOARD_PATHS[user?.role] || '/')}
                  className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  Dashboard
                </Button>
                
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
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Get Started</Button>
              </>
            )}
          </div>

          <button type="button" className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden border-t py-4"
            >
              <div className="flex flex-col gap-2">
                {publicLinks.map((l) => (
                  <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-2 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">{l.label}</NavLink>
                ))}
                {!isAuthenticated ? (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => { navigate('/login'); setOpen(false); }}>Login</Button>
                    <Button className="flex-1" onClick={() => { navigate('/register'); setOpen(false); }}>Register</Button>
                  </div>
                ) : (
                  <>
                    <Link to="/notifications" onClick={() => setOpen(false)} className="px-2 py-2 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2">
                      <FiBell size={18} />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    
                    {/* Mobile User Info */}
                    <div className="px-2 py-3 bg-slate-50 rounded-lg mt-2">
                      <div className="flex items-center gap-3 mb-3">
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
                      <div className="space-y-1">
                        <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
                          <FiUser className="w-4 h-4" />
                          View Profile
                        </Link>
                        <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
                          <FiSettings className="w-4 h-4" />
                          Settings
                        </Link>
                        <Link to={ROLE_DASHBOARD_PATHS[user?.role] || '/'} onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
                          <FiUser className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            navigate('/');
                            setOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
