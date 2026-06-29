import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const faqs = [
  { q: 'How does the adoption process work?', a: 'Browse pets, submit an application, and track status through your adopter dashboard. Shelters review and approve applications typically within 1-2 weeks.' },
  { q: 'What are the adoption fees?', a: 'Fees vary by pet and shelter, typically ₹2,000–₹6,000 covering vaccinations, microchipping, and care while at the shelter.' },
  { q: 'How do shelter and vet verifications work?', a: 'Shelters submit SHL-YYYY-XXXXX licenses; vets submit VET-YYYY-XXXXX. Our admin team verifies within 24-48 hours (mock in demo).' },
  { q: 'Can I donate without adopting?', a: 'Yes! Visit our Donate page to support shelters via UPI, card, or wallet (mock payment in demo).' },
  { q: 'How do I schedule a vet visit?', a: 'Adopters with approved adoptions can book appointments through the Vet Booking section in their dashboard.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border overflow-hidden">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between p-4 text-left font-medium">
              {faq.q}
              <FiChevronDown className={`transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
