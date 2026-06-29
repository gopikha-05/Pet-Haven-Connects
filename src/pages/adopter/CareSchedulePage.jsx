import { formatTime } from '@/utils/formatters';

const schedule = [
  { time: '08:00', task: 'Morning feeding', pet: 'Luna', done: true },
  { time: '12:00', task: 'Fresh water check', pet: 'Luna', done: true },
  { time: '18:00', task: 'Evening walk', pet: 'Luna', done: false },
  { time: '20:00', task: 'Grooming brush', pet: 'Luna', done: false },
];

export default function CareSchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Daily Care Schedule</h1>
      <div className="space-y-3">
        {schedule.map((s) => (
          <div key={s.time} className={`flex items-center gap-4 p-4 rounded-xl border bg-white ${s.done ? 'opacity-60' : ''}`}>
            <span className="font-mono text-sm text-primary-600 w-14">{formatTime(s.time)}</span>
            <div className="flex-1">
              <p className="font-medium">{s.task}</p>
              <p className="text-xs text-slate-500">{s.pet}</p>
            </div>
            <input type="checkbox" defaultChecked={s.done} className="w-5 h-5 rounded text-primary-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
