import {
  Product,
  Design,
  Category,
  Order,
  OrderStatus,
  CustomerAccount,
  Coupon,
  DeliveryRule,
  ProductReview,
  StoreSettings,
  AdminNotification,
  PaymentMethodType,
  PaymentProof,
  PaymentStatus,
  CustomerComplaint,
  StorePolicy,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_DESIGNS,
  INITIAL_PRODUCTS,
  INITIAL_DELIVERY_RULES,
  INITIAL_COUPONS,
  INITIAL_STORE_SETTINGS,
  INITIAL_REVIEWS,
  INITIAL_POLICIES,
  INITIAL_COMPLAINTS,
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'revora_db_products_v1',
  DESIGNS: 'revora_db_designs_v1',
  CATEGORIES: 'revora_db_categories_v1',
  ORDERS: 'revora_db_orders_v1',
  CUSTOMERS: 'revora_db_customers_v1',
  COUPONS: 'revora_db_coupons_v1',
  DELIVERY_RULES: 'revora_db_delivery_rules_v1',
  REVIEWS: 'revora_db_reviews_v1',
  SETTINGS: 'revora_db_settings_v1',
  NOTIFICATIONS: 'revora_db_notifications_v1',
  POLICIES: 'revora_db_policies_v1',
  COMPLAINTS: 'revora_db_complaints_v1',
  ADMIN_AUTH: 'revora_db_admin_auth_v1',
  ADMIN_SESSION: 'revora_db_admin_session_v1',
  CUSTOMER_SESSION: 'revora_db_customer_session_v1',
  WISHLIST: 'revora_customer_wishlist_v1',
  CART: 'revora_customer_cart_v1',
};

// Safe JSON parser
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Simple SHA-256 helper using subtle crypto or deterministic fallback
export async function hashPassword(plainText: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(plainText + '_REVORA_SALT_2026_');
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('SubtleCrypto error, using fallback hash:', e);
  }
  let hash = 0;
  const str = plainText + '_REVORA_SALT_2026_';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'revora_hash_' + Math.abs(hash).toString(16);
}

// Initialize seed data without overwriting existing data
export function initializeDatabase(): void {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    safeSet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DESIGNS)) {
    safeSet(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    safeSet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DELIVERY_RULES)) {
    safeSet(STORAGE_KEYS.DELIVERY_RULES, INITIAL_DELIVERY_RULES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
    safeSet(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    safeSet(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.POLICIES)) {
    safeSet(STORAGE_KEYS.POLICIES, INITIAL_POLICIES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
    safeSet(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  }

  // Ensure single admin account is configured without modifying or resetting existing credentials
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH)) {
    hashPassword('RevoraAdmin2026!').then((pHash) => {
      if (!localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH)) {
        safeSet(STORAGE_KEYS.ADMIN_AUTH, {
          isConfigured: true,
          username: 'revora_admin',
          passwordHash: pHash,
          lastLogin: new Date().toISOString(),
        });
      }
    });
  }

  // Update or initialize store settings with new email and WhatsApp info
  const existingSettings = safeGet<StoreSettings | null>(STORAGE_KEYS.SETTINGS, null);
  if (!existingSettings) {
    safeSet(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
  } else {
    // Preserve custom settings while ensuring required email & WhatsApp updates
    const updatedSettings: StoreSettings = {
      ...INITIAL_STORE_SETTINGS,
      ...existingSettings,
      supportEmail: 'revoraofficial57@gmail.com',
      whatsappNumber: '+92 329 4862442',
      supportPhone: '+92 329 4862442',
      socialLinks: {
        ...existingSettings.socialLinks,
        whatsapp: 'https://wa.me/923294862442',
      },
      partialPayment: existingSettings.partialPayment || INITIAL_STORE_SETTINGS.partialPayment,
      activePaymentMethods: existingSettings.activePaymentMethods || INITIAL_STORE_SETTINGS.activePaymentMethods,
    };
    safeSet(STORAGE_KEYS.SETTINGS, updatedSettings);
  }

  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    const initialOrder: Order = {
      id: 'ord-init-01',
      orderNumber: 'REV-8921-94',
      customerName: 'Saad Farooq',
      customerEmail: 'saad.motorsport@gmail.com',
      customerPhone: '03018472910',
      shippingAddress: {
        fullName: 'Saad Farooq',
        phone: '03018472910',
        email: 'saad.motorsport@gmail.com',
        address: 'House 42, Street 8, Phase 5 DHA',
        city: 'Lahore',
        area: 'DHA Phase 5',
        province: 'Punjab',
        postalCode: '54000',
        notes: 'Please call before delivery',
      },
      items: [
        {
          productId: 'prod-tach-hoodie',
          variantId: 'var-th-blk-l',
          productName: 'RPM Tachometer 9000 Heavyweight Hoodie',
          designName: 'RPM Tachometer Redline',
          clothingType: 'Hoodie',
          size: 'L',
          color: 'Asphalt Black',
          sku: 'REV-TAC-HOD-BLK-L',
          price: 5950,
          quantity: 1,
          image: INITIAL_PRODUCTS[0].images[0],
        },
      ],
      subtotal: 5950,
      discount: 0,
      deliveryFee: 150,
      total: 6100,
      isPartialPayment: true,
      advancePercentage: 30,
      advanceAmount: 1830,
      amountReceived: 0,
      remainingBalance: 4270,
      currency: 'PKR',
      paymentMethod: 'COD',
      paymentStatus: 'Advance Pending Verification',
      orderStatus: 'Confirmed',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: '2026-02-27T10:00:00Z',
          note: 'Order placed by customer via guest checkout with 30% advance requirement',
          updatedBy: 'Customer (Checkout)',
        },
        {
          status: 'Confirmed',
          timestamp: '2026-02-27T11:30:00Z',
          note: 'Order confirmed and scheduled for dispatch. Balance Rs. 4,270 due on delivery.',
          updatedBy: 'Admin',
        },
      ],
      createdAt: '2026-02-27T10:00:00Z',
    };
    safeSet(STORAGE_KEYS.ORDERS, [initialOrder]);
  }
}

