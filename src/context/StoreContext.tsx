import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Design,
  Category,
  CartItem,
  Order,
  PaymentMethodType,
  PaymentProof,
  StoreSettings,
  CustomerAccount,
  StorePolicy,
  CustomerComplaint,
} from '../types';
import {
  initializeDatabase,
  getAllProducts,
  getAllDesigns,
  getAllCategories,
  getStoreSettings,
  calculateDeliveryFee,
  validateCoupon,
  placeOrder,
  PlaceOrderInput,
  hashPassword,
  getAllPolicies,
  getPublishedPolicies,
  getAllComplaints,
  createComplaint,
  requestCustomerPasswordReset,
  resetCustomerPasswordWithCode,
} from '../services/storage';

interface StoreContextType {
  products: Product[];
  designs: Design[];
  categories: Category[];
  settings: StoreSettings;
  policies: StorePolicy[];
  cart: CartItem[];
  wishlist: string[];
  customer: CustomerAccount | null;
  appliedCouponCode: string;
  couponDiscount: number;
  deliveryCity: string;
  deliveryArea: string;
  deliveryFee: number;
  estimatedDeliveryDays: string;
  isFreeDelivery: boolean;
  isDeliveryRestricted: boolean;
  cartSubtotal: number;
  cartTotal: number;
  advanceAmount: number;
  remainingBalance: number;
  isPartialPaymentApplicable: boolean;
  allowedPaymentMethods: PaymentMethodType[];
  incompatiblePaymentWarning: string | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  setDeliveryCity: (city: string) => void;
  setDeliveryArea: (area: string) => void;
  checkoutOrder: (
    customerDetails: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      area?: string;
      isManualCity?: boolean;
      province: string;
      postalCode?: string;
      notes?: string;
    },
    paymentMethod: PaymentMethodType,
    paymentProof?: PaymentProof,
    paymentDetails?: {
      isPartialPaymentSelected?: boolean;
      selectedBankAccountId?: string;
      selectedBankAccountName?: string;
    }
  ) => Promise<Order>;
  formatPKR: (amount: number) => string;
  refreshData: () => void;
  customerLogin: (email: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  customerRegister: (name: string, email: string, phone: string, passwordPlain: string) => Promise<{ success: boolean; error?: string }>;
  customerLogout: () => void;
  submitComplaint: (data: {
    fullName: string;
    orderId?: string;
    phone: string;
    email: string;
    category: CustomerComplaint['category'];
    description: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }) => Promise<CustomerComplaint>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; tempCode?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPasswordPlain: string) => Promise<boolean>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());
  const [policies, setPolicies] = useState<StorePolicy[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('revora_customer_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('revora_customer_wishlist_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customer, setCustomer] = useState<CustomerAccount | null>(() => {
    try {
      const saved = localStorage.getItem('revora_customer_session_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [deliveryCity, setDeliveryCityState] = useState<string>('Lahore');
  const [deliveryArea, setDeliveryAreaState] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const refreshData = () => {
    initializeDatabase();
    setProducts(getAllProducts());
    setDesigns(getAllDesigns());
    setCategories(getAllCategories());
    setSettings(getStoreSettings());
    setPolicies(getPublishedPolicies());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Sync cart & wishlist
  useEffect(() => {
    try {
      localStorage.setItem('revora_customer_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('revora_customer_wishlist_v1', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliveryCalc = calculateDeliveryFee(deliveryCity, cartSubtotal, deliveryArea);
  const deliveryFee = deliveryCalc.totalDelivery;
  const estimatedDeliveryDays = deliveryCalc.estimatedDays;
  const isFreeDelivery = deliveryCalc.isFree;
  const isDeliveryRestricted = deliveryCalc.isRestricted;

  const cartTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryFee);

  // Partial Payment calculations
  const isPartialPaymentApplicable = Boolean(
    settings.partialPayment?.enabled && cartTotal > 0
  );

  let advanceAmount = cartTotal;
  let remainingBalance = 0;

  if (isPartialPaymentApplicable) {
    const advPct = settings.partialPayment.advancePercentage || 50;
    const computedAdv = Math.round((cartTotal * advPct) / 100);
    const minAdv = settings.partialPayment.minAdvanceAmount || 500;
    const maxAdv = settings.partialPayment.maxAdvanceAmount;

    let finalAdv = Math.max(minAdv, computedAdv);
    if (maxAdv && finalAdv > maxAdv) {
      finalAdv = maxAdv;
    }
    if (finalAdv > cartTotal) {
      finalAdv = cartTotal;
    }
    advanceAmount = finalAdv;
    remainingBalance = cartTotal - advanceAmount;
  }

  // Compute intersection of allowed payment methods across cart items and active store methods
  const computeAllowedPayments = (): { methods: PaymentMethodType[]; warning: string | null } => {
    const storeActive = settings.activePaymentMethods || ['COD', 'ONLINE', 'BANK_TRANSFER'];
    if (cart.length === 0) {
      return { methods: storeActive, warning: null };
    }

    let intersection: PaymentMethodType[] = [...storeActive];
    for (const item of cart) {
      const itemMethods = item.allowedPaymentMethods || storeActive;
      intersection = intersection.filter((m) => itemMethods.includes(m));
    }

    if (intersection.length === 0) {
      const fallback = storeActive.includes('BANK_TRANSFER') ? ['BANK_TRANSFER'] : storeActive.slice(0, 1);
      return {
        methods: fallback as PaymentMethodType[],
        warning: 'Items in your bag have contrasting payment rules. Bank Transfer or Online verification is enabled for this order.',
      };
    }

    let warning: string | null = null;
    if (!intersection.includes('COD') && cart.some((i) => (i.allowedPaymentMethods || []).includes('COD'))) {
      warning = 'Cash on Delivery is unavailable for one or more items in your bag. Please select Online Payment or Bank Transfer.';
    }

    return { methods: intersection, warning };
  };

  const { methods: allowedPaymentMethods, warning: incompatiblePaymentWarning } = computeAllowedPayments();

  const addToCart = (product: Product, size: string, color: string, quantity: number = 1): boolean => {
    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (!variant || variant.stock < quantity) {
      showToast('Selected size and colorway combination is sold out.');
      return false;
    }

    const cartItemId = `${product.id}_${variant.id}`;
    const existing = cart.find((i) => i.id === cartItemId);

    if (existing) {
      if (existing.quantity + quantity > variant.stock) {
        showToast(`Cannot add more. Only ${variant.stock} units in stock.`);
        return false;
      }
      setCart((prev) =>
        prev.map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i))
      );
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        designName: product.designName,
        clothingType: product.clothingType,
        size,
        color,
        price: variant.priceOverride || product.salePrice || product.price,
        quantity,
        image: product.images[0] || '',
        allowedPaymentMethods: product.allowedPaymentMethods,
      };
      setCart((prev) => [...prev, newItem]);
    }

    showToast(`Added ${product.name} (${size}) to bag`);
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    const item = cart.find((i) => i.id === cartItemId);
    if (item) {
      const prod = products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      if (variant && quantity > variant.stock) {
        showToast(`Maximum available stock is ${variant.stock}.`);
        return;
      }
    }
    setCart((prev) => prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCouponCode('');
    setCouponDiscount(0);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist');
      return next;
    });
  };

  const applyCoupon = (code: string) => {
    const res = validateCoupon(
      code,
      cartSubtotal,
      cart.map((i) => ({ productId: i.productId }))
    );
    if (res.valid) {
      setAppliedCouponCode(res.coupon!.code);
      setCouponDiscount(res.discountAmount);
      showToast(`Promo code ${res.coupon!.code} applied: -Rs. ${res.discountAmount.toLocaleString()}`);
      return { success: true, message: `Discount of Rs. ${res.discountAmount.toLocaleString()} applied!` };
    } else {
      setAppliedCouponCode('');
      setCouponDiscount(0);
      return { success: false, message: res.error || 'Invalid code' };
    }
  };

  const removeCoupon = () => {
    setAppliedCouponCode('');
    setCouponDiscount(0);
    showToast('Promo code removed');
  };

  const setDeliveryCity = (city: string) => {
    setDeliveryCityState(city);
  };

  const setDeliveryArea = (area: string) => {
    setDeliveryAreaState(area);
  };

  const checkoutOrder = async (
    customerDetails: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      area?: string;
      isManualCity?: boolean;
      province: string;
      postalCode?: string;
      notes?: string;
    },
    paymentMethod: PaymentMethodType,
    paymentProof?: PaymentProof,
    paymentDetails?: {
      isPartialPaymentSelected?: boolean;
      selectedBankAccountId?: string;
      selectedBankAccountName?: string;
    }
  ): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Your cart is empty.');
    }

    const orderInput: PlaceOrderInput = {
      customerName: customerDetails.fullName,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      shippingAddress: {
        fullName: customerDetails.fullName,
        phone: customerDetails.phone,
        email: customerDetails.email,
        address: customerDetails.address,
        city: customerDetails.city,
        area: customerDetails.area,
        isManualCity: customerDetails.isManualCity,
        province: customerDetails.province,
        postalCode: customerDetails.postalCode,
        notes: customerDetails.notes,
      },
      items: cart.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        designName: i.designName,
        clothingType: i.clothingType,
        size: i.size,
        color: i.color,
        sku: `${i.productId}-${i.size}-${i.color}`,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: cartSubtotal,
      discount: couponDiscount,
      discountCode: appliedCouponCode || undefined,
      deliveryFee,
      total: cartTotal,
      paymentMethod,
      paymentProof,
      isPartialPaymentSelected: paymentDetails?.isPartialPaymentSelected,
      selectedBankAccountId: paymentDetails?.selectedBankAccountId,
      selectedBankAccountName: paymentDetails?.selectedBankAccountName,
      notes: customerDetails.notes,
    };

    const newOrder = placeOrder(orderInput);
    clearCart();
    refreshData();
    return newOrder;
  };

  const formatPKR = (amount: number): string => {
    return `${settings.currencySymbol} ${Math.round(amount).toLocaleString()}`;
  };

  const customerLogin = async (email: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const customersStr = localStorage.getItem('revora_db_customers_v1');
      const customers: CustomerAccount[] = customersStr ? JSON.parse(customersStr) : [];
      const hash = await hashPassword(passwordPlain);
      const found = customers.find((c) => c.email.toLowerCase() === email.toLowerCase() && c.passwordHash === hash);
      if (!found) {
        return { success: false, error: 'Invalid email or password.' };
      }
      if (found.isActive === false) {
        return { success: false, error: 'This account has been deactivated. Please contact support.' };
      }
      found.lastLoginAt = new Date().toISOString();
      localStorage.setItem('revora_customer_session_v1', JSON.stringify(found));
      setCustomer(found);
      showToast(`Welcome back, ${found.fullName}!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed.' };
    }
  };

  const customerRegister = async (name: string, email: string, phone: string, passwordPlain: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const customersStr = localStorage.getItem('revora_db_customers_v1');
      const customers: CustomerAccount[] = customersStr ? JSON.parse(customersStr) : [];
      if (customers.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'An account with this email already exists.' };
      }
      const passwordHash = await hashPassword(passwordPlain);
      const newCust: CustomerAccount = {
        id: 'cust-' + Date.now(),
        email: email.trim(),
        fullName: name.trim(),
        phone: phone.trim(),
        passwordHash,
        savedAddresses: [],
        wishlistProductIds: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };
      customers.push(newCust);
      localStorage.setItem('revora_db_customers_v1', JSON.stringify(customers));
      localStorage.setItem('revora_customer_session_v1', JSON.stringify(newCust));
      setCustomer(newCust);
      showToast(`Account created successfully!`);
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed.' };
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('revora_customer_session_v1');
    setCustomer(null);
    showToast('Signed out');
  };

  const submitComplaint = async (data: {
    fullName: string;
    orderId?: string;
    phone: string;
    email: string;
    category: CustomerComplaint['category'];
    description: string;
    attachmentUrl?: string;
    attachmentName?: string;
  }): Promise<CustomerComplaint> => {
    const comp = createComplaint(data);
    refreshData();
    showToast(`Support ticket ${comp.ticketNumber} created successfully.`);
    return comp;
  };

  const requestPasswordReset = async (email: string) => {
    return requestCustomerPasswordReset(email);
  };

  const resetPasswordWithCode = async (email: string, code: string, newPasswordPlain: string) => {
    return resetCustomerPasswordWithCode(email, code, newPasswordPlain);
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        designs,
        categories,
        settings,
        policies,
        cart,
        wishlist,
        customer,
        appliedCouponCode,
        couponDiscount,
        deliveryCity,
        deliveryArea,
        deliveryFee,
        estimatedDeliveryDays,
        isFreeDelivery,
        isDeliveryRestricted,
        setDeliveryArea,
        cartSubtotal,
        cartTotal,
        advanceAmount,
        remainingBalance,
        isPartialPaymentApplicable,
        allowedPaymentMethods,
        incompatiblePaymentWarning,
        isCartOpen,
        setIsCartOpen,
        quickViewProduct,
        setQuickViewProduct,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        applyCoupon,
        removeCoupon,
        setDeliveryCity,
        checkoutOrder,
        formatPKR,
        refreshData,
        customerLogin,
        customerRegister,
        customerLogout,
        submitComplaint,
        requestPasswordReset,
        resetPasswordWithCode,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
