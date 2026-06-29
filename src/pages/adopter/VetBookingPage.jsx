import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { appointmentService } from '@/services/appointmentService';
import { dataService } from '@/services/dataService';

export default function VetBookingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialVetId = searchParams.get('vetId') || '';
  const [selectedVet, setSelectedVet] = useState(null);
  const [vets, setVets] = useState([]);
  const [form, setForm] = useState({
    petName: '',
    petType: '',
    breed: '',
    age: '',
    purpose: '',
    date: '',
    time: '',
    symptoms: '',
    contactPreference: 'phone'
  });

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const data = await dataService.getVeterinarians();
        const activeVets = (Array.isArray(data) ? data : (data?.data || []))
          .filter(v => v.isApproved !== false) // include approved or default
          .map(v => ({
            id: v._id || v.id,
            name: v.name,
            specialization: v.specialization || 'General Veterinarian',
            experience: v.experience || '5+ years',
            clinic: v.clinic || v.location || 'PetHaven Partner Clinic',
            availability: v.availability || 'Mon-Sat 9AM-5PM'
          }));
        
        let finalVets = activeVets;
        if (activeVets.length === 0) {
          finalVets = [
            { id: 'u3', name: 'Dr. Rajesh Kumar', specialization: 'General Veterinarian', experience: '10 years', clinic: 'City Pet Clinic', availability: 'Mon-Fri 9AM-6PM' }
          ];
        }
        
        setVets(finalVets);

        // Pre-select vet if vetId is in searchParams
        if (initialVetId) {
          const preselected = finalVets.find(v => v.id === initialVetId);
          if (preselected) {
            setSelectedVet(preselected);
            setForm(f => ({ ...f, vetId: preselected.id, vetName: preselected.name }));
          }
        }
      } catch (err) {
        console.error('Failed to load vets:', err);
        const fallback = [
          { id: 'u3', name: 'Dr. Rajesh Kumar', specialization: 'General Veterinarian', experience: '10 years', clinic: 'City Pet Clinic', availability: 'Mon-Fri 9AM-6PM' }
        ];
        setVets(fallback);
        if (initialVetId) {
          const preselected = fallback.find(v => v.id === initialVetId);
          if (preselected) {
            setSelectedVet(preselected);
            setForm(f => ({ ...f, vetId: preselected.id, vetName: preselected.name }));
          }
        }
      }
    };
    fetchVets();
  }, [initialVetId]);

  const petTypes = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Other'];
  const purposes = ['General Checkup', 'Vaccination', 'Emergency', 'Surgery Consultation', 'Follow-up', 'Other'];
  const contactPreferences = ['Phone', 'Email', 'Chat'];

  const timeOptions = [
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' }
  ];

  const handleSelectVet = (vet) => {
    setSelectedVet(vet);
    setForm({ ...form, vetId: vet.id, vetName: vet.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast('Please login to book an appointment', 'error');
      return;
    }

    const adopterName = user.name || user.username || 'Adopter';
    console.log('[VetBookingPage] User object:', user);
    console.log('[VetBookingPage] Adopter name:', adopterName);
    
    const appointment = {
      petId: 'pet1',
      petName: form.petName,
      petType: form.petType,
      breed: form.breed,
      age: form.age,
      purpose: form.purpose,
      vetId: selectedVet.id,
      vetName: selectedVet.name,
      date: form.date,
      time: form.time,
      symptoms: form.symptoms,
      contactPreference: form.contactPreference,
      type: form.purpose.toLowerCase().replace(' ', '-'),
      notes: form.symptoms,
      adopterId: user.id,
      adopterName: adopterName,
      status: 'pending'
    };

    console.log('[VetBookingPage] Saving appointment to backend:', appointment);

    try {
      await appointmentService.create(appointment);
      toast('Appointment booked successfully!', 'success');
      setForm({
        petName: '',
        petType: '',
        breed: '',
        age: '',
        purpose: '',
        date: '',
        time: '',
        symptoms: '',
        contactPreference: 'phone'
      });
      setSelectedVet(null);
    } catch (error) {
      console.error('[VetBookingPage] Error booking appointment:', error);
      toast(error.response?.data?.message || 'Failed to book appointment', 'error');
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Book Vet Appointment</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-6">
        <h2 className="text-lg font-semibold">Appointment Details</h2>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Veterinarian ({vets.length} vets available)</label>
          <select
            value={selectedVet?.id || ''}
            onChange={(e) => {
              const vet = vets.find(v => v.id === e.target.value);
              if (vet) handleSelectVet(vet);
            }}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          >
            <option value="">Select a veterinarian</option>
            {vets.map(vet => (
              <option key={vet.id} value={vet.id}>{vet.name} - {vet.specialization}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pet Name</label>
              <input
                type="text"
                value={form.petName}
                onChange={(e) => setForm({ ...form, petName: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pet Type</label>
              <select
                value={form.petType}
                onChange={(e) => setForm({ ...form, petType: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              >
                <option value="">Select pet type</option>
                {petTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Breed</label>
              <input
                type="text"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
              <input
                type="text"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="e.g., 2 years"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Purpose</label>
            <select
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            >
              <option value="">Select purpose</option>
              {purposes.map(purpose => <option key={purpose} value={purpose}>{purpose}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Appointment Time</label>
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              >
                <option value="">Select time</option>
                {timeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Symptoms / Notes</label>
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              placeholder="Describe your pet's issue or symptoms..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Preference</label>
            <select
              value={form.contactPreference}
              onChange={(e) => setForm({ ...form, contactPreference: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            >
              {contactPreferences.map(pref => <option key={pref} value={pref.toLowerCase()}>{pref}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20 px-4 py-2 text-sm"
          >
            Book Appointment
          </button>
        </form>
    </div>
  );
}
