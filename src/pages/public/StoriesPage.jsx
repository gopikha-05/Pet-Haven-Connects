import { motion } from 'framer-motion';

const stories = [
  { name: 'Sarah & Luna', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', quote: 'Luna brought so much joy to our apartment. The adoption process was smooth and transparent.', date: 'April 2026' },
  { name: 'Mike & Buddy', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', quote: 'Buddy is the best walking companion. Happy Paws Shelter was incredibly supportive.', date: 'March 2026' },
  { name: 'Priya & Milo', image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400', quote: 'Our first rabbit! PetHaven made finding Milo easy with great filters and pet profiles.', date: 'February 2026' },
];

export default function StoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-800 mb-2 text-center">Adoption Success Stories</h1>
      <p className="text-slate-500 text-center mb-12">Real families, real happy endings</p>
      <div className="grid md:grid-cols-3 gap-8">
        {stories.map((s, i) => (
          <motion.article key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white rounded-2xl border overflow-hidden shadow-sm">
            <img src={s.image} alt={s.name} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-lg">{s.name}</h3>
              <p className="text-sm text-primary-600 mb-3">{s.date}</p>
              <p className="text-slate-600 italic">&ldquo;{s.quote}&rdquo;</p>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
