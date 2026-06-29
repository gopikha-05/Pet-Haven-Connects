import Button from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';

const supplies = [
  { id: 1, name: 'Premium Dog Food 5kg', price: 1200, image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc307?w=200' },
  { id: 2, name: 'Cat Litter 10L', price: 450, image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200' },
  { id: 3, name: 'Grooming Kit', price: 899, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200' },
];

export default function SuppliesPage() {
  const { toast } = useToast();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order Supplies</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {supplies.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border overflow-hidden">
            <img src={s.image} alt={s.name} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h3 className="font-medium">{s.name}</h3>
              <p className="text-primary-700 font-semibold mt-1">{formatCurrency(s.price)}</p>
              <Button className="w-full mt-3" size="sm" onClick={() => toast('Added to cart (mock)', 'success')}>Add to Cart</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
