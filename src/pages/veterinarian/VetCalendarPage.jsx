import { useState, useEffect } from 'react';
import { appointmentService } from '@/services/appointmentService';
import Badge from '@/components/common/Badge';
import { FiCalendar, FiClock, FiUser, FiCheckCircle, FiXCircle, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatTime } from '@/utils/formatters';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function VetCalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'all', 'upcoming', 'completed', 'cancelled'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data || []);
    } catch (error) {
      console.error('[VetCalendarPage] Failed to fetch appointments:', error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDays = firstDay + daysInMonth;
    
    return Array.from({ length: Math.ceil(totalDays / 7) * 7 }, (_, i) => {
      const day = i - firstDay + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  };

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    return appointments.filter(a => a.date === dateStr);
  };

  // Filter helper
  const filterAppointments = (apts) => {
    switch (activeFilter) {
      case 'upcoming':
        return apts.filter(a => ['pending', 'confirmed', 'rescheduled'].includes(a.status));
      case 'completed':
        return apts.filter(a => a.status === 'completed');
      case 'cancelled':
        return apts.filter(a => a.status === 'rejected');
      default:
        return apts;
    }
  };

  const calendarDays = getCalendarDays(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const selectedDayAppointments = filterAppointments(getAppointmentsForDay(selectedDay));

  const STATUS_COLORS = {
    pending: 'warning',
    confirmed: 'success',
    rejected: 'danger',
    rescheduled: 'primary',
    completed: 'success'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white rounded-2xl border p-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointment Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, filter, and schedule clinical appointments.</p>
        </div>
        <div className="flex gap-2 items-center bg-slate-50 border rounded-xl p-1.5">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-800"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm px-3 text-slate-700 min-w-[140px] text-center">{monthName}</span>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-800"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {days.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((d, i) => {
              const dayAppointments = getAppointmentsForDay(d);
              const isSelected = d === selectedDay;
              const isToday = d === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div 
                  key={i} 
                  onClick={() => d && setSelectedDay(d)}
                  className={`aspect-square p-2 rounded-2xl text-sm transition-all border relative flex flex-col justify-between cursor-pointer ${
                    d 
                      ? isSelected
                        ? 'bg-gradient-to-br from-amber-500 to-rose-500 text-white border-transparent shadow-md transform scale-105'
                        : isToday
                        ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                        : 'hover:bg-slate-50 border-slate-100 text-slate-800'
                      : 'border-transparent text-transparent pointer-events-none'
                  }`}
                >
                  {d && <span className="font-semibold">{d}</span>}
                  
                  {d && dayAppointments.length > 0 && (
                    <div className="flex gap-1 justify-center mt-1">
                      {dayAppointments.slice(0, 3).map((apt, idx) => (
                        <span 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : apt.status === 'confirmed'
                              ? 'bg-emerald-500'
                              : apt.status === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>+</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment details panel */}
        <div className="bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FiCalendar className="text-amber-500" />
                Selected: {selectedDay} {currentDate.toLocaleString('default', { month: 'short' })}
              </h2>
              <Badge variant="primary" className="text-xs">
                {getAppointmentsForDay(selectedDay).length} Total
              </Badge>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-1.5 bg-slate-50 rounded-xl p-1 mt-4 border">
              {[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'completed', label: 'Done' },
                { id: 'cancelled', label: 'Cancel' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all ${
                    activeFilter === f.id
                      ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Appointment list */}
            <div className="space-y-3 mt-4 overflow-y-auto max-h-[260px] pr-1.5">
              {selectedDayAppointments.length > 0 ? (
                selectedDayAppointments.map((apt) => (
                  <div key={apt.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{apt.petName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiUser className="w-3.5 h-3.5" />
                          {apt.adopterName}
                        </p>
                      </div>
                      <Badge variant={STATUS_COLORS[apt.status] || 'warning'} className="text-[10px] py-0.5 px-2">
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5 text-amber-500" />
                        {formatTime(apt.time)}
                      </span>
                      <span className="capitalize font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                        {apt.type}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                  <FiInfo className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium">No {activeFilter} appointments scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
