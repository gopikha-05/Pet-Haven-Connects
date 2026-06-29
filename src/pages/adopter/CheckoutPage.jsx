import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supplyService } from '@/services/supplyService';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    deliveryInstructions: ''
  });

  const [errors, setErrors] = useState({});

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await supplyService.getCart(user?.id);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast('Failed to load cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadCart();
      setFormData(prev => ({
        ...prev,
        fullName: user?.name || '',
        email: user?.email || ''
      }));
    }
  }, [user?.id]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setPlacingOrder(true);
    try {
      const orderData = {
        adopterId: user?.id,
        shelterId: cart?.products?.[0]?.shelterId || 'sh1',
        orderedProducts: cart.products,
        adopterDetails: {
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email
        },
        deliveryAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark,
          deliveryInstructions: formData.deliveryInstructions
        },
        totalAmount: cart.totalAmount + 50
      };

      const response = await supplyService.placeOrder(orderData);
      
      toast('Order placed successfully. Shelter has been notified.', 'success');
      navigate('/adopter/orders');
    } catch (error) {
      console.error('Failed to place order:', error);
      toast('Failed to place order', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>;
  }

  if (!cart || cart.products.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate('/adopter/supplies')}>Browse Supplies</Button>
      </div>
    );
  }

  const deliveryCharge = 50;
  const subtotal = cart.totalAmount;
  const totalAmount = subtotal + deliveryCharge;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                error={errors.fullName}
                placeholder="Enter your full name"
              />
              
              <Input
                label="Phone Number *"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                placeholder="Enter phone number"
              />
              
              <Input
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="Enter email address"
                className="sm:col-span-2"
              />
              
              <Input
                label="Full Address *"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                error={errors.address}
                placeholder="Enter full address"
                className="sm:col-span-2"
              />
              
              <Input
                label="City *"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                error={errors.city}
                placeholder="Enter city"
              />
              
              <Input
                label="State *"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                error={errors.state}
                placeholder="Enter state"
              />
              
              <Input
                label="Pincode *"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                error={errors.pincode}
                placeholder="Enter pincode"
              />
              
              <Input
                label="Landmark (Optional)"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                placeholder="Near landmark"
              />
            </div>
            
            <Textarea
              label="Delivery Instructions (Optional)"
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleInputChange}
              placeholder="Any special instructions for delivery"
              rows={3}
              className="mt-4"
            />
          </div>
          
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              {cart.products.map((item) => (
                <div key={item.productId} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Delivery Charge</span>
              <span>{formatCurrency(deliveryCharge)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-primary-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium mb-1">Payment Method</p>
            <p className="text-sm text-slate-600">Cash on Delivery</p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder ? 'Placing Order...' : 'Place Order'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full mt-3"
            onClick={() => navigate('/adopter/cart')}
          >
            Back to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
