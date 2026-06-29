import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { useState } from 'react';

export default function Sidebar({ items, title = 'Dashboard' }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'hidden lg:flex flex-col bg-cream-50 border-r border-neutral-200/50 transition-all duration-300 shrink-0',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="font-semibold text-sm text-slate-800">{title}</span>
        )}
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 ml-auto">
          {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
              isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
            )}
            title={item.label}
          >
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function MobileSidebar({ items, isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onClose} />
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-72 bg-cream-50 z-50 shadow-xl lg:hidden border-r border-neutral-200/50"
      >
        <nav className="p-4 space-y-1 mt-16">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={onClose} className={({ isActive }) =>
              cn('flex items-center px-3 py-2.5 rounded-xl text-sm font-medium', isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600')
            }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}
