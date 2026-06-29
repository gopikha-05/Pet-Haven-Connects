import { useState } from 'react';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

export default function DeliverySelectionModal({ application, onClose, onDeliveryConfirm }) {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [scheduledPickupDate, setScheduledPickupDate] = useState('');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast('Please select a delivery option', 'error');
      return;
    }

    if (selectedOption === 'door-delivery' && !address) {
      toast('Please enter delivery address', 'error');
      return;
    }

    if (!contactNumber) {
      toast('Please enter contact number', 'error');
      return;
    }

    setProcessing(true);

    try {
      const deliveryMethod = selectedOption === 'take-away' ? 'take_away' : 'door_delivery';
      const payload = {
        deliveryMethod,
        contactNumber
      };

      if (deliveryMethod === 'take_away') {
        payload.scheduledPickupDate = scheduledPickupDate || null;
        payload.scheduledPickupTime = scheduledPickupTime || null;
      } else {
        payload.deliveryAddress = address;
        payload.scheduledDeliveryDate = scheduledDeliveryDate || null;
      }

      const response = await api.put(`/applications/${application.id}/delivery-method`, payload);
      
      const deliveryDetails = {
        option: selectedOption,
        address: selectedOption === 'door-delivery' ? address : 'Pickup from shelter',
        contactNumber,
        confirmedAt: new Date().toISOString(),
        scheduledPickupDate,
        scheduledPickupTime,
        scheduledDeliveryDate
      };

      onDeliveryConfirm(deliveryDetails);
      toast('Delivery option confirmed!', 'success');
      onClose();
    } catch (error) {
      console.error('Error setting delivery method:', error);
      toast(error.response?.data?.message || 'Failed to set delivery method', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Select Delivery Option</h2>
        
        <p className="text-sm text-slate-600 mb-4">
          Your application for <strong>{application?.petName}</strong> has been approved. Please select how you'd like to receive your pet before proceeding to payment.
        </p>

        <div className="space-y-3 mb-4">
          <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${selectedOption === 'take-away' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'}`}>
            <input
              type="radio"
              name="delivery"
              value="take-away"
              checked={selectedOption === 'take-away'}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <div>
              <p className="font-medium">Take Away (Pickup)</p>
              <p className="text-xs text-slate-500">Pick up your pet from Happy Paws Shelter</p>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${selectedOption === 'door-delivery' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300'}`}>
            <input
              type="radio"
              name="delivery"
              value="door-delivery"
              checked={selectedOption === 'door-delivery'}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-primary-600"
            />
            <div>
              <p className="font-medium">Door Delivery</p>
              <p className="text-xs text-slate-500">We'll deliver the pet to your address</p>
            </div>
          </label>
        </div>

        {selectedOption === 'door-delivery' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              placeholder="Enter your complete address..."
            />
          </div>
        )}

        {selectedOption === 'take-away' && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Pickup Date (Optional)</label>
              <input
                type="date"
                value={scheduledPickupDate}
                onChange={(e) => setScheduledPickupDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Pickup Time (Optional)</label>
              <input
                type="time"
                value={scheduledPickupTime}
                onChange={(e) => setScheduledPickupTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
            </div>
          </div>
        )}

        {selectedOption === 'door-delivery' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Delivery Date (Optional)</label>
            <input
              type="date"
              value={scheduledDeliveryDate}
              onChange={(e) => setScheduledDeliveryDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            placeholder="Enter your contact number..."
          />
        </div>

        <div className="flex gap-3">
          <Button disabled={processing} className="flex-1" onClick={handleSubmit}>
            {processing ? 'Confirming...' : 'Confirm Delivery'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
