const feedback = [
  { user: 'Sarah M.', rating: 5, comment: 'Very thorough checkup for Luna!', date: '2026-05-10' },
  { user: 'John D.', rating: 4, comment: 'Professional and caring.', date: '2026-05-05' },
];

export default function VetFeedbackPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Patient Feedback</h1>
      <div className="space-y-4">
        {feedback.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl border p-5">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{f.user}</span>
              <span className="text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
            </div>
            <p className="text-slate-600 text-sm">{f.comment}</p>
            <p className="text-xs text-slate-400 mt-2">{f.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