// -------------------------------------------------------------
// SECURE SINGLE ADMIN AUTHENTICATION
// -------------------------------------------------------------
interface AdminAuthData {
  isConfigured: boolean;
  username: string;
  passwordHash: string;
  securityPrompt?: string;
  lastLogin?: string;
  recoveryTokenHash?: string;
}

export function getAdminAuthState(): { isConfigured: boolean; username: string } {
  const data = safeGet<AdminAuthData | null>(STORAGE_KEYS.ADMIN_AUTH, null);
  return { isConfigured: true, username: data?.username || 'revora_admin' };
}

export async function setupAdminAccount(username: string, passwordPlain: string, recoveryCode: string): Promise<boolean> {
  const existing = safeGet<AdminAuthData | null>(STORAGE_KEYS.ADMIN_AUTH, null);
  if (existing && existing.isConfigured) {
    throw new Error('Admin account is already configured. Multiple admin creation or registration is prohibited.');
  }
  if (!username.trim() || passwordPlain.length < 8) {
    throw new Error('Username must be provided and password must be at least 8 characters long.');
  }

  const passwordHash = await hashPassword(passwordPlain);
  const recoveryTokenHash = await hashPassword(recoveryCode);

  const authData: AdminAuthData = {
    isConfigured: true,
    username: username.trim(),
    passwordHash,
    recoveryTokenHash,
    lastLogin: new Date().toISOString(),
  };

  safeSet(STORAGE_KEYS.ADMIN_AUTH, authData);
  setAdminSession(username);
  return true;
}

const RATE_LIMIT_KEY = 'revora_admin_login_ratelimit_v1';

export async function loginAdmin(username: string, passwordPlain: string): Promise<boolean> {
  const rateLimit = safeGet<{ failedAttempts: number; lockUntil: number }>(RATE_LIMIT_KEY, {
    failedAttempts: 0,
    lockUntil: 0,
  });

  if (rateLimit.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((rateLimit.lockUntil - Date.now()) / (60 * 1000));
    throw new Error(`Security Lockout: Too many failed login attempts. Try again in ${minutesLeft} minute(s).`);
  }

  let authData = safeGet<AdminAuthData | null>(STORAGE_KEYS.ADMIN_AUTH, null);
  if (!authData || !authData.isConfigured) {
    const defaultHash = await hashPassword('RevoraAdmin2026!');
    authData = {
      isConfigured: true,
      username: 'revora_admin',
      passwordHash: defaultHash,
      lastLogin: new Date().toISOString(),
    };
    safeSet(STORAGE_KEYS.ADMIN_AUTH, authData);
  }

  const hash = await hashPassword(passwordPlain);
  if (authData.username.toLowerCase() === username.trim().toLowerCase() && authData.passwordHash === hash) {
    // Reset rate limit on success
    safeSet(RATE_LIMIT_KEY, { failedAttempts: 0, lockUntil: 0 });
    authData.lastLogin = new Date().toISOString();
    safeSet(STORAGE_KEYS.ADMIN_AUTH, authData);
    setAdminSession(authData.username);
    return true;
  }

  // Increment failed attempts
  const newAttempts = rateLimit.failedAttempts + 1;
  const newLock = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
  safeSet(RATE_LIMIT_KEY, { failedAttempts: newAttempts, lockUntil: newLock });

  if (newAttempts >= 5) {
    throw new Error('Security Alert: 5 failed login attempts recorded. Admin login locked for 15 minutes.');
  }

  return false;
}

export function setAdminSession(username: string): void {
  const sessionToken = 'admin_sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  safeSet(STORAGE_KEYS.ADMIN_SESSION, { username, token: sessionToken, loginTime: Date.now() });
}

export function getAdminSession(): { username: string; token: string } | null {
  const sess = safeGet<{ username: string; token: string; loginTime: number } | null>(STORAGE_KEYS.ADMIN_SESSION, null);
  if (!sess) return null;
  if (Date.now() - sess.loginTime > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    return null;
  }
  return sess;
}

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

// -------------------------------------------------------------
// PRODUCTS & DESIGNS (Separate pricing per clothing type)
// -------------------------------------------------------------
export function getAllProducts(): Product[] {
  return safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
}

export function getProductById(id: string): Product | null {
  const list = getAllProducts();
  return list.find((p) => p.id === id) || null;
}

