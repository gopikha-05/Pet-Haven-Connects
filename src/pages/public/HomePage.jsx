import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiHeart, FiMapPin, FiShield, FiUsers } from 'react-icons/fi';

import Button from '@/components/common/Button';
import { petService } from '@/services/petService';

/** Hero landscape — dog & cat in the field (unique asset, not reused on pet cards) */
const HERO_IMAGE = {
  src: '/images/hero/hero-dog-cat-field.png',
  alt: 'A happy reddish retriever mix and a grey tabby cat together in a sunny green field.',
};

function FeaturedPetCard({ pet, index }) {
  const petImage = pet.images && pet.images.length > 0 ? pet.images[0] : '/images/placeholder-pet.png';
  const petName = pet.name || 'Unknown';
  const petBreed = pet.breed || 'Mixed Breed';
  const petBlurb = pet.description || 'Looking for a loving home';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <Link
        to={`/pets/${pet.id}`}
        className="block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
          <img
            src={petImage}
            alt={petName}
            className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-500 text-white shadow">
            Featured
          </span>
        </div>
        <div className="p-5 text-center">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{petName}</h3>
          <p className="text-sm font-medium text-primary-600 mt-1">{petBreed}</p>
          <p className="text-slate-500 text-sm mt-2 line-clamp-2">{petBlurb}</p>
          <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
            Meet {petName} <FiArrowRight className="text-base" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPets = async () => {
      try {
        const response = await petService.getAll({ status: 'available' });
        const pets = Array.isArray(response) ? response : (response?.data || []);
        // Get first 3 available pets
        setFeaturedPets(pets.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch featured pets:', error);
        setFeaturedPets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPets();
  }, []);

  return (
    <>
      {/* HERO SECTION */}
      <section className="gradient-hero text-white py-20 sm:py-28 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm mb-4">
              🐾 Find your forever friend
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Every pet deserves a loving home
            </h1>

            <p className="text-primary-100 text-lg mb-8 max-w-lg">
              PetHaven Connect brings adopters, shelters, and veterinarians together on one trusted platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="accent" size="lg" onClick={() => (window.location.href = '/browse')}>
                Browse Pets <FiArrowRight />
              </Button>

              <Link to="/register">
                <Button variant="secondary" size="lg" className="!text-primary-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden lg:block relative"
          >
            <div className="rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20">
              <img
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                className="w-full h-[min(520px,70vh)] object-cover object-[65%_center] sm:object-right"
              />
            </div>
            <p className="mt-3 text-xs text-primary-100/90 text-right pr-1">
              Every adoption story starts with a first hello
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { icon: FiHeart, title: 'Easy Adoption', desc: 'Browse, apply, and track your adoption journey.' },
            { icon: FiShield, title: 'Verified Partners', desc: 'Licensed shelters and certified veterinarians.' },
            { icon: FiUsers, title: 'Community Care', desc: 'Donations, scheduling, and health tracking.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl bg-white border shadow-sm"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <item.icon size={24} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED PETS — your photos + names */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Featured Pets</h2>
              <p className="text-slate-500 mt-1 flex items-center gap-1">
                <FiMapPin className="text-primary-500 shrink-0" />
                Ready for their forever homes
              </p>
            </div>
            <Link to="/browse" className="text-primary-600 font-medium flex items-center gap-1 hover:underline">
              View all <FiArrowRight />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              <p className="col-span-3 text-center text-slate-500">Loading featured pets...</p>
            ) : featuredPets.length > 0 ? (
              featuredPets.map((pet, index) => (
                <FeaturedPetCard key={pet.id} pet={pet} index={index} />
              ))
            ) : (
              <p className="col-span-3 text-center text-slate-500">No featured pets available at this time.</p>
            )}
          </div>
        </div>
      </section>

      {/* COMPANION HIGHLIGHT — same three friends, story-style */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-slate-800">Meet Our Lovely Companions 🐾</h2>
            <p className="text-slate-500 mt-3 text-lg">Featured pets ready for their forever homes</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p className="col-span-3 text-center text-slate-500">Loading featured pets...</p>
            ) : featuredPets.length > 0 ? (
              featuredPets.map((pet, i) => {
                const petImage = pet.images && pet.images.length > 0 ? pet.images[0] : '/images/placeholder-pet.png';
                const petName = pet.name || 'Unknown';
                const petBreed = pet.breed || 'Mixed Breed';
                const petBlurb = pet.description || 'Looking for a loving home';

                return (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-300 border border-slate-100"
                  >
                    <Link to={`/pets/${pet.id}`}>
                      <img src={petImage} alt={petName} className="w-full h-80 object-cover object-center" />
                      <div className="p-6 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Say hello to</p>
                        <h3 className="text-3xl font-bold text-slate-800 mt-1">{petName}</h3>
                        <p className="text-slate-600 font-medium mt-1">{petBreed}</p>
                        <p className="text-slate-500 mt-3 text-sm leading-relaxed">{petBlurb}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <p className="col-span-3 text-center text-slate-500">No featured pets available at this time.</p>
            )}
          </div>
        </div>
      </section>

      {/* DONATION SECTION */}
      <section className="py-16 px-4 gradient-hero text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Make a difference today</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Your donation helps shelters provide food, medical care, and safe homes for pets in need.
        </p>
        <Link to="/donate">
          <Button variant="accent" size="lg">
            Donate Now
          </Button>
        </Link>
      </section>
    </>
  );
}
