import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import Button from '@/components/common/Button';

export default function FilterDrawer({ isOpen, onClose, title = 'Filters', children, onApply, onReset }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
                <FiX size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onReset}>Reset</Button>
              <Button className="flex-1" onClick={() => { onApply?.(); onClose(); }}>Apply</Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