export function saveProduct(product: Product): Product {
  // Validate images: minimum 1 and maximum 4 images
  if (!product.images || product.images.length === 0) {
    throw new Error('A minimum of 1 image is required for every product.');
  }
  if (product.images.length > 4) {
    product.images = product.images.slice(0, 4);
  }

  const products = getAllProducts();
  const existingIdx = products.findIndex((p) => p.id === product.id);

  if (existingIdx >= 0) {
    products[existingIdx] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.unshift({
      ...product,
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  safeSet(STORAGE_KEYS.PRODUCTS, products);

  // Sync with design
  if (product.designId) {
    const designs = getAllDesigns();
    const targetDesign = designs.find((d) => d.id === product.designId);
    if (targetDesign && !targetDesign.productIds.includes(product.id)) {
      targetDesign.productIds.push(product.id);
      saveDesign(targetDesign);
    }
  }

  return product;
}

export function deleteProduct(productId: string): boolean {
  let products = getAllProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return false;

  products = products.filter((p) => p.id !== productId);
  safeSet(STORAGE_KEYS.PRODUCTS, products);

  if (product.designId) {
    const designs = getAllDesigns();
    const targetDesign = designs.find((d) => d.id === product.designId);
    if (targetDesign) {
      targetDesign.productIds = targetDesign.productIds.filter((id) => id !== productId);
      saveDesign(targetDesign);
    }
  }

  return true;
}

export function getAllDesigns(): Design[] {
  return safeGet<Design[]>(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS);
}

export function getDesignById(id: string): Design | null {
  const designs = getAllDesigns();
  return designs.find((d) => d.id === id) || null;
}

export function saveDesign(design: Design): Design {
  const designs = getAllDesigns();
  const idx = designs.findIndex((d) => d.id === design.id);
  if (idx >= 0) {
    designs[idx] = design;
  } else {
    designs.unshift(design);
  }
  safeSet(STORAGE_KEYS.DESIGNS, designs);
  return design;
}

export function saveDesignWithClothingTypes(
  design: Design,
  clothingConfigs: Array<{
    clothingType: string;
    price: number;
    salePrice?: number;
    description?: string;
    isAvailable: boolean;
  }>,
  artworkImages: string[]
): Design {
  // Validate images: minimum 1 and maximum 4
  const validImages = artworkImages.filter(Boolean).slice(0, 4);
  if (validImages.length === 0) {
    throw new Error('A minimum of 1 image is required for this design.');
  }

  const updatedDesign: Design = {
    ...design,
    artworkImage: validImages[0],
    availableTypes: clothingConfigs,
  };

  const allProducts = getAllProducts();
  const activeProductIds: string[] = [];

  // For each configured clothing type
  clothingConfigs.forEach((cfg) => {
    if (!cfg.isAvailable) return;

    const existingProduct = allProducts.find(
      (p) => p.designId === design.id && p.clothingType.toLowerCase() === cfg.clothingType.toLowerCase()
    );

    const sizes = ['S', 'M', 'L', 'XL'];
    const colors = ['Asphalt Black', 'Pure White'];
    const skuCode = `${design.code}-${cfg.clothingType.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()}`;

    if (existingProduct) {
      existingProduct.price = Number(cfg.price);
      existingProduct.salePrice = cfg.salePrice ? Number(cfg.salePrice) : undefined;
      existingProduct.discountPercentage = cfg.salePrice ? Math.round(((cfg.price - cfg.salePrice) / cfg.price) * 100) : undefined;
      existingProduct.images = validImages;
      existingProduct.status = 'active';
      existingProduct.updatedAt = new Date().toISOString();
      activeProductIds.push(existingProduct.id);
    } else {
      const newId = `prod-${design.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${cfg.clothingType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newVariants = sizes.flatMap((s) =>
        colors.map((c) => ({
          id: `var-${newId}-${s}-${c}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          sku: `${skuCode}-${s}-${c.substring(0, 3).toUpperCase()}`,
          size: s,
          color: c,
          stock: 15,
          available: true,
        }))
      );

      const newProduct: Product = {
        id: newId,
        name: `${design.name} ${cfg.clothingType}`,
        designId: design.id,
        designName: design.name,
        clothingType: cfg.clothingType,
        category: cfg.clothingType.includes('Hoodie')
          ? 'Hoodies'
          : cfg.clothingType.includes('T-shirt') || cfg.clothingType.includes('T-Shirt')
          ? 'Oversized T-Shirts'
          : cfg.clothingType.includes('Jacket')
          ? 'Jackets'
          : cfg.clothingType.includes('Sweater')
          ? 'Sweaters'
          : 'Streetwear',
        description: cfg.description || design.description,
        images: validImages,
        price: Number(cfg.price),
        salePrice: cfg.salePrice ? Number(cfg.salePrice) : undefined,
        discountPercentage: cfg.salePrice ? Math.round(((cfg.price - cfg.salePrice) / cfg.price) * 100) : undefined,
        sku: skuCode,
        tags: ['Automotive', 'Streetwear', cfg.clothingType],
        sizes,
        colors,
        variants: newVariants,
        status: 'active',
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false,
        isWinterCollection: ['Hoodie', 'Jacket', 'Sweater', 'Winter shirt'].includes(cfg.clothingType),
        allowedPaymentMethods: ['COD', 'BANK_TRANSFER', 'ONLINE'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      allProducts.unshift(newProduct);
      activeProductIds.push(newProduct.id);
    }
  });

  // Archive any products for this design that were disabled
  allProducts.forEach((p) => {
    if (p.designId === design.id && !activeProductIds.includes(p.id)) {
      p.status = 'archived';
    }
  });

  safeSet(STORAGE_KEYS.PRODUCTS, allProducts);

  updatedDesign.productIds = activeProductIds;
  saveDesign(updatedDesign);
  return updatedDesign;
}

export function deleteDesign(designId: string): boolean {
  let designs = getAllDesigns();
  designs = designs.filter((d) => d.id !== designId);
  safeSet(STORAGE_KEYS.DESIGNS, designs);
  return true;
}

export function getProductsForDesign(designId: string): Product[] {
  const products = getAllProducts();
  return products.filter((p) => p.designId === designId && p.status === 'active');
}

// -------------------------------------------------------------
// CATEGORIES & CLOTHING TYPES
// -------------------------------------------------------------
export function getAllCategories(): Category[] {
  return safeGet<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export function saveCategory(category: Category): Category {
  const categories = getAllCategories();
  const idx = categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) {
    categories[idx] = category;
  } else {
    categories.push(category);
  }
  safeSet(STORAGE_KEYS.CATEGORIES, categories);
  return category;
}

export function deleteCategory(id: string): boolean {
  let categories = getAllCategories();
  categories = categories.filter((c) => c.id !== id);
  safeSet(STORAGE_KEYS.CATEGORIES, categories);
  return true;
}

// -------------------------------------------------------------
// ORDERS & CHECKOUT WITH ADVANCE / PARTIAL PAYMENT
// -------------------------------------------------------------
export function getAllOrders(): Order[] {
  const orders = safeGet<Order[]>(STORAGE_KEYS.ORDERS, []);
  return orders.map((o) => ({
    ...o,
    amountReceived:
      typeof o.amountReceived === 'number'
        ? o.amountReceived
        : o.paymentStatus === 'Fully Paid'
        ? o.total
        : o.paymentStatus === 'Partially Paid'
        ? o.advanceAmount || 0
        : 0,
  }));
}

export function getOrderById(id: string): Order | null {
  const orders = getAllOrders();
  return orders.find((o) => o.id === id || o.orderNumber === id) || null;
}

export function trackOrderByReference(orderNumber: string, verificationContact: string): Order | null {
  const orders = getAllOrders();
  const cleanContact = verificationContact.trim().toLowerCase().replace(/[\s-]/g, '');

  return (
    orders.find((o) => {
      const matchOrder = o.orderNumber.toUpperCase() === orderNumber.trim().toUpperCase() || o.id === orderNumber.trim();
      if (!matchOrder) return false;

      const orderPhone = (o.customerPhone || '').toLowerCase().replace(/[\s-]/g, '');
      const orderEmail = (o.customerEmail || '').toLowerCase().trim();

      return orderPhone.includes(cleanContact) || orderEmail === cleanContact;
    }) || null
  );
}

export interface PlaceOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Order['shippingAddress'];
  items: Order['items'];
  subtotal: number;
  discount: number;
  discountCode?: string;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentProof?: PaymentProof;
  isPartialPaymentSelected?: boolean;
  selectedBankAccountId?: string;
  selectedBankAccountName?: string;
  notes?: string;
}

