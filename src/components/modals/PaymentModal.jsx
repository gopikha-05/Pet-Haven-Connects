import { useState } from 'react';
import { FiShield, FiCheckCircle, FiLock, FiX, FiTruck, FiPackage } from 'react-icons/fi';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/utils/formatters';
import { createRazorpayOrder, verifyRazorpayPayment, initiateRazorpayPayment } from '@/services/razorpayService';
import { useAuth } from '@/context/AuthContext';

export default function PaymentModal({ application, deliveryDetails, onClose, onPaymentComplete }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [transactionRef, setTransactionRefState] = useState('');

  const fee = application?.adoptionFee || 5000;

  const handlePay = async () => {
    setProcessing(true);
    setFailure(false);
    setProgress(20);
    
    try {
      console.log('[PaymentModal] Starting payment process with fee:', fee);
      console.log('[PaymentModal] User details:', { name: user?.name, email: user?.email, phone: user?.phone });
      
      // 1. Create order on backend (receives keyId and order details)
      const order = await createRazorpayOrder(fee, 'adoption', application.id);
      console.log('[PaymentModal] Order created:', order);
      console.log('[PaymentModal] Order ID:', order.orderId);
      console.log('[PaymentModal] Order amount:', order.amount);
      setProgress(50);
      
      // 2. Launch Razorpay Checkout in Test Mode
      await initiateRazorpayPayment({
        amount: order.amount,
        currency: 'INR',
        name: 'PetHaven Connect',
        description: `Adoption fee for ${application.petName}`,
        orderId: order.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        onSuccess: async (response) => {
          console.log('[PaymentModal] Payment successful:', response);
          setProgress(80);
          try {
            // 3. Verify payment on backend securely
            const verifyRes = await verifyRazorpayPayment({
              transactionId: order.transactionId,
              razorpayOrderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            console.log('[PaymentModal] Payment verified:', verifyRes);

            if (verifyRes.success) {
              setProgress(100);
              setSuccess(true);
              setTransactionRefState(response.razorpay_payment_id);
              setTimeout(() => {
                onPaymentComplete();
              }, 1500);
            } else {
              setFailure(true);
              setFailureMessage(verifyRes.message || 'Payment verification failed.');
              setProcessing(false);
            }
          } catch (err) {
            console.error('[PaymentModal] Verification error:', err);
            setFailure(true);
            setFailureMessage(err.message || 'Payment verification failed.');
            setProcessing(false);
          }
        },
        onError: (err) => {
          console.error('[PaymentModal] Razorpay checkout failed:', err);
          setFailure(true);
          if (err.status === 'cancelled') {
            setFailureMessage('Payment cancelled.');
          } else if (err.status === 'expired') {
            setFailureMessage('Payment session expired.');
          } else {
            setFailureMessage(err.message || 'Payment failed. Please try again.');
          }
          setProcessing(false);
        }
      });
    } catch (err) {
      console.error('[PaymentModal] Order creation error:', err);
      toast(err.message || 'Failed to initiate payment. Pet might be unavailable.', 'error');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs transition-opacity duration-300">
      {/* Razorpay Styled Checkout Modal Container */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col md:flex-row min-h-[480px]">
        
        {/* Left Side: Order & Delivery Summary (Razorpay Details Banner) */}
        <div className="w-full md:w-5/12 bg-slate-900 text-white p-6 flex flex-col justify-between">
          <div>
            {/* Razorpay branding */}
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-blue-600 text-white p-1 rounded-lg">
                <FiShield className="w-5 h-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Razorpay</p>
                <p className="text-sm font-semibold text-white -mt-1">SECURE CHECKOUT</p>
              </div>
            </div>

            {/* Store Name & Purpose */}
            <div className="mb-6">
              <p className="text-xs text-slate-400">Merchant</p>
              <h3 className="text-base font-bold text-white tracking-wide">Pet Haven Connect</h3>
              <p className="text-xs text-slate-400 mt-1">Adoption fee for <span className="text-rose-400 font-semibold">{application?.petName}</span></p>
            </div>

            {/* Delivery Details Choice */}
            {deliveryDetails && (
              <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 mb-6">
                <div className="flex items-center gap-2 mb-1.5 text-xs text-blue-300 font-bold uppercase tracking-wider">
                  {deliveryDetails.option === 'door-delivery' ? (
                    <>
                      <FiTruck className="w-3.5 h-3.5" />
                      <span>Door Delivery Selected</span>
                    </>
                  ) : (
                    <>
                      <FiPackage className="w-3.5 h-3.5" />
                      <span>Take Away Selected</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  <span className="font-semibold text-white">Address:</span> {deliveryDetails.address}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-white">Contact:</span> {deliveryDetails.contactNumber}
                </p>
              </div>
            )}
          </div>

          {/* Amount info */}
          <div className="border-t border-slate-800 pt-4 mt-4">
            <p className="text-xs text-slate-400">Total Amount</p>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(fee)}</p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <FiLock className="w-3 h-3 text-emerald-400" /> 256-bit SSL secure payment
            </p>
          </div>
        </div>

        {/* Right Side: Payment Form & Checkout Tab View */}
        <div className="w-full md:w-7/12 p-6 flex flex-col justify-between relative bg-slate-50/50">
          
          {/* Close button */}
          <button 
            onClick={onClose} 
            disabled={processing}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-50 border-0 bg-transparent cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>

          {processing ? (
            /* Processing / Success Loading Overlay */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              {!success ? (
                <>
                  <div className="relative w-20 h-20 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="40" cy="40" r="34" 
                        className="text-slate-200" 
                        strokeWidth="5" 
                        stroke="currentColor" 
                        fill="transparent"
                      />
                      <circle 
                        cx="40" cy="40" r="34" 
                        className="text-blue-600 transition-all duration-300" 
                        strokeWidth="5" 
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-700">{progress}%</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">Connecting to Razorpay...</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Please do not close this window or refresh the page while we initialize your secure payment session.
                  </p>
                </>
              ) : (
                <div className="animate-bounce-in">
                  <FiCheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-emerald-600 mb-1">Payment Successful!</h4>
                  <p className="text-xs text-slate-500">
                    Your transaction reference: <span className="font-mono text-slate-700">{transactionRef}</span>
                  </p>
                </div>
              )}
            </div>
          ) : failure ? (
            /* Failure View */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="animate-bounce-in w-full max-w-xs">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-500 font-bold mb-4 text-3xl">
                  X
                </div>
                <h4 className="text-xl font-bold text-red-600 mb-1">Payment Failed</h4>
                <p className="text-sm text-slate-700 font-medium mb-6">
                  {failureMessage || 'Payment failed. Please try again.'}
                </p>
                <Button 
                  onClick={() => {
                    setFailure(false);
                    setProcessing(false);
                    setProgress(0);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold text-sm transition shadow-md border-0 cursor-pointer"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Secure Checkout Screen */
            <div className="flex-1 flex flex-col justify-between pt-4">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Secure Checkout</h4>
                <div className="bg-slate-100/50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Merchant</span>
                    <span className="font-semibold text-slate-800">Pet Haven Connect</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Adopter Name</span>
                    <span className="font-semibold text-slate-800">{user?.name || 'Applicant'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Purpose</span>
                    <span className="font-semibold text-slate-800">Adoption Booking Fee</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Email Prefill</span>
                    <span className="font-semibold text-slate-800">{user?.email || 'N/A'}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 px-1 leading-normal">
                  Clicking the button below will open the secure Razorpay Checkout popup overlay, allowing you to pay using card, UPI, net banking, or wallets in Test Mode.
                </p>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                <Button 
                  onClick={handlePay} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-0 cursor-pointer"
                >
                  <FiLock className="w-4 h-4 text-emerald-300" />
                  Proceed to Secure Payment
                </Button>
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 mt-1">
                  <span>Secured by Razorpay</span>
                  <span className="flex items-center gap-1 font-semibold text-blue-600">
                    <FiShield className="w-3.5 h-3.5 text-blue-500" /> Test Mode
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
