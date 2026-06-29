import { useState, useEffect } from 'react';
import KPICard from '@/components/common/KPICard';
import { formatTime } from '@/utils/formatters';

export default function VetDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  const fetchAppointments = () => {
    try {
      const stored = localStorage.getItem('vetAppointments');
      if (!stored) {
        setAppointments([]);
        return;
      }
      const data = JSON.parse(stored);
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setError('Failed to load appointments. Please refresh the page.');
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="relative">
        <h1 className="text-2xl font-bold mb-6">Vet Dashboard</h1>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
          <p className="text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              fetchAppointments();
            }}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today || a.status === 'confirmed');
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold mb-6">Vet Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Today's Appointments" value={todayAppointments.length} />
        <KPICard title="Pending" value={pendingAppointments.length} color="accent" />
        <KPICard title="Patients" value={appointments.length} color="blue" />
        <KPICard title="Vaccinations Due" value={appointments.filter((a) => a.type === 'vaccination').length} color="purple" />
      </div>
      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold mb-4">Upcoming Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-slate-500">No appointments scheduled yet.</p>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="flex justify-between py-3 border-b last:border-0">
              <span>{a.petName} — {a.purpose}</span>
              <span className="text-sm text-slate-500">{a.date} {formatTime(a.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