export function placeOrder(input: PlaceOrderInput): Order {
  const products = getAllProducts();
  const settings = getStoreSettings();

  // 1. Transaction-safe inventory verification and decrement
  for (const item of input.items) {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) {
      throw new Error(`Product "${item.productName}" is no longer available.`);
    }

    const variant = prod.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      throw new Error(`Selected size/color combination for "${item.productName}" is invalid.`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${item.productName}" (${item.size} / ${item.color}). Only ${variant.stock} remaining.`);
    }

    variant.stock -= item.quantity;
    if (variant.stock <= 0) {
      variant.stock = 0;
      variant.available = false;
    }
  }

  safeSet(STORAGE_KEYS.PRODUCTS, products);

  // 2. Partial payment calculation
  let isPartialPayment = false;
  let advancePercentage = 0;
  let advanceAmount = 0;
  let remainingBalance = 0;
  let remainingBalanceDueWhen: string | undefined = undefined;

  const isEligibleForPartial =
    settings.partialPayment?.enabled &&
    settings.partialPayment.allowedMethods.includes(input.paymentMethod) &&
    input.total > 0;

  // If customer selected partial payment or if partial payment is default for eligible methods
  if (isEligibleForPartial && input.isPartialPaymentSelected !== false) {
    isPartialPayment = true;
    advancePercentage = settings.partialPayment.advancePercentage || 50;
    const computedAdvance = Math.round((input.total * advancePercentage) / 100);
    const minAdvance = settings.partialPayment.minAdvanceAmount || 500;
    const maxAdvance = settings.partialPayment.maxAdvanceAmount;

    let finalAdvance = Math.max(minAdvance, computedAdvance);
    if (maxAdvance && finalAdvance > maxAdvance) {
      finalAdvance = maxAdvance;
    }
    if (finalAdvance > input.total) {
      finalAdvance = input.total;
    }

    advanceAmount = finalAdvance;
    remainingBalance = input.total - advanceAmount;
    remainingBalanceDueWhen =
      settings.partialPayment.remainingBalanceDueWhen || 'Payable in cash upon doorstep delivery';
  } else {
    advanceAmount = input.paymentMethod === 'COD' ? 0 : input.total;
    remainingBalance = input.paymentMethod === 'COD' ? input.total : 0;
    if (input.paymentMethod === 'COD') {
      remainingBalanceDueWhen = 'Payable in cash to courier at delivery';
    }
  }

  // 3. Determine precise payment status
  let paymentStatus: PaymentStatus = 'Unpaid';
  if (isPartialPayment) {
    if (input.paymentProof) {
      paymentStatus = 'Advance Pending Verification';
    } else {
      paymentStatus = 'Advance Required';
    }
  } else {
    if (input.paymentMethod === 'COD') {
      paymentStatus = 'Unpaid';
    } else if (input.paymentProof) {
      paymentStatus = 'Advance Pending Verification';
    } else {
      paymentStatus = 'Unpaid';
    }
  }

  // 4. Generate unique human-readable order number
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const orderNumber = `REV-${month}${day}-${randomSuffix}`;
  const orderId = 'ord-' + Date.now() + '-' + randomSuffix;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: input.shippingAddress,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    discountCode: input.discountCode,
    deliveryFee: input.deliveryFee,
    total: input.total,
    isPartialPayment,
    advancePercentage,
    advanceAmount,
    amountReceived: 0,
    remainingBalance,
    remainingBalanceDueWhen,
    selectedBankAccountId: input.selectedBankAccountId,
    selectedBankAccountName: input.selectedBankAccountName,
    currency: 'PKR',
    paymentMethod: input.paymentMethod,
    paymentProof: input.paymentProof,
    paymentStatus,
    orderStatus: 'Pending',
    statusHistory: [
      {
        status: 'Pending',
        timestamp: new Date().toISOString(),
        note: isPartialPayment
          ? `Order placed via ${input.paymentMethod}. Advance required: Rs. ${advanceAmount.toLocaleString()} (${advancePercentage}%), Remaining: Rs. ${remainingBalance.toLocaleString()} (${remainingBalanceDueWhen || 'At delivery'})`
          : `Order placed via ${input.paymentMethod}. Total: Rs. ${input.total.toLocaleString()}`,
        updatedBy: 'Customer (Checkout)',
      },
    ],
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  const orders = getAllOrders();
  orders.unshift(newOrder);
  safeSet(STORAGE_KEYS.ORDERS, orders);

  if (input.discountCode) {
    const coupons = getAllCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === input.discountCode?.toUpperCase());
    if (coupon) {
      coupon.usedCount += 1;
      safeSet(STORAGE_KEYS.COUPONS, coupons);
    }
  }

  addAdminNotification({
    type: 'order',
    title: `New Order: ${orderNumber}`,
    message: `${input.customerName} placed order for Rs. ${input.total.toLocaleString()} (${input.paymentMethod}).`,
    referenceId: orderId,
  });

  if (input.paymentProof) {
    addAdminNotification({
      type: 'payment_proof',
      title: `Payment Slip: ${orderNumber}`,
      message: `Customer uploaded transaction receipt for order ${orderNumber}. Verification required.`,
      referenceId: orderId,
    });
  }

  return newOrder;
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
  adminUser: string = 'Admin'
): Order {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');

  const oldStatus = order.orderStatus;
  order.orderStatus = newStatus;

  if (newStatus === 'Delivered' && !order.deliveredAt) {
    order.deliveredAt = new Date().toISOString();
    // When delivered on COD, mark fully paid if balance was due
    if (order.remainingBalance > 0 && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Fully Paid';
      order.remainingBalance = 0;
    }
  }

  // Restore inventory if cancelled or refunded
  if ((newStatus === 'Cancelled' || newStatus === 'Refunded') && oldStatus !== 'Cancelled' && oldStatus !== 'Refunded') {
    const products = getAllProducts();
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const variant = prod.variants.find((v) => v.id === item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          variant.available = true;
        }
      }
    }
    safeSet(STORAGE_KEYS.PRODUCTS, products);
  }

  order.statusHistory.unshift({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status updated from ${oldStatus} to ${newStatus}`,
    updatedBy: adminUser,
  });

  safeSet(STORAGE_KEYS.ORDERS, orders);
  return order;
}

export function updatePaymentVerification(
  orderId: string,
  status: 'Verified' | 'Rejected',
  rejectionReason?: string,
  adminUser: string = 'Admin'
): Order {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order || !order.paymentProof) throw new Error('Order or payment proof not found');

  order.paymentProof.status = status;
  order.paymentProof.verifiedAt = new Date().toISOString();
  order.paymentProof.verifiedBy = adminUser;
  if (rejectionReason) {
    order.paymentProof.rejectionReason = rejectionReason;
  }

  if (status === 'Verified') {
    if (order.isPartialPayment && order.remainingBalance > 0) {
      order.amountReceived = order.advanceAmount;
      order.paymentStatus = 'Partially Paid';
    } else {
      order.amountReceived = order.total;
      order.remainingBalance = 0;
      order.paymentStatus = 'Fully Paid';
    }
    if (order.orderStatus === 'Pending') {
      order.orderStatus = 'Confirmed';
    }
  } else {
    order.paymentStatus = 'Payment Proof Rejected';
    order.amountReceived = 0;
  }

  order.statusHistory.unshift({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    note: `Payment proof status marked as ${status}${rejectionReason ? ': ' + rejectionReason : ''}. Amount received: Rs. ${(order.amountReceived || 0).toLocaleString()}, Outstanding: Rs. ${(order.remainingBalance || 0).toLocaleString()}`,
    updatedBy: adminUser,
  });

  safeSet(STORAGE_KEYS.ORDERS, orders);
  return order;
}

export function recordRemainingPayment(
  orderId: string,
  amountReceived: number,
  notes?: string,
  adminUser: string = 'Admin'
): Order {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found');

  const prevBalance = order.remainingBalance || 0;
  const newBalance = Math.max(0, prevBalance - amountReceived);
  order.remainingBalance = newBalance;
  order.amountReceived = (order.amountReceived || 0) + amountReceived;

  if (newBalance === 0) {
    order.paymentStatus = 'Fully Paid';
  } else {
    order.paymentStatus = 'Partially Paid';
  }

  order.statusHistory.unshift({
    status: order.orderStatus,
    timestamp: new Date().toISOString(),
    note: `Recorded payment of Rs. ${amountReceived.toLocaleString()} by ${adminUser}. Total received: Rs. ${order.amountReceived.toLocaleString()}, Remaining balance: Rs. ${newBalance.toLocaleString()}.${notes ? ' Note: ' + notes : ''}`,
    updatedBy: adminUser,
  });

  safeSet(STORAGE_KEYS.ORDERS, orders);
  return order;
}

export function updateOrderEmailStatus(
  orderId: string,
  emailSent: boolean,
  emailError?: string,
  gmailMessageId?: string
): Order | null {
  const orders = getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  order.emailSent = emailSent;
  if (emailSent) {
    order.emailSentAt = new Date().toISOString();
    order.emailError = undefined;
    if (gmailMessageId) order.gmailMessageId = gmailMessageId;
  } else if (emailError) {
    order.emailError = emailError;
  }

  safeSet(STORAGE_KEYS.ORDERS, orders);
  return order;
}

// -------------------------------------------------------------
// CUSTOMER COMPLAINTS & SUPPORT PORTAL
// -------------------------------------------------------------
export function getAllComplaints(): CustomerComplaint[] {
  return safeGet<CustomerComplaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
}

export function getComplaintByTicket(ticketNumber: string, contact: string): CustomerComplaint | null {
  const complaints = getAllComplaints();
  const cleanContact = contact.trim().toLowerCase().replace(/[\s-]/g, '');

  return (
    complaints.find((c) => {
      const matchTicket = c.ticketNumber.toUpperCase() === ticketNumber.trim().toUpperCase() || c.id === ticketNumber.trim();
      if (!matchTicket) return false;
      const cleanPhone = (c.phone || '').toLowerCase().replace(/[\s-]/g, '');
      const cleanEmail = (c.email || '').toLowerCase().trim();
      return cleanPhone.includes(cleanContact) || cleanEmail === cleanContact;
    }) || null
  );
}

export function createComplaint(data: {
  fullName: string;
  orderId?: string;
  phone: string;
  email: string;
  category: CustomerComplaint['category'];
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
}): CustomerComplaint {
  const complaints = getAllComplaints();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `REV-CMP-${randomSuffix}`;

  const newComplaint: CustomerComplaint = {
    id: 'cmp-' + Date.now(),
    ticketNumber,
    fullName: data.fullName.trim(),
    orderId: data.orderId ? data.orderId.trim() : undefined,
    phone: data.phone.trim(),
    email: data.email.trim(),
    category: data.category,
    description: data.description.trim(),
    attachmentUrl: data.attachmentUrl,
    attachmentName: data.attachmentName,
    status: 'New',
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  complaints.unshift(newComplaint);
  safeSet(STORAGE_KEYS.COMPLAINTS, complaints);

  addAdminNotification({
    type: 'complaint',
    title: `New Support Ticket: ${ticketNumber}`,
    message: `${data.fullName} submitted a complaint regarding ${data.category}.`,
    referenceId: newComplaint.id,
  });

  return newComplaint;
}

export function addComplaintReply(
  complaintId: string,
  reply: { sender: 'Admin' | 'Customer'; senderName: string; message: string }
): CustomerComplaint {
  const complaints = getAllComplaints();
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error('Complaint not found');

  complaint.replies.push({
    id: 'rep-' + Date.now(),
    sender: reply.sender,
    senderName: reply.senderName,
    message: reply.message.trim(),
    timestamp: new Date().toISOString(),
  });

  if (reply.sender === 'Admin') {
    complaint.status = 'Awaiting Customer';
  } else {
    complaint.status = 'In Review';
  }

  complaint.updatedAt = new Date().toISOString();
  safeSet(STORAGE_KEYS.COMPLAINTS, complaints);
  return complaint;
}

export function updateComplaintStatus(
  complaintId: string,
  status: CustomerComplaint['status'],
  internalNotes?: string
): CustomerComplaint {
  const complaints = getAllComplaints();
  const complaint = complaints.find((c) => c.id === complaintId);
  if (!complaint) throw new Error('Complaint not found');

  complaint.status = status;
  if (internalNotes !== undefined) {
    complaint.internalNotes = internalNotes;
  }
  complaint.updatedAt = new Date().toISOString();
  safeSet(STORAGE_KEYS.COMPLAINTS, complaints);
  return complaint;
}

export function deleteComplaint(complaintId: string): boolean {
  let complaints = getAllComplaints();
  complaints = complaints.filter((c) => c.id !== complaintId);
  safeSet(STORAGE_KEYS.COMPLAINTS, complaints);
  return true;
}

// -------------------------------------------------------------
// EDITABLE STORE RULES & POLICIES
// -------------------------------------------------------------
export function getAllPolicies(): StorePolicy[] {
  return safeGet<StorePolicy[]>(STORAGE_KEYS.POLICIES, INITIAL_POLICIES);
}

export function getPublishedPolicies(): StorePolicy[] {
  return getAllPolicies().filter((p) => p.isPublished).sort((a, b) => a.order - b.order);
}

export function savePolicy(policy: StorePolicy): StorePolicy {
  const policies = getAllPolicies();
  const idx = policies.findIndex((p) => p.id === policy.id);
  if (idx >= 0) {
    policies[idx] = { ...policy, updatedAt: new Date().toISOString() };
  } else {
    policies.push({
      ...policy,
      order: policy.order || policies.length + 1,
      updatedAt: new Date().toISOString(),
    });
  }
  safeSet(STORAGE_KEYS.POLICIES, policies);
  return policy;
}

export function deletePolicy(policyId: string): boolean {
  let policies = getAllPolicies();
  policies = policies.filter((p) => p.id !== policyId);
  safeSet(STORAGE_KEYS.POLICIES, policies);
  return true;
}

// -------------------------------------------------------------
// CUSTOMER ACCOUNTS (Manual admin management, no auto-deletion)
// -------------------------------------------------------------
export function getAllCustomers(): CustomerAccount[] {
  return safeGet<CustomerAccount[]>(STORAGE_KEYS.CUSTOMERS, []);
}

export function toggleCustomerStatus(customerId: string): boolean {
  const customers = getAllCustomers();
  const cust = customers.find((c) => c.id === customerId);
  if (!cust) return false;
  cust.isActive = !cust.isActive;
  safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  return true;
}

export function deleteCustomerAccount(customerId: string): boolean {
  let customers = getAllCustomers();
  customers = customers.filter((c) => c.id !== customerId);
  safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  return true;
}

export async function requestCustomerPasswordReset(email: string): Promise<{ success: boolean; message: string; tempCode?: string }> {
  const customers = getAllCustomers();
  const cust = customers.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  if (!cust) {
    return { success: false, message: 'No registered customer account found with this email address.' };
  }

  const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
  cust.passwordResetToken = await hashPassword(tempCode);
  cust.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  return {
    success: true,
    message: `A secure 6-digit password verification code has been generated. Use code ${tempCode} to establish a new password.`,
    tempCode,
  };
}

export async function resetCustomerPasswordWithCode(email: string, code: string, newPasswordPlain: string): Promise<boolean> {
  const customers = getAllCustomers();
  const cust = customers.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  if (!cust || !cust.passwordResetToken || !cust.passwordResetExpires) return false;

  if (new Date(cust.passwordResetExpires).getTime() < Date.now()) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  const codeHash = await hashPassword(code.trim());
  if (cust.passwordResetToken !== codeHash) {
    throw new Error('Invalid verification code.');
  }

  cust.passwordHash = await hashPassword(newPasswordPlain);
  cust.passwordResetToken = undefined;
  cust.passwordResetExpires = undefined;
  safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  return true;
}

// -------------------------------------------------------------
// COUPONS & DISCOUNTS
// -------------------------------------------------------------
export function getAllCoupons(): Coupon[] {
  return safeGet<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
}

export function saveCoupon(coupon: Coupon): Coupon {
  const coupons = getAllCoupons();
  const idx = coupons.findIndex((c) => c.id === coupon.id);
  if (idx >= 0) {
    coupons[idx] = coupon;
  } else {
    coupons.push(coupon);
  }
  safeSet(STORAGE_KEYS.COUPONS, coupons);
  return coupon;
}

export function deleteCoupon(id: string): boolean {
  let coupons = getAllCoupons();
  coupons = coupons.filter((c) => c.id !== id);
  safeSet(STORAGE_KEYS.COUPONS, coupons);
  return true;
}

export function validateCoupon(
  code: string,
  subtotal: number,
  items: Array<{ productId: string; category?: string }>
): { valid: boolean; discountAmount: number; coupon?: Coupon; error?: string } {
  const coupons = getAllCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);

  if (!coupon) {
    return { valid: false, discountAmount: 0, error: 'Invalid or inactive promo code.' };
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, discountAmount: 0, error: 'Promo code is not yet active.' };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return { valid: false, discountAmount: 0, error: 'Promo code has expired.' };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, error: 'Promo code usage limit reached.' };
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order amount of Rs. ${coupon.minOrderAmount.toLocaleString()} required for this code.`,
    };
  }

  let calculatedDiscount = 0;
  if (coupon.discountType === 'percentage') {
    calculatedDiscount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
      calculatedDiscount = coupon.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = coupon.discountValue;
  }

  if (calculatedDiscount > subtotal) {
    calculatedDiscount = subtotal;
  }

  return { valid: true, discountAmount: calculatedDiscount, coupon };
}

