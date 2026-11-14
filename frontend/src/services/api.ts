import { Restaurant, CuisineType, UserAddress, OrderRecord } from "../types";

// In development, Vite proxy forwards /api to http://127.0.0.1:8000
const API_BASE_URL = "/api";

export const DEFAULT_TARIFS: PlatformTarifs = {
  pricePerKm: 4,
  minDeliveryFee: 8,
  smallOrderThreshold: 50,
  smallOrderFee: 5,
  defaultCommissionRate: 15,
  serviceStatus: "active",
  currency: "MAD",
  supportPhone: "+212 5 28 84 92 10",
  supportEmail: "supervision@foodi.ma",
};

export interface PlatformTarifs {
  pricePerKm: number;
  minDeliveryFee: number;
  smallOrderThreshold: number;
  smallOrderFee: number;
  defaultCommissionRate: number;
  serviceStatus: string;
  currency: string;
  supportPhone: string;
  supportEmail: string;
}

export interface CreateOrderPayload {
  restaurantId?: string | number;
  restaurantName?: string;
  branchId?: string | number | null;
  items: {
    dishId?: string | number;
    name: string;
    price: number;
    quantity: number;
    selectedOptions?: Record<string, string>;
    options?: string;
    image?: string;
  }[];
  address?: {
    neighborhood?: string;
    street?: string;
    buildingNameNumber?: string;
    floorNumber?: string;
    doorNumber?: string;
    instructions?: string;
    lat?: number;
    lng?: number;
  } | string;
  neighborhood?: string;
  street?: string;
  buildingNameNumber?: string;
  floorNumber?: string;
  doorNumber?: string;
  instructions?: string;
  lat?: number;
  lng?: number;
  deliveryFee?: number;
  subtotal?: number;
  total?: number;
  tipAmount?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  id?: string;
  token?: string;
  cookingTime?: number;
  travelTime?: number;
}

// Client-side cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Memory cache for instant tab switches
const memoryCache = new Map<string, { timestamp: number; data: any }>();

