import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/formatters';

export default function HealthRecordsPage() {
  const [healthRecords, setHealthRecords] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('healthRecords');
    if (stored) {
      setHealthRecords(JSON.parse(stored));
    }
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Health Records</h1>
      {healthRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-slate-500">No health records yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {healthRecords.map((record) => (
            <div key={record.id} className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{record.petName}</h3>
                  <p className="text-sm text-slate-500">{record.petType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(record.visitDate || record.date)}</p>
                  <p className="text-xs text-slate-500">Completed: {formatDate(record.completedAt)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Purpose</p>
                  <p className="text-sm font-medium">{record.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Veterinarian</p>
                  <p className="text-sm font-medium">{record.vetName}</p>
                </div>
              </div>

              {record.symptoms && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Symptoms</p>
                  <p className="text-sm text-slate-700">{record.symptoms}</p>
                </div>
              )}

              {record.diagnosis && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Diagnosis</p>
                  <p className="text-sm text-slate-700">{record.diagnosis}</p>
                </div>
              )}

              {record.treatment && (
                <div className="bg-green-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Treatment</p>
                  <p className="text-sm text-slate-700">{record.treatment}</p>
                </div>
              )}

              {record.medications && (
                <div className="bg-purple-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Medications</p>
                  <p className="text-sm text-slate-700">{record.medications}</p>
                </div>
              )}

              {record.vaccination && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Vaccination</p>
                  <p className="text-sm text-slate-700">{record.vaccination}</p>
                </div>
              )}

              {record.vetNotes && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-1">Vet Notes</p>
                  <p className="text-sm text-slate-700">{record.vetNotes}</p>
                </div>
              )}

              {record.nextVisit && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Next Visit Recommended</p>
                  <p className="text-sm text-slate-700">{formatDate(record.nextVisit)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