// -------------------------------------------------------------
// DELIVERY RULES & CUSTOM CITY SUPPORT
// -------------------------------------------------------------
export function getAllDeliveryRules(): DeliveryRule[] {
  return safeGet<DeliveryRule[]>(STORAGE_KEYS.DELIVERY_RULES, INITIAL_DELIVERY_RULES);
}

export function saveDeliveryRule(rule: DeliveryRule): DeliveryRule {
  const rules = getAllDeliveryRules();
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx >= 0) {
    rules[idx] = rule;
  } else {
    rules.push(rule);
  }
  safeSet(STORAGE_KEYS.DELIVERY_RULES, rules);
  return rule;
}

export function deleteDeliveryRule(id: string): boolean {
  let rules = getAllDeliveryRules();
  rules = rules.filter((r) => r.id !== id);
  safeSet(STORAGE_KEYS.DELIVERY_RULES, rules);
  return true;
}

export function calculateDeliveryFee(
  city: string,
  subtotal: number,
  area?: string,
  paymentMethod?: PaymentMethodType
): {
  fee: number;
  codExtra: number;
  totalDelivery: number;
  estimatedDays: string;
  isFree: boolean;
  isRestricted: boolean;
  matchedRuleName: string;
} {
  const settings = getStoreSettings();
  const rules = getAllDeliveryRules().filter((r) => r.isActive !== false);

  const cleanCity = (city || '').trim().toLowerCase();
  const cleanArea = (area || '').trim().toLowerCase();

  // 1. Try matching specific area under city or nationwide
  let matched: DeliveryRule | undefined = undefined;
  if (cleanArea) {
    matched = rules.find(
      (r) =>
        r.area &&
        r.area.toLowerCase() === cleanArea &&
        (r.city.toLowerCase() === cleanCity || cleanCity === '' || cleanCity === 'other / enter manually')
    );
  }

  // 2. Try matching city
  if (!matched && cleanCity && cleanCity !== 'other / enter manually') {
    matched = rules.find((r) => r.city.toLowerCase() === cleanCity && !r.area);
    if (!matched) {
      matched = rules.find((r) => r.city.toLowerCase() === cleanCity);
    }
  }

  // 3. Fallback to default nationwide rule
  if (!matched) {
    matched = rules.find((r) => r.city.toLowerCase() === 'default');
  }

  const isRestricted = matched ? matched.isAvailable === false : false;
  const baseCharge = matched ? matched.charge : settings.defaultDeliveryFee;
  const codExtra = paymentMethod === 'COD' && matched?.codExtraCharge ? matched.codExtraCharge : 0;
  const estimatedDays = matched ? matched.estimatedDays : '2 - 4 Business Days';
  const matchedRuleName = matched ? `${matched.city}${matched.area ? ` - ${matched.area}` : ''}` : 'Nationwide Default';

  if (subtotal >= settings.freeShippingThreshold) {
    return {
      fee: 0,
      codExtra,
      totalDelivery: codExtra,
      estimatedDays,
      isFree: true,
      isRestricted,
      matchedRuleName,
    };
  }

  return {
    fee: baseCharge,
    codExtra,
    totalDelivery: baseCharge + codExtra,
    estimatedDays,
    isFree: false,
    isRestricted,
    matchedRuleName,
  };
}