function getCached<T>(key: string): T | null {
  // 1. Check in-memory
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data as T;
  }

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem(`foodi_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        memoryCache.set(key, parsed);
        return parsed.data as T;
      }
    }
  } catch {}

  return null;
}

function setCached<T>(key: string, data: T): void {
  const payload = { timestamp: Date.now(), data };
  memoryCache.set(key, payload);
  try {
    localStorage.setItem(`foodi_cache_${key}`, JSON.stringify(payload));
  } catch {}
}

/**
 * Universal JSON Fetcher with error handling
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 1. Fetch Tarifs and Platform Settings
 */
export async function fetchTarifs(forceRefresh = false): Promise<PlatformTarifs> {
  const cacheKey = "tarifs";
  try {
    const data = await apiFetch<PlatformTarifs>("/settings/tarifs");
    setCached(cacheKey, data);
    return data;
  } catch (err) {
    console.warn("Using fallback pricing:", err);
  }

  const cached = getCached<PlatformTarifs>(cacheKey);
  if (cached) return cached;

  return DEFAULT_TARIFS;
}

/**
 * 2. Fetch Cuisines list (Always queries DB for fresh state, falls back to cache)
 */
export async function fetchCuisines(forceRefresh = false): Promise<CuisineType[]> {
  const cacheKey = "cuisines";
  try {
    const res = await apiFetch<any>("/cuisines");
    const data = Array.isArray(res) ? res : (res.data || []);
    if (data.length > 0) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn("Using cached cuisines:", err);
  }

  const cached = getCached<CuisineType[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  return [];
}

export function getStoredCuisines(): CuisineType[] {
  const cached = getCached<CuisineType[]>("cuisines");
  if (cached && cached.length > 0) return cached;
  return [];
}

/**
 * 3. Fetch Restaurants list (Always queries DB for fresh state, falls back to cache)
 */
export async function fetchRestaurants(params?: {
  q?: string;
  cuisine?: string;
  neighborhood?: string;
  forceRefresh?: boolean;
}): Promise<Restaurant[]> {
  const isFiltered = Boolean(params?.q || params?.cuisine || params?.neighborhood);
  const cacheKey = isFiltered
    ? `restaurants_${params?.q || ""}_${params?.cuisine || ""}_${params?.neighborhood || ""}`
    : "restaurants_all";

  try {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.cuisine) query.set("cuisine", params.cuisine);
    if (params?.neighborhood) query.set("neighborhood", params.neighborhood);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiFetch<any>(`/restaurants${qs}`);
    const data = Array.isArray(res) ? res : (res.data || []);

    if (data.length > 0) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn("Using cached restaurants:", err);
  }

  const cached = getCached<Restaurant[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  return [];
}

export function getStoredRestaurants(): Restaurant[] {
  const cached = getCached<Restaurant[]>("restaurants_all");
  if (cached && cached.length > 0) return cached;
  return [];
}

/**
 * 4. Fetch Single Restaurant with Menu & Dishes (Always queries DB, updates cache)
 */
export async function fetchRestaurant(idOrSlug: string, forceRefresh = false): Promise<Restaurant | null> {
  const cacheKey = `restaurant_${idOrSlug}`;

  try {
    const res = await apiFetch<any>(`/restaurants/${idOrSlug}`);
    const data = res.data || res.restaurant || res;
    if (data && data.name) {
      setCached(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn("Using cached restaurant detail:", err);
  }

  const cached = getCached<Restaurant>(cacheKey);
  if (cached) return cached;

  const found = getStoredRestaurants().find(
    (r) => r.id === idOrSlug || r.slug === idOrSlug
  );
  return found || null;
}

export function getStoredRestaurant(idOrSlug: string): Restaurant | null {
  const cached = getCached<Restaurant>(`restaurant_${idOrSlug}`);
  if (cached) return cached;
  return getStoredRestaurants().find((r) => r.id === idOrSlug || r.slug === idOrSlug) || null;
}

/**
 * 5. Fetch Customer Saved Addresses
 */
export async function fetchCustomerAddresses(): Promise<UserAddress[]> {
  try {
    const res = await apiFetch<any>("/customer/addresses");
    const data = Array.isArray(res) ? res : (res.data || []);
    if (data.length > 0) {
      localStorage.setItem("foodi_saved_addresses", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Using local cached addresses:", err);
  }

  try {
    const stored = localStorage.getItem("foodi_saved_addresses");
    if (stored) return JSON.parse(stored);
  } catch {}

  return [];
}

/**
 * 6. Save Customer Address
 */
export async function saveCustomerAddress(address: Partial<UserAddress>): Promise<UserAddress> {
  const res = await apiFetch<any>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
  return res.data || res;
}

/**
 * 7. Place a Customer Order (Inserts into MySQL)
 */
export async function createOrder(payload: CreateOrderPayload): Promise<OrderRecord> {
  const res = await apiFetch<any>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const orderRecord: OrderRecord = res.order || res.data || res;

  // Persist order in local storage list for customer history
  try {
    const raw = localStorage.getItem("foodi_orders");
    const current: OrderRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [orderRecord, ...current.filter((o) => o.id !== orderRecord.id && o.token !== orderRecord.token)];
    localStorage.setItem("foodi_orders", JSON.stringify(updated));
  } catch {}

  return orderRecord;
}

/**
 * 8. Real-time Order Tracking by Token
 */
export async function trackOrder(token: string): Promise<OrderRecord> {
  const res = await apiFetch<any>(`/orders/track/${token}`);
  return res.data || res.order || res;
}

/**
 * 9. Fetch All Orders (Customer history)
 */
export async function fetchOrders(): Promise<OrderRecord[]> {
  try {
    const res = await apiFetch<any>("/orders");
    const orders: OrderRecord[] = Array.isArray(res) ? res : (res.data || []);
    if (orders.length > 0) {
      localStorage.setItem("foodi_orders", JSON.stringify(orders));
      return orders;
    }
  } catch (err) {
    console.warn("Using local orders list:", err);
  }

  try {
    const raw = localStorage.getItem("foodi_orders");
    if (raw) return JSON.parse(raw);
  } catch {}

  return [];
}

/**
 * 10. Update Order Status (Syncs to MySQL orders and deliveries table)
 */
export async function updateOrderStatus(payload: {
  id?: string;
  token?: string;
  status: string;
  courierId?: string | number;
  courierName?: string;
  courierPhone?: string;
  courierLat?: number;
  courierLng?: number;
  notes?: string;
}): Promise<OrderRecord> {
  const res = await apiFetch<any>("/orders/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const updated: OrderRecord = res.order || res.data || res;
  try {
    const raw = localStorage.getItem("foodi_orders");
    if (raw) {
      const list: OrderRecord[] = JSON.parse(raw);
      const replaced = list.map((o) => (o.id === updated.id || o.token === updated.token ? { ...o, ...updated } : o));
      localStorage.setItem("foodi_orders", JSON.stringify(replaced));
    }
  } catch {}

  return updated;
}

/**
 * 11. Session Cookie Helpers
 */
export function setSessionCookie(user: any): void {
  if (typeof document === "undefined") return;
  const cookieVal = encodeURIComponent(JSON.stringify(user));
  document.cookie = `foodi_session=${cookieVal}; path=/; max-age=604800; SameSite=Lax`;
}

export function getSessionCookie(): any | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)foodi_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "foodi_session=; path=/; max-age=0";
}

/**
 * 12. Preload and Cache Critical Brand Logos to eliminate latency
 */
export function preloadBrandAssets(): void {
  if (typeof window === "undefined") return;
  const criticalLogos = [
    "/images/logohor.png",
    "/images/logo.png",
    "/images/restaurants/McDonalds.png",
    "/images/restaurants/KFC.jpg",
    "/images/restaurants/PIZZAHUT.png",
    "/images/restaurants/burger-king.png",
    "/images/restaurants/mistercook.png",
    "/images/restaurants/otacos.png",
    "/images/restaurants/bella-napoli.jpg",
    "/images/restaurants/wok-to-walk.png",
    "/images/cuisines/bigmac.png",
  ];

  criticalLogos.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/**
 * 13. Budget Meals & Top 3 Restaurants (< 50 MAD)
 */
export interface BudgetMeal {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  original_price?: number | null;
  image_path: string;
  is_popular?: boolean;
  is_featured?: boolean;
  restaurant: {
    id?: string | number;
    name: string;
    slug: string;
    logo_path: string;
    base_delivery_fee: number;
    rating_cache?: number;
  };
}

export interface TopBudgetRestaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  rating: number;
  deliveryFee: number;
  mealsCount: number;
}

export interface BudgetMealsResponse {
  status: string;
  topRestaurants: TopBudgetRestaurant[];
  meals: BudgetMeal[];
  total: number;
}

export async function fetchBudgetMeals(restaurantSlug?: string): Promise<BudgetMealsResponse> {
  const cacheKey = restaurantSlug && restaurantSlug !== "all" ? `budget_meals_${restaurantSlug}` : "budget_meals_all";
  const query = restaurantSlug && restaurantSlug !== "all" ? `?restaurant=${encodeURIComponent(restaurantSlug)}` : "";

  try {
    const res = await apiFetch<BudgetMealsResponse>(`/meals/budget${query}`);
    if (res && res.meals) {
      setCached(cacheKey, res);
      return res;
    }
  } catch (err) {
    console.warn("Error fetching budget meals from API:", err);
  }

  const cached = getCached<BudgetMealsResponse>(cacheKey);
  if (cached && cached.meals) return cached;

  return { status: "fallback", topRestaurants: [], meals: [], total: 0 };
}

export function getStoredBudgetMeals(restaurantSlug?: string): BudgetMealsResponse | null {
  const cacheKey = restaurantSlug && restaurantSlug !== "all" ? `budget_meals_${restaurantSlug}` : "budget_meals_all";
  return getCached<BudgetMealsResponse>(cacheKey);
}


