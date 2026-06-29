import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import { petService } from '@/services/petService';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Pagination from '@/components/common/Pagination';
import { capitalize } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { usePagination } from '@/hooks/usePagination';

import { useAuth } from '@/context/AuthContext';

const PER_PAGE = 10;

export default function ManagePetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { paginated, page, totalPages, goToPage } = usePagination(pets, PER_PAGE);

  const loadPets = async () => {
    setLoading(true);
    try {
      const response = await petService.getAll({ shelter: user?.id });
      setPets(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      console.error('Failed to load pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await petService.delete(id);
        toast('Pet removed', 'success');
        loadPets();
      } catch (error) {
        console.error('Failed to delete pet:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Pets</h1>
        <Link to="/shelter/add-pet"><Button icon={FiPlus}>Add Pet</Button></Link>
      </div>
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading pets...</div>
      ) : pets.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center">
          <p className="text-slate-500">No pets found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="p-3 text-left">Name</th><th>Species</th><th>Status</th><th>Health</th><th>Actions</th></tr></thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="capitalize">{p.species}</td>
                  <td><Badge>{p.status}</Badge></td>
                  <td>{capitalize(p.healthStatus)}</td>
                  <td className="p-3 flex gap-2">
                    {p.status === 'available' && (
                      <Link to={`/shelter/edit-pet/${p.id}`} className="p-1.5 hover:bg-slate-100 rounded"><FiEdit2 size={16} /></Link>
                    )}
                    <button type="button" onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><FiTrash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pets.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
      )}
    </div>
  );
}