// -------------------------------------------------------------
// REVIEWS
// -------------------------------------------------------------
export function getAllReviews(): ProductReview[] {
  return safeGet<ProductReview[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
}

export function saveReview(review: ProductReview): ProductReview {
  const reviews = getAllReviews();
  const idx = reviews.findIndex((r) => r.id === review.id);
  if (idx >= 0) {
    reviews[idx] = review;
  } else {
    reviews.unshift(review);
  }
  safeSet(STORAGE_KEYS.REVIEWS, reviews);
  return review;
}

export function deleteReview(id: string): boolean {
  let reviews = getAllReviews();
  reviews = reviews.filter((r) => r.id !== id);
  safeSet(STORAGE_KEYS.REVIEWS, reviews);
  return true;
}

export function getApprovedReviews(productId?: string): ProductReview[] {
  const all = getAllReviews();
  return all.filter((r) => r.status === 'Approved' && (!productId || r.productId === productId));
}

export function submitCustomerReview(data: {
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  orderNumber?: string;
}): ProductReview {
  const allOrders = getAllOrders();
  const cleanEmail = data.customerEmail.toLowerCase().trim();
  const cleanOrder = (data.orderNumber || '').toUpperCase().trim();

  // Check if customer email or order reference matches a real purchase of this product
  const isVerified = allOrders.some((o) => {
    const emailMatch = o.customerEmail.toLowerCase().trim() === cleanEmail;
    const orderMatch = cleanOrder ? o.orderNumber.toUpperCase() === cleanOrder : false;
    if (!emailMatch && !orderMatch) return false;
    return o.items.some((i) => i.productId === data.productId);
  });

  const review: ProductReview = {
    id: 'rev-' + Date.now(),
    productId: data.productId,
    productName: data.productName,
    customerName: data.customerName.trim(),
    customerEmail: data.customerEmail.trim(),
    rating: data.rating,
    comment: data.comment.trim(),
    createdAt: new Date().toISOString(),
    isVerifiedPurchase: isVerified,
    status: 'Pending', // ALWAYS Pending until approved by admin
  };

  saveReview(review);

  addAdminNotification({
    type: 'review',
    title: `New Review for ${data.productName}`,
    message: `${data.customerName} submitted a ${data.rating}★ review for "${data.productName}". Admin approval required before public display.`,
    referenceId: review.id,
  });

  return review;
}
// -------------------------------------------------------------
export function getStoreSettings(): StoreSettings {
  const current = safeGet<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
  let changed = false;

  // Ensure bank accounts (up to 3) are initialized
  if (!current.bankAccounts || current.bankAccounts.length === 0) {
    current.bankAccounts = INITIAL_STORE_SETTINGS.bankAccounts || [];
    changed = true;
  }

  // Ensure partial payments config is present
  if (!current.partialPayment) {
    current.partialPayment = INITIAL_STORE_SETTINGS.partialPayment;
    changed = true;
  } else if (current.partialPayment.advancePercentage === undefined) {
    current.partialPayment.advancePercentage = 50;
    changed = true;
  }

  // Ensure gmail settings are present
  if (!current.gmailSettings) {
    current.gmailSettings = {
      autoSendOrderEmail: true,
      senderEmail: 'revoraofficial57@gmail.com',
      isConnected: false,
      userEmail: 'revoraofficial57@gmail.com',
    };
    changed = true;
  }

  if (changed) {
    safeSet(STORAGE_KEYS.SETTINGS, current);
  }

  return current;
}

export function saveStoreSettings(settings: StoreSettings): StoreSettings {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

export function runRetentionCleanupTask(): { anonymizedCount: number; evaluatedOrders: number } {
  const orders = getAllOrders();
  const settings = getStoreSettings();
  const retentionDays = settings.securityAndPrivacy?.guestOrderDataRetentionDays || 90;
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  let anonymizedCount = 0;
  const updatedOrders = orders.map((o) => {
    const orderTime = new Date(o.createdAt).getTime();
    if (orderTime < cutoffTime && (o.orderStatus === 'Delivered' || o.orderStatus === 'Cancelled')) {
      if (!o.customerName.includes('[Redacted]')) {
        anonymizedCount++;
        return {
          ...o,
          customerName: 'Customer #' + o.orderNumber.slice(-4),
          customerEmail: 'redacted@revora.private',
          customerPhone: '0300*******',
          shippingAddress: {
            ...o.shippingAddress,
            fullName: 'Customer #' + o.orderNumber.slice(-4),
            phone: '0300*******',
            email: 'redacted@revora.private',
            address: '[Redacted per retention policy]',
            notes: undefined,
          },
        };
      }
    }
    return o;
  });

  if (anonymizedCount > 0) {
    safeSet(STORAGE_KEYS.ORDERS, updatedOrders);
  }

  return { anonymizedCount, evaluatedOrders: orders.length };
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
export function getAdminNotifications(): AdminNotification[] {
  return safeGet<AdminNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function addAdminNotification(notif: Omit<AdminNotification, 'id' | 'timestamp' | 'isRead'>): AdminNotification {
  const notifs = getAdminNotifications();
  const newNotif: AdminNotification = {
    ...notif,
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  notifs.unshift(newNotif);
  if (notifs.length > 50) notifs.pop();
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const notifs = getAdminNotifications();
  const item = notifs.find((n) => n.id === id);
  if (item) {
    item.isRead = true;
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
}

export function markAllNotificationsAsRead(): void {
  const notifs = getAdminNotifications();
  notifs.forEach((n) => (n.isRead = true));
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifs);
}

// -------------------------------------------------------------
// CSV IMPORT / EXPORT
// -------------------------------------------------------------
export function generateProductCsvTemplate(): string {
  const headers = [
    'Design Name',
    'Product Name',
    'Clothing Type',
    'Category',
    'Description',
    'Base Price',
    'Sale Price',
    'SKU',
    'Size',
    'Color',
    'Variant SKU',
    'Stock',
    'Payment Methods (comma separated COD|ONLINE|BANK_TRANSFER)',
    'Tags (comma separated)',
    'Is Featured (true/false)',
    'Is Winter Collection (true/false)',
  ];

  const sampleRows = [
    [
      'RPM Tachometer Redline',
      'RPM Tachometer 9000 Heavyweight Hoodie',
      'Hoodie',
      'Hoodies',
      '450 GSM Heavy combed cotton fleece with tachometer embroidery',
      '6850',
      '5950',
      'REV-TAC-HOD',
      'M',
      'Asphalt Black',
      'REV-TAC-HOD-BLK-M',
      '24',
      'COD,ONLINE,BANK_TRANSFER',
      'Hoodie,Tachometer,Bestseller',
      'true',
      'true',
    ],
  ];

  return [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
}

export function parseAndValidateCsv(csvText: string): {
  rows: Array<{ rowNumber: number; data: Record<string, string>; isValid: boolean; errors: string[] }>;
  validCount: number;
  errorCount: number;
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0 };
  }

  const headers = parseCsvLine(lines[0]);
  const rows: Array<{ rowNumber: number; data: Record<string, string>; isValid: boolean; errors: string[] }> = [];
  const seenVariantSkus = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h.trim()] = values[idx] ? values[idx].trim() : '';
    });

    const errors: string[] = [];
    const productName = rowObj['Product Name'] || '';
    const clothingType = rowObj['Clothing Type'] || '';
    const priceStr = rowObj['Base Price'] || '';
    const variantSku = rowObj['Variant SKU'] || '';
    const stockStr = rowObj['Stock'] || '';

    if (!productName) errors.push('Missing Product Name');
    if (!clothingType) errors.push('Missing Clothing Type');
    if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) <= 0) {
      errors.push('Base Price must be a positive number');
    }
    if (!variantSku) {
      errors.push('Missing Variant SKU');
    } else if (seenVariantSkus.has(variantSku.toUpperCase())) {
      errors.push(`Duplicate Variant SKU in file: ${variantSku}`);
    } else {
      seenVariantSkus.add(variantSku.toUpperCase());
    }

    if (!stockStr || isNaN(Number(stockStr)) || Number(stockStr) < 0) {
      errors.push('Stock must be zero or a positive integer');
    }

    rows.push({
      rowNumber: i + 1,
      data: rowObj,
      isValid: errors.length === 0,
      errors,
    });
  }

  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.length - validCount;

  return { rows, validCount, errorCount };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function exportOrdersCsv(): string {
  const orders = getAllOrders();
  const headers = [
    'Order Number',
    'Date',
    'Customer Name',
    'Phone',
    'City',
    'Total (PKR)',
    'Advance Paid (PKR)',
    'Balance Due (PKR)',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Items Count',
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString(),
    o.customerName,
    o.customerPhone,
    o.shippingAddress.city,
    o.total.toString(),
    (o.advanceAmount || 0).toString(),
    (o.remainingBalance || 0).toString(),
    o.paymentMethod,
    o.paymentStatus,
    o.orderStatus,
    o.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
  ]);

  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
}

export function exportInventoryCsv(): string {
  const products = getAllProducts();
  const headers = ['Product Name', 'Design', 'Type', 'Base SKU', 'Variant SKU', 'Size', 'Color', 'Stock', 'Price', 'Status'];
  const rows: string[][] = [];

  for (const prod of products) {
    for (const v of prod.variants) {
      rows.push([
        prod.name,
        prod.designName,
        prod.clothingType,
        prod.sku,
        v.sku,
        v.size,
        v.color,
        v.stock.toString(),
        (v.priceOverride || prod.salePrice || prod.price).toString(),
        v.available ? 'In Stock' : 'Out of Stock',
      ]);
    }
  }

  return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
}
