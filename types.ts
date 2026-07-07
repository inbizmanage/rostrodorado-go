import { LucideIcon } from 'lucide-react';

export interface Treatment {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  isPopular?: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  image?: string;
}

export interface BeforeAfterImage {
  id: number;
  before: string;
  after: string;
  label: string;
}

export interface InstagramPost {
  id: number;
  image: string;
  likes: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  longDescription?: string;
  ingredients?: string[];
  usage?: string;
  benefits?: string[];
  costPrice?: number;
  basePrice?: number; // Price before Wompi fee
  stock?: number;
  media?: { type: 'image' | 'video'; url: string }[];
  brand?: string;
  weight?: number; // In Kg
  dimensions?: {
    width: number; // cm
    height: number; // cm
    length: number; // cm
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    department: string;
    postalCode?: string; // Added postal code
    notes?: string;
    firstName?: string; // Legacy/Optional
    lastName?: string;  // Legacy/Optional
    identification?: string;
    apartment?: string;
  };
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected' | 'declined' | 'error';
  paymentStatus?: 'approved' | 'declined' | 'voided' | 'error';
  createdAt: any; // Firebase Timestamp
  updatedAt?: any;
  paymentMethod: string;
  transactionId?: string;
  couponCode?: string;
  discountApplied?: number;
  trackingNumber?: string;
  shippingLabelUrl?: string;
  shippingProvider?: string;
  shippingOption?: ShippingOption;
  trackingStatus?: string;
}

export interface ShippingOption {
  idRate?: number;
  idProduct?: number;
  carrier?: string;
  service?: string;
  shippingCost?: number;
  deliveryCompany?: {
    companyName: string;
    deliveryEstimate: string;
    shippingCost: number;
    service: string;
  };
}


export interface Payment {
  id: string; // Wompi Transaction ID
  orderId: string; // Reference to Order
  userId: string;
  amountInCents: number;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  paymentMethod: string; // CARD, NEQUI, PSE, etc.
  reference: string;
  createdAt: any; // Firebase Timestamp
  customerEmail: string;
}

export interface Address {
  id: string;
  name: string; // e.g., "Casa", "Oficina"
  recipientName: string;
  phone: string;
  address: string;
  department: string;
  city: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  addresses?: Address[];
  role?: 'admin' | 'customer';
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null; // null for top-level categories
  level: number; // 0 for root, 1 for sub, 2 for sub-sub
  createdAt?: any;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  message: string;
  createdAt: any; // Firebase Timestamp
}

export interface Coupon {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expirationDate?: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  minPurchase?: number;
}


export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML or Markdown
  coverImage: string;
  author: string;
  published: boolean;
  createdAt: any; // Timestamp
  updatedAt?: any; // Timestamp
  views?: number;
}

export type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'single_choice' | 'multiple_choice' | 'image' | 'rating';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[]; // For single/multiple choice
  imageUrl?: string; // For 'image' type
  placeholder?: string;
  order: number;
}

export interface DynamicForm {
  id?: string;
  title: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface FormResponse {
  id?: string;
  formId: string;
  formTitle: string;
  answers: { [fieldId: string]: string | string[] };
  submittedAt: any;
  // Optional lead/user link
  userId?: string; 
  customerEmail?: string;
  customerName?: string;
}

