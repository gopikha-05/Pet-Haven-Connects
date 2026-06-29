import { useState, useEffect } from 'react';
import { medicalRecordService } from '@/services/medicalRecordService';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/forms/Textarea';
import Input from '@/components/forms/Input';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function VetMedicalPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    petName: '',
    breed: '',
    owner: '',
    shelter: '',
    visitDate: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    vaccination: '',
    nextVisit: '',
    vetNotes: '',
    prescription: null,
    medicalReport: null
  });
  const { toast } = useToast();

  const loadMedicalRecords = async () => {
    setLoading(true);
    try {
      const response = await medicalRecordService.getAll();
      const apiRecords = Array.isArray(response) ? response : (response?.data || []);
      
      // Also load records from localStorage
      const localStorageRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      
      // Combine both sources
      const allRecords = [...localStorageRecords, ...apiRecords];
      setRecords(allRecords);
    } catch (error) {
      console.error('Failed to load medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const medicalRecordId = Date.now();
      
      // Save medical record to localStorage
      const medicalRecord = {
        id: medicalRecordId,
        ...formData,
        vetName: user?.name || 'Dr. Unknown',
        createdAt: new Date().toISOString()
      };
      const existingMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      localStorage.setItem('medicalRecords', JSON.stringify([...existingMedicalRecords, medicalRecord]));
      
      await medicalRecordService.addTreatment('p2', {
        ...formData,
        vetName: user?.name || 'Dr. Unknown'
      });
      
      // Add health record entry for adopter only if pet has an owner/adopter
      if (formData.owner) {
        const healthRecord = {
          id: medicalRecordId,
          petName: formData.petName,
          petType: formData.breed,
          purpose: 'Medical Record Update',
          symptoms: formData.symptoms,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
          medications: formData.medications,
          vaccination: formData.vaccination,
          vetName: user?.name || 'Dr. Unknown',
          vetNotes: formData.vetNotes,
          visitDate: formData.visitDate,
          nextVisit: formData.nextVisit,
          completedAt: new Date().toISOString(),
          status: 'completed'
        };
        const existingHealthRecords = JSON.parse(localStorage.getItem('healthRecords') || '[]');
        localStorage.setItem('healthRecords', JSON.stringify([...existingHealthRecords, healthRecord]));
      }
      
      toast('Medical record added successfully. Health report updated.', 'success');
      setShowAddForm(false);
      setFormData({
        petName: '',
        breed: '',
        owner: '',
        shelter: '',
        visitDate: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medications: '',
        vaccination: '',
        nextVisit: '',
        vetNotes: '',
        prescription: null,
        medicalReport: null
      });
      await loadMedicalRecords();
    } catch (error) {
      toast('Failed to add medical record', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading medical records...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Medical Records</h1>
      
      <section className="bg-white rounded-2xl border p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Add Medical Record</h2>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Record'}
          </Button>
        </div>
        
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-4">
            <h3 className="font-semibold text-sm mb-2">Add Medical Record</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Pet Name" 
                value={formData.petName} 
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                required
              />
              <Input 
                label="Breed" 
                value={formData.breed} 
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              />
              <Input 
                label="Owner/Adopter" 
                value={formData.owner} 
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
              <Input 
                label="Shelter" 
                value={formData.shelter} 
                onChange={(e) => setFormData({ ...formData, shelter: e.target.value })}
              />
            </div>

            <Input 
              label="Visit Date" 
              type="date" 
              value={formData.visitDate} 
              onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              required 
            />
            
            <Textarea 
              label="Symptoms" 
              value={formData.symptoms} 
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={2}
              required 
            />
            
            <Textarea 
              label="Diagnosis" 
              value={formData.diagnosis} 
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={2}
              required 
            />
            
            <Textarea 
              label="Treatment Given" 
              value={formData.treatment} 
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={2}
              required 
            />
            
            <Textarea 
              label="Medications Prescribed" 
              value={formData.medications} 
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              rows={2}
            />
            
            <Textarea 
              label="Vaccination Given" 
              value={formData.vaccination} 
              onChange={(e) => setFormData({ ...formData, vaccination: e.target.value })}
              rows={1}
            />
            
            <Input 
              label="Next Visit Recommendation" 
              type="date" 
              value={formData.nextVisit} 
              onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })}
            />
            
            <Textarea 
              label="Vet Notes" 
              value={formData.vetNotes} 
              onChange={(e) => setFormData({ ...formData, vetNotes: e.target.value })}
              rows={3}
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Prescription Upload</label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setFormData({ ...formData, prescription: e.target.files[0] })}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Medical Report Upload (Optional)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => setFormData({ ...formData, medicalReport: e.target.files[0] })}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            
            <Button type="submit" className="w-full">Save Medical Record</Button>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold mb-4">Medical Records History</h2>
        {records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{record.petName}</h3>
                    <p className="text-sm text-slate-500">{record.breed}</p>
                  </div>
                  <span className="text-xs text-slate-500">{record.visitDate}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Symptoms:</span> {record.symptoms}</p>
                  <p><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                  <p><span className="font-medium">Treatment:</span> {record.treatment}</p>
                  {record.vaccination && <p><span className="font-medium">Vaccination:</span> {record.vaccination}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No medical records found</p>
        )}
      </section>
    </div>
  );
}
