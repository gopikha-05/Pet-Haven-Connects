import { getToken } from '@/utils/jwt';

/**
 * Fetch Razorpay Key ID from the backend securely
 * @returns {Promise<string>} Public Key ID
 */
export const fetchRazorpayKeyId = async () => {
  try {
    const token = getToken();
    const response = await fetch('http://localhost:5000/api/payments/key', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    });
    const data = await response.json();
    console.log('[Razorpay] Fetched key from backend:', data);
    const keyId = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
    console.log('[Razorpay] Using key ID:', keyId);
    return keyId;
  } catch (error) {
    console.warn('[Razorpay] Failed to fetch Key ID from backend, using VITE env fallback:', error);
    const fallbackKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    console.log('[Razorpay] Using fallback key ID:', fallbackKey);
    return fallbackKey;
  }
};

/**
 * Initialize Razorpay payment in browser by dynamically loading Checkout script
 * @param {Object} options - Payment options
 */
export const initiateRazorpayPayment = async (options) => {
  const {
    amount,
    currency = 'INR',
    name = 'PetHaven Connect',
    description = 'Payment',
    orderId = null,
    prefill = {},
    onSuccess,
    onError,
  } = options;

  console.log('[Razorpay] Initiating payment with options:', { amount, currency, name, description, orderId, prefill });

  try {
    // 1. Fetch public Key ID securely from backend
    const key = await fetchRazorpayKeyId();
    console.log('[Razorpay] Fetched key ID:', key);

    const razorpayOptions = {
      key,
      amount,
      currency,
      name,
      description,
      order_id: orderId,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      theme: {
        color: '#2563EB', // Brand primary blue color
      },
      handler: function (response) {
        console.log('[Razorpay] Payment successful:', response);
        if (onSuccess) {
          onSuccess(response);
        }
      },
      modal: {
        ondismiss: function () {
          console.log('[Razorpay] Payment modal dismissed');
          if (onError) {
            onError({ message: 'Payment modal closed', status: 'cancelled' });
          }
        },
      },
    };

    console.log('[Razorpay] Razorpay checkout options:', razorpayOptions);
    
    // Validate required fields before opening checkout
    if (!razorpayOptions.key) {
      console.error('[Razorpay] Missing key ID');
      if (onError) onError({ message: 'Missing Razorpay key ID' });
      return;
    }
    if (!razorpayOptions.order_id) {
      console.error('[Razorpay] Missing order ID');
      if (onError) onError({ message: 'Missing Razorpay order ID' });
      return;
    }
    if (!razorpayOptions.amount || razorpayOptions.amount <= 0) {
      console.error('[Razorpay] Invalid amount:', razorpayOptions.amount);
      if (onError) onError({ message: 'Invalid payment amount' });
      return;
    }

    // 2. Dynamically load script if it does not exist
    
    // Validate required fields before opening checkout
    if (!razorpayOptions.key) {
      console.error('[Razorpay] Missing key ID');
      if (onError) onError({ message: 'Missing Razorpay key ID' });
      return;
    }
    if (!razorpayOptions.order_id) {
      console.error('[Razorpay] Missing order ID');
      if (onError) onError({ message: 'Missing Razorpay order ID' });
      return;
    }
    if (!razorpayOptions.amount || razorpayOptions.amount <= 0) {
      console.error('[Razorpay] Invalid amount:', razorpayOptions.amount);
      if (onError) onError({ message: 'Invalid payment amount' });
      return;
    }

    // 2. Dynamically load script if it does not exist
    
    // Validate required fields before opening checkout
    if (!razorpayOptions.key) {
      console.error('[Razorpay] Missing key ID');
      if (onError) onError({ message: 'Missing Razorpay key ID' });
      return;
    }
    if (!razorpayOptions.order_id) {
      console.error('[Razorpay] Missing order ID');
      if (onError) onError({ message: 'Missing Razorpay order ID' });
      return;
    }
    if (!razorpayOptions.amount || razorpayOptions.amount <= 0) {
      console.error('[Razorpay] Invalid amount:', razorpayOptions.amount);
      if (onError) onError({ message: 'Invalid payment amount' });
      return;
    }

    // 2. Dynamically load script if it does not exist
    
    // Validate required fields before opening checkout
    if (!razorpayOptions.key) {
      console.error('[Razorpay] Missing key ID');
      if (onError) onError({ message: 'Missing Razorpay key ID' });
      return;
    }
    if (!razorpayOptions.order_id) {
      console.error('[Razorpay] Missing order ID');
      if (onError) onError({ message: 'Missing Razorpay order ID' });
      return;
    }
    if (!razorpayOptions.amount || razorpayOptions.amount <= 0) {
      console.error('[Razorpay] Invalid amount:', razorpayOptions.amount);
      if (onError) onError({ message: 'Invalid payment amount' });
      return;
    }

    // 2. Dynamically load script if it does not exist
    
    // Validate required fields before opening checkout
    if (!razorpayOptions.key) {
      console.error('[Razorpay] Missing key ID');
      if (onError) onError({ message: 'Missing Razorpay key ID' });
      return;
    }
    if (!razorpayOptions.order_id) {
      console.error('[Razorpay] Missing order ID');
      if (onError) onError({ message: 'Missing Razorpay order ID' });
      return;
    }
    if (!razorpayOptions.amount || razorpayOptions.amount <= 0) {
      console.error('[Razorpay] Invalid amount:', razorpayOptions.amount);
      if (onError) onError({ message: 'Invalid payment amount' });
      return;
    }

    // 2. Dynamically load script if it does not exist
    if (!window.Razorpay) {
      console.log('[Razorpay] Loading Razorpay checkout script...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('[Razorpay] Script loaded, opening checkout');
        const rzp = new window.Razorpay(razorpayOptions);
        rzp.open();
      };
      script.onerror = () => {
        console.error('[Razorpay] Failed to load checkout script');
        if (onError) onError({ message: 'Failed to load Razorpay Checkout SDK' });
      };
      document.body.appendChild(script);
    } else {
      console.log('[Razorpay] Script already loaded, opening checkout');
      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    }
  } catch (err) {
    console.error('[Razorpay] SDK initialization failed:', err);
    if (onError) onError(err);
  }
};

/**
 * Create Razorpay order on backend
 * @param {number} amount - Amount in INR
 * @param {string} type - Payment type (donation, adoption)
 * @param {string} referenceId - Reference ID (pet ID or application ID)
 * @returns {Promise<Object>} Order details
 */
export const createRazorpayOrder = async (amount, type, referenceId) => {
  const token = getToken();
  
  console.log('[Razorpay] Creating order with params:', { amount, type, referenceId });
  
  const response = await fetch('http://localhost:5000/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to paise securely (prevent floating point issues)
      type,
      referenceId,
    }),
  });

  const data = await response.json();
  console.log('[Razorpay] Order creation response:', data);
  
  if (response.ok && data.success) {
    return data;
  } else {
    throw new Error(data.message || 'Failed to initiate order.');
  }
};

/**
 * Verify Razorpay payment on backend
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification result
 */
export const verifyRazorpayPayment = async (paymentData) => {
  const token = getToken();
  
  const response = await fetch('http://localhost:5000/api/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  if (response.ok && data.success) {
    return data;
  } else {
    throw new Error(data.message || 'Payment verification failed');
  }
};
