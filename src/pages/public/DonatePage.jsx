import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiCheckCircle, FiX, FiLock, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/common/Button';
import Input from '@/components/forms/Input';
import { dataService } from '@/services/dataService';
import { petService } from '@/services/petService';
import { initiateRazorpayPayment, createRazorpayOrder, verifyRazorpayPayment } from '@/services/razorpayService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, capitalize } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const amounts = [500, 1000, 2000, 5000];

const donationImpacts = [
  { amount: 500, impact: 'Food support for 1 week' },
  { amount: 1000, impact: 'Vaccination support' },
  { amount: 2000, impact: 'Medical care assistance' },
  { amount: 5000, impact: 'Full monthly care support' },
];

export default function DonatePage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const { toast } = useToast();

  const finalAmount = custom ? Number(custom) : amount;
  const selectedPet = pets.find((p) => p.id === selectedPetId);
  const petName = selectedPet ? selectedPet.name : '';
  const petGoal = selectedPet?.goal || 25000;
  const petRaised = selectedPet?.raised || 15000;
  const progressPercent = (petRaised / petGoal) * 100;

  useEffect(() => {
    petService.getAll({ status: 'available' })
      .then((res) => {
        const petsData = Array.isArray(res) ? res : (res?.data || []);
        setPets(petsData);
      })
      .catch((err) => {
        console.error('Failed to load pets for sponsorship:', err);
      });
  }, []);

  const handlePayment = async () => {
    // Check if user is authenticated
    if (!user) {
      toast('Please login to make a donation', 'error');
      return;
    }

    setPaymentProcessing(true);
    try {
      // Create Razorpay order (rupee amount converted to paise in service)
      const order = await createRazorpayOrder(finalAmount, 'donation', selectedPetId);
      
      // Get user info for prefill
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : {};
      
      // Initiate Razorpay payment in Test Mode
      initiateRazorpayPayment({
        amount: order.amount,
        currency: 'INR',
        name: 'PetHaven Connect',
        description: selectedPetId ? `Donation for Pet: ${petName}` : 'General Donation',
        orderId: order.orderId,
        prefill: {
          name: userData.name || '',
          email: userData.email || '',
          contact: userData.phone || '',
        },
        onSuccess: async (response) => {
          // Verify payment on backend securely
          const verification = await verifyRazorpayPayment({
            transactionId: order.transactionId,
            razorpayOrderId: order.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verification.success) {
            setTransactionId(response.razorpay_payment_id);
            
            const transaction = {
              id: Date.now(),
              description: selectedPetId ? `Donation for Pet: ${petName}` : `General Donation`,
              amount: finalAmount,
              date: new Date().toISOString(),
              status: 'completed',
              transactionId: response.razorpay_payment_id,
            };

            const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            localStorage.setItem('transactions', JSON.stringify([...existingTransactions, transaction]));

            const pointsEarned = Math.floor(finalAmount / 20);
            setRewardPoints(pointsEarned);

            setShowSuccessModal(true);
            
            toast(`Payment successful! Transaction ID: ${response.razorpay_payment_id}`, 'success');
            setCustom('');
            setSelectedPetId('');
          } else {
            toast('Payment verification failed', 'error');
          }
        },
        onError: (error) => {
          console.error('Payment failed:', error);
          toast(error.message || 'Payment failed or cancelled', 'error');
        },
      });
    } catch (error) {
      console.error('Donation process failed:', error);
      toast(error.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getImpactMessage = () => {
    const impact = donationImpacts.find(i => i.amount <= finalAmount);
    return impact ? impact.impact : 'Thank you for your support';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-rose-50 rounded-full text-rose-500 animate-pulse">
          <FiHeart className="w-8 h-8 fill-current" />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-center mb-2">Support Our Pets</h1>
      <p className="text-slate-500 text-center mb-8">Sponsor a specific friend or make a general contribution to the shelters</p>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
      >
        {/* Dynamic Pet Sponsorship Selector with Images */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Sponsorship / Purpose</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* General Support Option */}
            <button
              type="button"
              onClick={() => setSelectedPetId('')}
              className={cn(
                'p-3 rounded-xl border-2 transition flex flex-col items-center gap-2',
                !selectedPetId
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <FiHeart className="w-6 h-6 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-900">General Support</p>
                <p className="text-[10px] text-slate-500">All Shelter Animals</p>
              </div>
            </button>
            
            {/* Pet Options */}
            {pets.slice(0, 6).map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  'p-3 rounded-xl border-2 transition flex flex-col items-center gap-2',
                  selectedPetId === pet.id
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                  {pet.images && pet.images.length > 0 ? (
                    <img
                      src={pet.images[0]}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = '<span class="text-xl">🐾</span>';
                      }}
                    />
                  ) : (
                    <span className="text-xl">🐾</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-900 truncate w-full">{pet.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{pet.species}</p>
                </div>
              </button>
            ))}
          </div>
          {pets.length > 6 && (
            <p className="text-xs text-slate-500 mt-2">Showing first 6 pets of {pets.length}</p>
          )}
        </div>

        {/* Pet Sponsorship Progress */}
        {selectedPetId && selectedPet && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">{petName}'s Care Goal</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(petRaised)} / {formatCurrency(petGoal)}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{Math.round(progressPercent)}% of goal reached</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-3">Select amount</p>
          <div className="grid grid-cols-4 gap-2">
            {amounts.map((a) => (
              <button 
                key={a} 
                type="button" 
                onClick={() => { setAmount(a); setCustom(''); }} 
                className={cn(
                  'py-3 rounded-xl border text-sm font-medium transition', 
                  amount === a && !custom 
                    ? 'border-slate-900 bg-slate-900 text-white' 
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                {formatCurrency(a)}
              </button>
            ))}
          </div>
          <Input 
            label="Custom amount (₹)" 
            type="number" 
            className="mt-3" 
            value={custom} 
            onChange={(e) => setCustom(e.target.value)} 
            placeholder="Or enter any amount..."
          />
        </div>

        {/* Donation Impact */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-medium text-emerald-900">Your Impact</p>
          <p className="text-sm text-emerald-700 mt-1">{getImpactMessage()}</p>
        </div>

        {/* Donation Summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Donation Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Purpose</span>
            <span className="text-slate-900 font-medium">{selectedPetId ? `Sponsor ${petName}` : 'General Support'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Amount</span>
            <span className="text-slate-900 font-medium">{formatCurrency(finalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Platform Fee</span>
            <span className="text-slate-900 font-medium">₹0</span>
          </div>
          <div className="border-t border-slate-200 pt-3 flex justify-between">
            <span className="text-sm font-semibold text-slate-900">Total</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(finalAmount)}</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg" 
          loading={paymentProcessing} 
          onClick={handlePayment}
        >
          Proceed to Secure Payment {formatCurrency(finalAmount || 0)}
        </Button>

        {/* Payment Trust Section */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <FiLock className="w-3 h-3" />
            <span>Secure payments powered by Razorpay</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
            <span>GPay</span>
            <span>•</span>
            <span>PhonePe</span>
            <span>•</span>
            <span>Paytm</span>
            <span>•</span>
            <span>UPI</span>
            <span>•</span>
            <span>Cards</span>
          </div>
        </div>
      </motion.div>

      {/* Payment Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Payment Successful</h2>
                <p className="text-slate-600 mb-6">Thank you for supporting {selectedPetId ? petName : 'our pets'}</p>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-left mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Transaction ID</span>
                    <span className="text-slate-900 font-mono text-xs">{transactionId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Donation Amount</span>
                    <span className="text-slate-900 font-medium">{formatCurrency(finalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Receipt</span>
                    <span className="text-emerald-600 font-medium">Sent successfully</span>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-amber-900 mb-1">+{rewardPoints} Reward Points earned</p>
                  <p className="text-xs text-amber-700">Badge unlocked: Kind Heart</p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
