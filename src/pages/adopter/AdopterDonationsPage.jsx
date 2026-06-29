import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Badge from '@/components/common/Badge';
import { dataService } from '@/services/dataService';

export default function AdopterDonationsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await dataService.getTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch transactions from backend:', error);
        const stored = localStorage.getItem('transactions');
        if (stored) {
          setTransactions(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions History</h1>
      <section className="bg-white rounded-2xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500 border-b bg-slate-50/50">
                  <th className="py-3 px-6 font-semibold">Pet / Description</th>
                  <th className="py-3 px-6 font-semibold">Shelter</th>
                  <th className="py-3 px-6 font-semibold">Transaction ID</th>
                  <th className="py-3 px-6 font-semibold">Amount & Method</th>
                  <th className="py-3 px-6 font-semibold">Date & Time</th>
                  <th className="py-3 px-6 font-semibold">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const statusVariants = {
                    completed: 'success',
                    pending: 'warning',
                    processing: 'warning',
                    failed: 'danger',
                    cancelled: 'danger',
                    expired: 'danger',
                  };
                  
                  return (
                    <tr key={t.id || t._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          {t.petImage ? (
                            <img 
                              src={t.petImage.startsWith('http') ? t.petImage : t.petImage} 
                              alt={t.petName} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-100">
                              {t.petName?.slice(0, 2).toUpperCase() || 'PH'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{t.petName || 'General Donation'}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {t.shelterName || 'Pet Haven Shelter'}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        {t.paymentReference || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-800">
                        <p className="font-semibold text-primary-700">{formatCurrency(t.amount)}</p>
                        <p className="text-xs text-slate-400 capitalize">{t.method || 'UPI'}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-xs">
                        {new Date(t.date).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusVariants[t.status] || 'default'}>{t.status}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {t.status === 'completed' && (
                          <button
                            onClick={() => setSelectedReceipt(t)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition bg-transparent border-0 cursor-pointer p-0"
                          >
                            View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 text-sm">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Typography-Only Premium Receipt Modal Detail View */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border border-slate-100 p-6 relative">
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 border-0 bg-transparent cursor-pointer"
            >
              Close
            </button>

            <div className="text-center mb-6 pt-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold mb-3">
                Success
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Receipt</h3>
              <p className="text-xs text-slate-500 mt-1">Thank you for your adoption fee payment!</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-4 mb-6 space-y-3.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Transaction ID</span>
                <span className="font-mono text-slate-800 font-bold">{selectedReceipt.paymentReference || selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Adopter Name</span>
                <span className="text-slate-800 font-semibold">{selectedReceipt.adopterName || 'Adopter'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Pet Adopted</span>
                <span className="text-slate-800 font-semibold">{selectedReceipt.petName || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Shelter</span>
                <span className="text-slate-800 font-semibold">{selectedReceipt.shelterName || 'Pet Haven Shelter'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="text-slate-800 font-semibold capitalize">{selectedReceipt.method || 'UPI'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Timestamp</span>
                <span className="text-slate-800 font-semibold">{new Date(selectedReceipt.date).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-slate-700">Amount Paid</span>
              <span className="text-xl font-extrabold text-emerald-600">{formatCurrency(selectedReceipt.amount)}</span>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold text-sm transition shadow-md border-0 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
