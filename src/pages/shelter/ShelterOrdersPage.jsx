import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supplyService } from '@/services/supplyService';
import { ORDER_STATUSES } from '@/mock/supplies';
import { FiPackage, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';

export default function ShelterOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await supplyService.getShelterOrders(user?.id);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await supplyService.updateOrderStatus(orderId, user?.id, newStatus);
      await loadOrders();
      toast(`Order status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast('Failed to update order status', 'error');
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

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = [
      ORDER_STATUSES.ORDER_PLACED,
      ORDER_STATUSES.ACCEPTED,
      ORDER_STATUSES.PACKED,
      ORDER_STATUSES.OUT_FOR_DELIVERY,
      ORDER_STATUSES.DELIVERED
    ];

    if (currentStatus === ORDER_STATUSES.CANCELLED) return [];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1) return [];

    return statusFlow.slice(currentIndex + 1);
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <FiPackage className="mx-auto text-6xl text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
        <p className="text-slate-500">Orders from adopters will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Supply Orders</h1>
      
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

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Adopter Details</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p className="font-medium">{order.adopterDetails.fullName}</p>
                  <p>Phone: {order.adopterDetails.phone}</p>
                  <p>Email: {order.adopterDetails.email}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2">Delivery Address</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>{order.deliveryAddress.address}</p>
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                  {order.deliveryAddress.landmark && <p>Landmark: {order.deliveryAddress.landmark}</p>}
                </div>
                {order.deliveryAddress.deliveryInstructions && (
                  <div className="mt-3 p-2 bg-slate-50 rounded text-sm">
                    <p className="font-medium text-slate-600">Instructions:</p>
                    <p className="text-slate-600">{order.deliveryAddress.deliveryInstructions}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-slate-600 mb-3">Ordered Items</h4>
              <div className="space-y-2">
                {order.orderedProducts.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <span>{item.productName} x {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span className="text-primary-700">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {order.orderStatus !== ORDER_STATUSES.CANCELLED && order.orderStatus !== ORDER_STATUSES.DELIVERED && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-slate-600 mb-3">Update Order Status</h4>
                <div className="flex gap-2 flex-wrap">
                  {getNextStatusOptions(order.orderStatus).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      onClick={() => handleUpdateStatus(order.orderId, status)}
                    >
                      Mark as {status}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
