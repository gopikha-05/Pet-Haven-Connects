import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/utils/formatters';

import { appointmentService } from '@/services/appointmentService';

export default function VetAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (error) {
      console.error('[VetAppointmentsPage] Error fetching appointments from backend:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Vet Appointments</h1>
      
      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-slate-500">No vet appointments booked yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{appointment.petName}</h3>
                  <p className="text-sm text-slate-500">Veterinarian: {appointment.vetName}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-medium">{formatDate(appointment.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-medium">{formatTime(appointment.time)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Purpose</p>
                  <p className="text-sm font-medium">{appointment.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pet Type</p>
                  <p className="text-sm font-medium">{appointment.petType}</p>
                </div>
              </div>

              {appointment.rescheduledDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Rescheduled to:</strong> {formatDate(appointment.rescheduledDate)} at {formatTime(appointment.rescheduledTime)}
                  </p>
                  {appointment.rescheduleReason && (
                    <p className="text-xs text-yellow-700 mt-1">Reason: {appointment.rescheduleReason}</p>
                  )}
                </div>
              )}

              {appointment.status === 'rejected' && appointment.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {appointment.rejectionReason}
                  </p>
                </div>
              )}

              {appointment.status === 'completed' && appointment.notes && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Vet Notes:</strong> {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
