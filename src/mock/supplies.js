export const mockSupplyProducts = [
  {
    id: 'sp1',
    productName: 'Premium Dog Food 5kg',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc307?w=200',
    price: 1200,
    description: 'High-quality dry dog food with essential nutrients for adult dogs.',
    stock: 50,
    shelterId: 'sh1',
    shelterName: 'Happy Paws Shelter'
  },
  {
    id: 'sp2',
    productName: 'Cat Litter 10L',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
    price: 450,
    description: 'Clumping cat litter with odor control technology.',
    stock: 30,
    shelterId: 'sh1',
    shelterName: 'Happy Paws Shelter'
  },
  {
    id: 'sp3',
    productName: 'Grooming Kit',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
    price: 899,
    description: 'Complete grooming kit including brush, comb, and nail clippers.',
    stock: 25,
    shelterId: 'sh2',
    shelterName: 'Safe Haven Rescue'
  },
  {
    id: 'sp4',
    productName: 'Dog Leash Premium',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200',
    price: 650,
    description: 'Durable and comfortable leash for daily walks.',
    stock: 40,
    shelterId: 'sh2',
    shelterName: 'Safe Haven Rescue'
  },
  {
    id: 'sp5',
    productName: 'Cat Scratching Post',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=200',
    price: 1800,
    description: 'Tall scratching post with multiple levels for cats.',
    stock: 15,
    shelterId: 'sh1',
    shelterName: 'Happy Paws Shelter'
  },
  {
    id: 'sp6',
    productName: 'Pet Bed Medium',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
    price: 2200,
    description: 'Comfortable orthopedic pet bed for medium-sized dogs.',
    stock: 20,
    shelterId: 'sh2',
    shelterName: 'Safe Haven Rescue'
  }
];

export const ORDER_STATUSES = {
  ORDER_PLACED: 'Order Placed',
  ACCEPTED: 'Accepted by Shelter',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

export const PAYMENT_STATUSES = {
  PENDING: 'Pending',
  PAID: 'Paid',
  COD: 'Cash on Delivery'
};
