import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/utils/formatters';
import EmptyState from '@/components/common/EmptyState';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const typeColors = { 
  adoption: 'bg-blue-500', 
  vaccination: 'bg-amber-500', 
  payment: 'bg-emerald-500', 
  appointment: 'bg-purple-500', 
  shelter: 'bg-teal-500', 
  complaint: 'bg-red-500', 
  complaint_status: 'bg-orange-500',
  system: 'bg-slate-500'
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications on mount and poll for updates
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  const fetchNotifications = () => {
    try {
      const stored = localStorage.getItem('notifications');
      const allNotifications = stored ? JSON.parse(stored) : [];
      
      // Filter notifications based on user role
      let filteredNotifications = [];
      if (user?.role === 'vet') {
        filteredNotifications = allNotifications.filter(n => n.recipientRole === 'vet' || n.recipientId === user.id);
      } else if (user?.role === 'shelter') {
        filteredNotifications = allNotifications.filter(n => n.recipientRole === 'shelter');
      } else if (user?.role === 'admin') {
        // Admin only sees complaints and adoption notifications
        filteredNotifications = allNotifications.filter(n => n.type === 'complaint' || n.type === 'adoption');
      } else {
        filteredNotifications = allNotifications.filter(n => n.recipientId === user.id);
      }
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const handleMarkAsRead = (notificationId) => {
    try {
      const stored = localStorage.getItem('notifications');
      const allNotifications = stored ? JSON.parse(stored) : [];
      const updatedNotifications = allNotifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    try {
      const stored = localStorage.getItem('notifications');
      const allNotifications = stored ? JSON.parse(stored) : [];
      const updatedNotifications = allNotifications.map(n => ({ ...n, isRead: true }));
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = (notificationId) => {
    try {
      const stored = localStorage.getItem('notifications');
      const allNotifications = stored ? JSON.parse(stored) : [];
      const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast('Notification deleted', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (!notifications?.length) return <EmptyState icon={FiBell} title="No notifications" description="You're all caught up!" />;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-200 p-6 mb-6 shadow-lg bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {notifications.map((n) => {
          const isRead = n.isRead !== undefined ? n.isRead : n.read;
          return (
            <div 
              key={n.id} 
              className={cn('p-4 rounded-xl border bg-white shadow-md flex gap-4 transition-all hover:shadow-lg hover:scale-[1.02]', !isRead && 'border-pink-300 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50')}
            >
              <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', typeColors[n.type] || 'bg-slate-300')} />
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-900">{n.title}</p>
                <p className="text-slate-600 text-sm mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                {!isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <FiCheck className="w-4 h-4 text-slate-500" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
