import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notificationService';

const SocketContext = createContext(null);

// Socket.io client connection
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
  transports: ['polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      notificationService.getUnreadCount().then(count => {
        setUnreadCount(count);
      }).catch(err => {
        console.error('Error fetching unread count:', err);
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket
      socket.connect();

      // Register user with socket
      socket.emit('register_user', user.id);

      // Listen for connection
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected:', socket.id);
        // Re-register user on reconnection
        socket.emit('register_user', user.id);
      });

      // Listen for disconnection
      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      // Listen for new notifications
      socket.on('new_notification', (notification) => {
        console.log('New notification received:', notification);
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        // Trigger a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
      });

      // Listen for notification count updates
      socket.on('notification_count', ({ count }) => {
        setUnreadCount(count);
        // Trigger custom event for badge updates
        window.dispatchEvent(new CustomEvent('notification_count', { detail: count }));
      });

      // Listen for errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Listen for custom events from fallback mechanism (when backend not available)
      const handleNewNotification = (event) => {
        console.log('New notification from fallback:', event.detail);
        setUnreadCount(prev => prev + 1);
      };

      window.addEventListener('new_notification', handleNewNotification);

      return () => {
        socket.disconnect();
        socket.off('connect');
        socket.off('disconnect');
        socket.off('new_notification');
        socket.off('notification_count');
        socket.off('error');
        window.removeEventListener('new_notification', handleNewNotification);
      };
    } else {
      // Disconnect if not authenticated
      socket.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
    unreadCount,
    setUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
