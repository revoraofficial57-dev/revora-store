export type ClothingType =
  | 'Regular T-shirt'
  | 'Oversized T-shirt'
  | 'Full-sleeve shirt'
  | 'Tank top'
  | 'Hoodie'
  | 'Sweatshirt'
  | 'Sweater'
  | 'Jacket'
  | 'Winter shirt'
  | 'Kids clothing'
  | string;

export type PaymentMethodType = 'COD' | 'ONLINE' | 'BANK_TRANSFER';

export type PaymentVerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected';

export type PaymentStatus =
  | 'Unpaid'
  | 'Advance Required'
  | 'Advance Pending Verification'
  | 'Partially Paid'
  | 'Fully Paid'
  | 'Payment Failed'
  | 'Payment Proof Rejected'
  | 'Refund Pending'
  | 'Refunded';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Refunded';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride?: number;
  available: boolean;
  image?: string;
}

export interface DesignClothingTypeConfig {
  clothingType: string;
  price: number;
  salePrice?: number;
  description?: string;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  name: string;
  designId: string;
  designName: string;
  clothingType: string;
  category: string;
  description: string;
  images: string[]; // Minimum 1, Maximum 4 images per product/design
  price: number;
  salePrice?: number;
  discountPercentage?: number;
  sku: string;
  tags: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  status: 'active' | 'draft' | 'archived';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isWinterCollection: boolean;
  allowedPaymentMethods: PaymentMethodType[];
  weightKg?: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id: string;
  name: string;
  code: string;
  description: string;
  artworkImage: string;
  tags: string[];
  productIds: string[]; // Linked products
  availableTypes: DesignClothingTypeConfig[]; // Clothing types selected with separate pricing
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isFeatured: boolean;
  itemCount: number;
  order: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  designName: string;
  clothingType: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
  allowedPaymentMethods: PaymentMethodType[];
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  area?: string;
  isManualCity?: boolean;
  province: string;
  postalCode?: string;
  notes?: string;
}

export interface PaymentProof {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: PaymentVerificationStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  transactionReference?: string;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  productName: string;
  designName: string;
  clothingType: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  deliveryFee: number;
  total: number;
  // Partial payment fields
  isPartialPayment: boolean;
  advancePercentage: number;
  advanceAmount: number;
  amountReceived: number;
  remainingBalance: number;
  remainingBalanceDueWhen?: string;
  selectedBankAccountId?: string;
  selectedBankAccountName?: string;
  currency: string;
  paymentMethod: PaymentMethodType;
  paymentProof?: PaymentProof;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
  // Gmail email notification tracking
  emailSent?: boolean;
  emailSentAt?: string;
  emailError?: string;
  gmailMessageId?: string;
}

export interface CustomerAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  savedAddresses: ShippingAddress[];
  wishlistProductIds: string[];
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableCategory?: string;
  applicableProductId?: string;
  usageLimit?: number;
  usedCount: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}

export interface DeliveryRule {
  id: string;
  city: string; // "Default" or specific city e.g. "Lahore", "Karachi"
  area?: string; // Optional specific area e.g. "DHA Phase 5", "Gulberg"
  province?: string;
  charge: number;
  codExtraCharge?: number;
  minOrderValue?: number;
  estimatedDays: string;
  isActive: boolean;
  isAvailable?: boolean; // Temporary delivery restriction / unavailable area
  specialNotes?: string;
  order?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface BankInformation {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchName: string;
  instructions: string;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountTitle: string; // Account holder name
  accountNumber: string;
  iban?: string;
  branch?: string; // Branch or other relevant details
  instructions: string;
  isEnabled: boolean;
}

export interface PartialPaymentConfig {
  enabled: boolean;
  advancePercentage: number; // e.g. 50%
  minAdvanceAmount: number; // PKR
  maxAdvanceAmount?: number; // PKR
  allowCodPartialPayment: boolean; // allow COD with upfront advance
  remainingBalanceDueWhen?: string; // e.g. "Payable at delivery"
  instructions: string;
  allowedMethods: PaymentMethodType[];
}

export interface StoreSettings {
  storeName: string;
  brandTagline: string;
  currency: string;
  currencySymbol: string;
  supportEmail: string; // revoraofficial57@gmail.com
  supportPhone: string;
  whatsappNumber: string; // +92 329 4862442
  address: string;
  freeShippingThreshold: number;
  defaultDeliveryFee: number;
  bankInfo: BankInformation;
  bankAccounts?: BankAccountItem[]; // Up to three separate bank transfer accounts
  activePaymentMethods: PaymentMethodType[]; // up to 3 active methods
  partialPayment: PartialPaymentConfig;
  socialLinks: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    whatsapp: string;
  };
  homepageSections: {
    hero: boolean;
    featuredCollection: boolean;
    categories: boolean;
    newArrivals: boolean;
    winterCollection: boolean;
    whyRevora: boolean;
    reviews: boolean;
    newsletter: boolean;
  };
  heroContent: {
    title: string;
    subtitle: string;
    tagline: string;
    primaryButtonText: string;
    secondaryButtonText: string;
    heroImage: string;
  };
  securityAndPrivacy?: {
    guestOrderDataRetentionDays?: number;
    enableAutomatedRetention?: boolean;
  };
  gmailSettings?: {
    autoSendOrderEmail: boolean;
    senderEmail: string;
    isConnected: boolean;
    userEmail?: string;
    lastConnectedAt?: string;
  };
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'payment_proof' | 'stock_alert' | 'review' | 'complaint';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  referenceId?: string;
}

export interface ComplaintReply {
  id: string;
  sender: 'Admin' | 'Customer';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface CustomerComplaint {
  id: string;
  ticketNumber: string; // e.g. REV-CMP-1042
  fullName: string;
  orderId?: string;
  phone: string;
  email: string;
  category: 'Order Delay' | 'Damaged Product' | 'Wrong Item/Size' | 'Payment Issue' | 'Return/Exchange' | 'General Inquiry';
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'New' | 'In Review' | 'Awaiting Customer' | 'Resolved' | 'Closed';
  replies: ComplaintReply[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePolicy {
  id: string;
  title: string;
  category:
    | 'Order Rules'
    | 'Payment & Advance Rules'
    | 'Cash on Delivery Rules'
    | 'Delivery & Shipping'
    | 'Cancellation Policy'
    | 'Refund Policy'
    | 'Replacement & Exchange'
    | 'Damaged/Defective Claims'
    | 'Size & Color Selection'
    | 'Customer Support Rules'
    | 'General Policies';
  content: string;
  isPublished: boolean;
  order: number;
  updatedAt: string;
}
