import { Order, StoreSettings } from '../types';

export const DEFAULT_CEEPRINTO_KEY = 'cp_live_3KE409FARrwvNmjvL2afktFX.wIIOIQUOfX8OBC23ewWnRwnzgSpvFHUXI32u04IP';
export const DEFAULT_CEEPRINTO_SHOP_ID = 397;
export const CEEPRINTO_API_BASE = 'https://ceeprinto.com/wp-json/ceeprinto/v2';

export interface CeeprintoAccount {
  id: number;
  email: string;
  name: string;
  company: string;
  apiKeyName?: string;
  scopes: string[];
  fulfillmentComplete: boolean;
}

export interface CeeprintoOrderResult {
  success: boolean;
  orderId?: number;
  ceeprintoOrderId?: number;
  shopId?: number;
  status?: string;
  order?: any;
  events?: Array<{ event: string; at: string }>;
  error?: string;
  raw?: any;
}

function getAuthHeaders(apiKey?: string, idempotencyKey?: string): HeadersInit {
  const token = apiKey?.trim() || DEFAULT_CEEPRINTO_KEY;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return headers;
}

/**
 * Verify Ceeprinto credentials and fetch current account profile
 */
export async function verifyCeeprintoAccount(apiKey?: string): Promise<{
  success: boolean;
  account?: CeeprintoAccount;
  error?: string;
}> {
  try {
    const res = await fetch(`${CEEPRINTO_API_BASE}/me`, {
      method: 'GET',
      headers: getAuthHeaders(apiKey),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.message || errJson?.error?.message || `HTTP ${res.status}: Failed to authenticate with Ceeprinto`;
      return { success: false, error: msg };
    }

    const data = await res.json();
    const d = data?.data || data;

    return {
      success: true,
      account: {
        id: d.id,
        email: d.email,
        name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim(),
        company: d.company || 'Revora',
        apiKeyName: d.api_key?.name,
        scopes: d.scopes || [],
        fulfillmentComplete: Boolean(d.fulfillment_profile?.complete),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error connecting to Ceeprinto API.',
    };
  }
}

/**
 * Fetch connected shops under this Ceeprinto account
 */
export async function getCeeprintoShops(apiKey?: string): Promise<any[]> {
  try {
    const res = await fetch(`${CEEPRINTO_API_BASE}/shops`, {
      method: 'GET',
      headers: getAuthHeaders(apiKey),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch {
    return [];
  }
}

/**
 * Dispatch an order to Ceeprinto for on-demand printing and courier fulfillment
 */
export async function dispatchOrderToCeeprinto(
  order: Order,
  options?: {
    apiKey?: string;
    shopId?: number;
    settings?: StoreSettings;
  }
): Promise<CeeprintoOrderResult> {
  try {
    const apiKey = options?.apiKey || options?.settings?.ceeprintoSettings?.apiKey || DEFAULT_CEEPRINTO_KEY;
    const shopId = options?.shopId || options?.settings?.ceeprintoSettings?.shopId || DEFAULT_CEEPRINTO_SHOP_ID;

    // Split name into first and last
    const rawName = (order.customerName || order.shippingAddress.fullName || 'Customer').trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Format line items
    const line_items = order.items.map((item) => {
      const cleanType = (item.clothingType || 'APPAREL')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '-');
      const cleanSize = (item.size || 'STD').toUpperCase();
      const fallbackSku = `REV-${cleanType}-${cleanSize}`;

      // In Ceeprinto, customer_price drives COD collection
      // If the order has a remaining balance, apportion proportionally or use item price
      const priceForCod = order.remainingBalance > 0
        ? Math.round((item.price * item.quantity / (order.subtotal || 1)) * order.remainingBalance / item.quantity)
        : Math.round(item.price);

      return {
        external_sku: item.sku || fallbackSku,
        quantity: Math.max(1, item.quantity),
        customer_price: Math.max(0, priceForCod),
      };
    });

    const idempotencyKey = `revora-ord-${order.id}-${Date.now()}`;

    const payload = {
      shop_id: shopId,
      external_order_id: order.orderNumber,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        phone: order.shippingAddress.phone,
        address_1: order.shippingAddress.address,
        city: order.shippingAddress.city,
        state: order.shippingAddress.city,
        country: 'PK',
      },
      line_items,
    };

    const res = await fetch(`${CEEPRINTO_API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(apiKey, idempotencyKey),
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const issues = json?.error?.details?.issues;
      const issuesText = Array.isArray(issues) ? issues.join(' · ') : null;
      const errMsg = issuesText || json?.error?.message || json?.message || `HTTP ${res.status}: Failed to submit order to Ceeprinto`;
      return {
        success: false,
        error: errMsg,
        raw: json,
      };
    }

    const orderData = json?.data || json;
    return {
      success: true,
      orderId: orderData.id,
      ceeprintoOrderId: orderData.id,
      shopId: orderData.shop_id || shopId,
      status: orderData.status || 'received',
      order: orderData,
      raw: orderData,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network exception dispatching order to Ceeprinto.',
    };
  }
}

/**
 * Fetch status and real-time events for an existing Ceeprinto order
 */
export async function getCeeprintoOrderStatus(
  ceeprintoOrderId: number,
  apiKey?: string
): Promise<{
  success: boolean;
  status?: string;
  order?: any;
  events?: Array<{ event: string; at: string }>;
  error?: string;
}> {
  try {
    const headers = getAuthHeaders(apiKey);

    const [orderRes, eventsRes] = await Promise.all([
      fetch(`${CEEPRINTO_API_BASE}/orders/${ceeprintoOrderId}`, { headers }),
      fetch(`${CEEPRINTO_API_BASE}/orders/${ceeprintoOrderId}/events`, { headers }).catch(() => null),
    ]);

    if (!orderRes.ok) {
      return { success: false, error: `Ceeprinto order #${ceeprintoOrderId} not found.` };
    }

    const orderJson = await orderRes.json();
    const eventsJson = eventsRes && eventsRes.ok ? await eventsRes.json().catch(() => null) : null;

    const orderData = orderJson?.data || orderJson;
    const eventsData = eventsJson?.data || [];

    return {
      success: true,
      status: orderData.status,
      order: orderData,
      events: eventsData,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to fetch status from Ceeprinto.',
    };
  }
}

/**
 * Fetch blank apparel catalog from Ceeprinto
 */
export async function getCeeprintoCatalogBlanks(
  page = 1,
  perPage = 10,
  apiKey?: string
): Promise<{ success: boolean; blanks?: any[]; total?: number; error?: string }> {
  try {
    const res = await fetch(
      `${CEEPRINTO_API_BASE}/catalog/products?page=${page}&per_page=${perPage}`,
      {
        headers: getAuthHeaders(apiKey),
      }
    );
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const json = await res.json();
    return {
      success: true,
      blanks: json?.data || [],
      total: json?.meta?.total || 0,
    };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
