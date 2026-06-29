import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-red-500">
        <FiAlertTriangle size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Error</h3>
      <p className="text-slate-500 max-w-sm mb-6">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try Again</Button>}
    </div>
  );
}
