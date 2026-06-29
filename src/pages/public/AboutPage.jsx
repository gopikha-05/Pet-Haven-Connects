import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-slate-800 mb-4">About PetHaven Connect</h1>
        <p className="text-lg text-slate-600 mb-8">
          PetHaven Connect is a comprehensive pet adoption and care management platform designed to streamline the adoption process while ensuring the highest standards of animal welfare.
        </p>
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>Our mission is to connect loving families with pets in need through verified shelters, professional veterinary care, and transparent adoption workflows.</p>
          <h2 className="text-2xl font-semibold text-slate-800">What we offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Role-based dashboards for adopters, shelter staff, veterinarians, and administrators</li>
            <li>End-to-end adoption application tracking</li>
            <li>Medical records, vaccination tracking, and appointment scheduling</li>
            <li>Donation and billing management with multiple payment options</li>
            <li>Analytics and insights for platform-wide improvement</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
