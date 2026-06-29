import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supplyService } from '@/services/supplyService';
import { ORDER_STATUSES } from '@/mock/supplies';
import { FiPackage, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';

export default function MyOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await supplyService.getOrders(user?.id);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await supplyService.cancelOrder(orderId, user?.id);
        await loadOrders();
        toast('Order cancelled successfully', 'success');
      } catch (error) {
        console.error('Failed to cancel order:', error);
        toast(error.message || 'Failed to cancel order', 'error');
      }
    }
  };

  const handleReorder = async (order) => {
    try {
      for (const product of order.orderedProducts) {
        await supplyService.addToCart(user?.id, product.productId, product.quantity);
      }
      toast('Items added to cart', 'success');
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast('Failed to add items to cart', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUSES.ORDER_PLACED:
        return <FiClock className="text-slate-500" />;
      case ORDER_STATUSES.ACCEPTED:
        return <FiCheckCircle className="text-blue-500" />;
      case ORDER_STATUSES.PACKED:
        return <FiPackage className="text-purple-500" />;
      case ORDER_STATUSES.OUT_FOR_DELIVERY:
        return <FiTruck className="text-orange-500" />;
      case ORDER_STATUSES.DELIVERED:
        return <FiCheckCircle className="text-green-500" />;
      case ORDER_STATUSES.CANCELLED:
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiClock className="text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUSES.ORDER_PLACED:
        return 'warning';
      case ORDER_STATUSES.ACCEPTED:
        return 'primary';
      case ORDER_STATUSES.PACKED:
        return 'info';
      case ORDER_STATUSES.OUT_FOR_DELIVERY:
        return 'warning';
      case ORDER_STATUSES.DELIVERED:
        return 'success';
      case ORDER_STATUSES.CANCELLED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusSteps = (status) => {
    const steps = [
      { key: ORDER_STATUSES.ORDER_PLACED, label: 'Order Placed' },
      { key: ORDER_STATUSES.ACCEPTED, label: 'Accepted' },
      { key: ORDER_STATUSES.PACKED, label: 'Packed' },
      { key: ORDER_STATUSES.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
      { key: ORDER_STATUSES.DELIVERED, label: 'Delivered' }
    ];

    const currentIndex = steps.findIndex(s => s.key === status);
    if (status === ORDER_STATUSES.CANCELLED) return [];

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <FiPackage className="mx-auto text-6xl text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
        <p className="text-slate-500 mb-6">Start shopping to see your orders here</p>
        <Button onClick={() => window.location.href = '/adopter/supplies'}>Browse Supplies</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.orderId} className="bg-white rounded-2xl border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
                <p className="text-sm text-slate-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(order.orderStatus)}
                <Badge variant={getStatusColor(order.orderStatus)}>{order.orderStatus}</Badge>
              </div>
            </div>

            {order.orderStatus !== ORDER_STATUSES.CANCELLED && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-600 mb-3">Order Progress</h4>
                <div className="flex items-center justify-between">
                  {getStatusSteps(order.orderStatus).map((step, index) => (
                    <div key={step.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {step.completed && <FiCheckCircle size={16} />}
                      </div>
                      <p className={`text-xs mt-2 ${step.current ? 'font-medium text-primary-600' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      {index < getStatusSteps(order.orderStatus).length - 1 && (
                        <div className={`w-full h-0.5 mt-2 ${step.completed ? 'bg-primary-500' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Ordered Items</h4>
                <div className="space-y-2">
                  {order.orderedProducts.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center text-sm">
                      <span>{item.productName} x {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary-700">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Delivery Address</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium">{order.adopterDetails.fullName}</p>
                  <p>{order.deliveryAddress.address}</p>
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                  {order.deliveryAddress.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
                  <p className="text-xs text-slate-500">Phone: {order.adopterDetails.phone}</p>
                </div>
                {order.deliveryAddress.deliveryInstructions && (
                  <div className="mt-3 p-2 bg-slate-50 rounded text-sm">
                    <p className="font-medium text-slate-600">Instructions:</p>
                    <p className="text-slate-600">{order.deliveryAddress.deliveryInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              {order.orderStatus === ORDER_STATUSES.ORDER_PLACED && (
                <Button 
                  size="sm" 
                  variant="danger"
                  onClick={() => handleCancelOrder(order.orderId)}
                >
                  Cancel Order
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleReorder(order)}
              >
                Reorder
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
