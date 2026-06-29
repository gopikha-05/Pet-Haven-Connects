import { createContext, useContext, useCallback, useEffect, useState } from 'react';

const DataSyncContext = createContext(null);

export const DATA_SYNC_EVENTS = {
  USER_REGISTERED: 'user_registered',
  USER_UPDATED: 'user_updated',
  PET_CREATED: 'pet_created',
  PET_UPDATED: 'pet_updated',
  PET_DELETED: 'pet_deleted',
  PET_STATUS_CHANGED: 'pet_status_changed',
  ADOPTION_CREATED: 'adoption_created',
  ADOPTION_UPDATED: 'adoption_updated',
  ADOPTION_APPROVED: 'adoption_approved',
  ADOPTION_REJECTED: 'adoption_rejected',
  COMPLAINT_CREATED: 'complaint_created',
  COMPLAINT_UPDATED: 'complaint_updated',
  COMPLAINT_RESOLVED: 'complaint_resolved',
  MEDICAL_RECORD_UPDATED: 'medical_record_updated',
  VACCINATION_UPDATED: 'vaccination_updated',
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_UPDATED: 'appointment_updated',
  REFRESH_USERS: 'refresh_users',
  REFRESH_SHELTERS: 'refresh_shelters',
  REFRESH_VETS: 'refresh_vets',
  REFRESH_PETS: 'refresh_pets',
  REFRESH_COMPLAINTS: 'refresh_complaints',
  REFRESH_APPLICATIONS: 'refresh_applications',
  REFRESH_ALL: 'refresh_all',
};

export function DataSyncProvider({ children }) {
  const [listeners, setListeners] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);

  const subscribe = useCallback((event, callback) => {
    setListeners((prev) => {
      const eventListeners = prev[event] || [];
      if (!eventListeners.includes(callback)) {
        return { ...prev, [event]: [...eventListeners, callback] };
      }
      return prev;
    });

    return () => {
      setListeners((prev) => {
        const eventListeners = prev[event] || [];
        return {
          ...prev,
          [event]: eventListeners.filter((cb) => cb !== callback),
        };
      });
    };
  }, []);

  const emit = useCallback((event, data) => {
    const eventListeners = listeners[event] || [];
    eventListeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }, [listeners]);

  const triggerRefresh = useCallback((event) => {
    emit(event);
    setRefreshCounter((prev) => prev + 1);
  }, [emit]);

  const value = {
    subscribe,
    emit,
    triggerRefresh,
    refreshCounter,
    events: DATA_SYNC_EVENTS,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const ctx = useContext(DataSyncContext);
  if (!ctx) throw new Error('useDataSync must be used within DataSyncProvider');
  return ctx;
}

export function useDataRefresh(event, callback, deps = []) {
  const { subscribe } = useDataSync();

  useEffect(() => {
    return subscribe(event, callback);
  }, [event, callback, subscribe, ...deps]);
}
