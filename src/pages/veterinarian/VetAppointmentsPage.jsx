import { useState, useEffect } from 'react';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatTime } from '@/utils/formatters';

import { appointmentService } from '@/services/appointmentService';

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'danger',
  rescheduled: 'primary',
  completed: 'success'
};

export default function VetAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleAmPm, setRescheduleAmPm] = useState('am');
  const { toast } = useToast();
  const { user } = useAuth();

  const timeOptions = [
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' }
  ];

  // Fetch appointments on mount and poll for updates
  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      console.log('[VetAppointmentsPage] Fetched appointments from backend:', data);
      setAppointments(data);
    } catch (error) {
      console.error('[VetAppointmentsPage] Error fetching appointments:', error);
      setAppointments([]);
    }
  };

  const handleAccept = async (id) => {
    try {
      await appointmentService.updateStatus(id, 'confirmed');
      toast('Appointment confirmed.', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('[VetAppointmentsPage] Error accepting appointment:', error);
      toast('Failed to accept appointment', 'error');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please provide rejection reason:');
    if (reason) {
      try {
        await appointmentService.updateStatus(id, 'rejected', reason);
        toast(`Appointment rejected. Reason: ${reason}`, 'info');
        fetchAppointments();
      } catch (error) {
        console.error('[VetAppointmentsPage] Error rejecting appointment:', error);
        toast('Failed to reject appointment', 'error');
      }
    }
  };

  const handleReschedule = (id) => {
    setSelectedAppointment(id);
  };

  const confirmReschedule = async () => {
    if (selectedAppointment && rescheduleDate && rescheduleTime) {
      try {
        await appointmentService.reschedule(selectedAppointment, rescheduleDate, rescheduleTime);
        toast('Appointment rescheduled.', 'success');
        setSelectedAppointment(null);
        setRescheduleDate('');
        setRescheduleTime('');
        setRescheduleAmPm('am');
        fetchAppointments();
      } catch (error) {
        console.error('[VetAppointmentsPage] Error rescheduling appointment:', error);
        toast('Failed to reschedule appointment', 'error');
      }
    }
  };

  const handleComplete = async (id) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      await appointmentService.updateStatus(id, 'completed');
      
      // Add health record entry
      if (appointment) {
        const healthRecord = {
          id: Date.now(),
          petName: appointment.petName,
          petType: appointment.petType || 'Dog',
          purpose: appointment.purpose || 'Checkup',
          symptoms: appointment.symptoms || appointment.notes || '',
          vetName: appointment.vetName,
          date: appointment.date,
          completedAt: new Date().toISOString(),
          status: 'completed'
        };
        const existingHealthRecords = JSON.parse(localStorage.getItem('healthRecords') || '[]');
        localStorage.setItem('healthRecords', JSON.stringify([...existingHealthRecords, healthRecord]));
      }
      
      toast('Appointment marked as completed. Health record updated.', 'success');
      fetchAppointments();
    } catch (error) {
      console.error('[VetAppointmentsPage] Error completing appointment:', error);
      toast('Failed to complete appointment', 'error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <p className="text-slate-500">No appointments scheduled yet.</p>
          </div>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{a.petName}</h3>
                  <p className="text-sm text-slate-500 capitalize">{a.purpose} · {a.symptoms}</p>
                  {a.adopterName && <p className="text-sm text-slate-400">by {a.adopterName}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{a.date} {formatTime(a.time)}</p>
                  <Badge variant={STATUS_COLORS[a.status]}>{a.status}</Badge>
                </div>
              </div>
              
              {a.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="primary" onClick={() => handleAccept(a.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(a.id)}>
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReschedule(a.id)}>
                    Reschedule
                  </Button>
                </div>
              )}

              {a.status === 'confirmed' && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button size="sm" variant="success" onClick={() => handleComplete(a.id)}>
                    Mark Complete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReschedule(a.id)}>
                    Reschedule
                  </Button>
                </div>
              )}

              {a.status === 'rejected' && a.rejectionReason && (
                <p className="text-sm text-red-600 mt-2">Rejection reason: {a.rejectionReason}</p>
              )}

              {selectedAppointment === a.id && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Reschedule Appointment</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="border rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={confirmReschedule}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedAppointment(null);
                      setRescheduleDate('');
                      setRescheduleTime('');
                      setRescheduleAmPm('am');
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
