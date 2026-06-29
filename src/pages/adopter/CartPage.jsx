import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supplyService } from '@/services/supplyService';
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';

export default function CartPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    setLoading(true);
    try {
      const response = await supplyService.getCart(user?.id);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadCart();
    }
  }, [user?.id]);

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await supplyService.updateCartItemQuantity(user?.id, productId, newQuantity);
      await loadCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast('Failed to update quantity', 'error');
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await supplyService.removeFromCart(user?.id, productId);
      await loadCart();
      toast('Item removed from cart', 'success');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast('Failed to remove item', 'error');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await supplyService.clearCart(user?.id);
        await loadCart();
        toast('Cart cleared', 'success');
      } catch (error) {
        console.error('Failed to clear cart:', error);
        toast('Failed to clear cart', 'error');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading cart...</div>;
  }

  if (!cart || cart.products.length === 0) {
    return (
      <div className="text-center py-16">
        <FiShoppingBag className="mx-auto text-6xl text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-6">Add some supplies to get started</p>
        <Link to="/adopter/supplies">
          <Button>Browse Supplies</Button>
        </Link>
      </div>
    );
  }

  const deliveryCharge = 50;
  const subtotal = cart.totalAmount;
  const totalAmount = subtotal + deliveryCharge;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.products.map((item) => (
            <div key={item.productId} className="bg-white rounded-2xl border p-4 flex gap-4">
              <img src={item.image} alt={item.productName} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="font-medium">{item.productName}</h3>
                <p className="text-sm text-slate-500">by {item.shelterName}</p>
                <p className="text-primary-700 font-semibold mt-1">{formatCurrency(item.price)}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:bg-slate-200 rounded transition"
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button 
                      type="button"
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      className="p-2 hover:bg-slate-200 rounded transition"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
          
          <button 
            type="button"
            onClick={handleClearCart}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>
        
        <div className="bg-white rounded-2xl border p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Delivery Charge</span>
              <span>{formatCurrency(deliveryCharge)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary-700">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          
          <Link to="/adopter/checkout">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
