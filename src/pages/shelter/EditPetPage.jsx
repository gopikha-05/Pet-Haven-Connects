import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';
import Button from '@/components/common/Button';
import { petService } from '@/services/petService';
import { useToast } from '@/context/ToastContext';
import { speciesOptions, temperamentOptions } from '@/mock/pets';

export default function EditPetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [form, setForm] = useState({ name: '', species: 'dog', breed: '', age: 1, gender: 'male', healthStatus: 'good', description: '', adoptionFee: 3000, shelterName: 'Happy Paws Shelter', shelterId: 'sh1', images: [], temperament: ['friendly'], vaccinated: true, neutered: false, status: 'available' });

  useEffect(() => {
    const loadPet = async () => {
      try {
        const response = await petService.getById(id);
        const pet = response.data || response;
        setForm({
          name: pet.name || '',
          species: pet.species || 'dog',
          breed: pet.breed || '',
          age: pet.age || 1,
          gender: pet.gender || 'male',
          healthStatus: pet.healthStatus || 'good',
          description: pet.description || '',
          adoptionFee: pet.adoptionFee || 3000,
          shelterName: pet.shelterName || 'Happy Paws Shelter',
          shelterId: pet.shelterId || 'sh1',
          images: pet.images || [],
          temperament: pet.temperament || ['friendly'],
          vaccinated: pet.vaccinated !== undefined ? pet.vaccinated : true,
          neutered: pet.neutered !== undefined ? pet.neutered : false,
          status: pet.status || 'available'
        });
        if (pet.images && pet.images.length > 0) {
          setImagePreview(pet.images[0]);
        }
      } catch (error) {
        console.error('Failed to load pet:', error);
        toast('Failed to load pet details', 'error');
        navigate('/shelter/pets');
      } finally {
        setFetching(false);
      }
    };
    loadPet();
  }, [id, navigate, toast]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setImageError('Please upload valid image files (JPG, JPEG, PNG, or WEBP)');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setImageError('Image size must be less than 5MB each');
      return;
    }

    setImageError('');

    // Append new files
    setNewImageFiles(prev => [...prev, ...files]);

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((results) => {
      setForm((f) => ({ ...f, images: [...f.images, ...results] }));
      setImagePreview(results[0]);
    });
  };

  const handleRemoveImage = (index) => {
    const imgToRemove = form.images[index];
    const newImages = form.images.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, images: newImages }));

    // If the image to remove is a new preview (starts with data:), we must also remove the corresponding File from newImageFiles
    if (imgToRemove && imgToRemove.startsWith('data:')) {
      let newPreviewIndex = 0;
      for (let i = 0; i < index; i++) {
        if (form.images[i].startsWith('data:')) {
          newPreviewIndex++;
        }
      }
      setNewImageFiles(prev => prev.filter((_, i) => i !== newPreviewIndex));
    }

    if (newImages.length > 0) {
      setImagePreview(newImages[0]);
    } else {
      setImagePreview(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!imagePreview && form.images.length === 0) {
      setImageError('Please upload a pet image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('species', form.species);
      formData.append('breed', form.breed);
      formData.append('age', form.age);
      formData.append('gender', form.gender);
      formData.append('healthStatus', form.healthStatus);
      formData.append('adoptionFee', form.adoptionFee);
      formData.append('description', form.description);
      formData.append('vaccinated', form.vaccinated);
      formData.append('neutered', form.neutered);
      formData.append('shelterName', form.shelterName);
      formData.append('shelterId', form.shelterId);
      formData.append('status', form.status);

      // Append temperament array elements
      form.temperament.forEach(temp => {
        formData.append('temperament', temp);
      });

      // Filter and append existing images (URLs that are not base64 strings)
      const existingImages = form.images.filter(img => !img.startsWith('data:'));
      existingImages.forEach(img => {
        formData.append('existingImages', img);
      });

      // Append new binary files
      newImageFiles.forEach(file => {
        formData.append('images', file);
      });

      await petService.update(id, formData);
      toast('Pet updated successfully!', 'success');
      navigate('/shelter/pets');
    } catch (error) {
      console.error('Failed to update pet:', error);
      toast('Failed to update pet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const u = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (fetching) {
    return <div className="text-center py-8 text-slate-500">Loading pet details...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Pet</h1>
      <form onSubmit={submit} className="bg-white rounded-2xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Pet Image *</label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              multiple
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={img}
                      alt={`Pet preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">Supported formats: JPG, JPEG, PNG, WEBP (Max 5MB each, multiple images allowed)</p>
          </div>
        </div>
        <Input label="Name" value={form.name} onChange={(e) => u('name', e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Species" value={form.species} onChange={(e) => u('species', e.target.value)} options={speciesOptions} />
          <Input label="Breed" value={form.breed} onChange={(e) => u('breed', e.target.value)} required />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Age" type="number" value={form.age} onChange={(e) => u('age', +e.target.value)} />
          <Select label="Gender" value={form.gender} onChange={(e) => u('gender', e.target.value)} options={['male', 'female']} />
          <Select label="Health" value={form.healthStatus} onChange={(e) => u('healthStatus', e.target.value)} options={['excellent', 'good', 'fair', 'needs_care']} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Adoption Fee (₹)" type="number" value={form.adoptionFee} onChange={(e) => u('adoptionFee', +e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => u('status', e.target.value)} options={['available', 'adopted']} />
        </div>
        <Textarea label="Description" value={form.description} onChange={(e) => u('description', e.target.value)} rows={3} />
        <Button type="submit" loading={loading} className="w-full">Update Pet</Button>
      </form>
    </div>
  );
}
