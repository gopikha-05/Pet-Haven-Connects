import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

export default function ContactPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast('Message sent! We\'ll respond within 24 hours.', 'success');
      setLoading(false);
      e.target.reset();
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Contact Us</h1>
        <p className="text-slate-600 mb-8">Have questions? We&apos;d love to hear from you.</p>
        <ul className="space-y-4">
          <li className="flex items-center gap-3 text-slate-600"><FiMail className="text-primary-600" /> support@pethaven.com</li>
          <li className="flex items-center gap-3 text-slate-600"><FiPhone className="text-primary-600" /> +91 1800-PET-CARE</li>
          <li className="flex items-center gap-3 text-slate-600"><FiMapPin className="text-primary-600" /> Mumbai, Maharashtra, India</li>
        </ul>
      </motion.div>
      <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <Input label="Name" required name="name" />
        <Input label="Email" type="email" required name="email" />
        <Input label="Subject" required name="subject" />
        <Textarea label="Message" rows={5} required name="message" />
        <Button type="submit" className="w-full" loading={loading}>Send Message</Button>
      </motion.form>
    </div>
  );
}
