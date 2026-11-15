import { Restaurant, CuisineType, UserAddress, OrderRecord, FoodiNotification, UserProfile } from "../types";

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
  customerId?: string | number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: string;
  id?: string;
  token?: string;
  cookingTime?: number;
  travelTime?: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

const memoryCache = new Map<string, { timestamp: number; data: any }>();

function getCached<T>(key: string): T | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.data as T;
  }

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
  if (cached && Array.isArray(cached.categories) && cached.categories.length > 0) return cached;
  const found = getStoredRestaurants().find((r) => r.id === idOrSlug || r.slug === idOrSlug);
  if (found && Array.isArray(found.categories) && found.categories.length > 0) return found;
  return null;
}

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

export async function saveCustomerAddress(address: Partial<UserAddress>): Promise<UserAddress> {
  const res = await apiFetch<any>("/customer/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
  return res.data || res;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderRecord> {
  const res = await apiFetch<any>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const orderRecord: OrderRecord = res.order || res.data || res;

  try {
    const raw = localStorage.getItem("foodi_orders");
    const current: OrderRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [orderRecord, ...current.filter((o) => o.id !== orderRecord.id && o.token !== orderRecord.token)];
    localStorage.setItem("foodi_orders", JSON.stringify(updated));
  } catch {}

  return orderRecord;
}

export async function trackOrder(token: string): Promise<OrderRecord> {
  const res = await apiFetch<any>(`/orders/track/${token}`);
  return res.data || res.order || res;
}

export async function fetchOrders(userId?: string, phone?: string): Promise<OrderRecord[]> {
  const params = new URLSearchParams();
  if (userId) params.set("customer_id", userId);
  if (phone) params.set("phone", phone);
  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await apiFetch<any>(`/orders${qs}`);
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
  topRestaurants?: TopBudgetRestaurant[];
  meals: BudgetMeal[];
  total: number;
}

export async function fetchBudgetMeals(): Promise<BudgetMealsResponse> {
  const cacheKey = "budget_meals_all";

  try {
    const res = await apiFetch<BudgetMealsResponse>(`/meals/budget?_t=${Date.now()}`);
    if (res && res.meals) {
      setCached(cacheKey, res);
      return res;
    }
  } catch (err) {
    console.warn("Error fetching budget meals from API:", err);
  }

  const cached = getCached<BudgetMealsResponse>(cacheKey);
  if (cached && cached.meals) return cached;

  return { status: "fallback", meals: [], total: 0 };
}

export function getStoredBudgetMeals(): BudgetMealsResponse | null {
  return getCached<BudgetMealsResponse>("budget_meals_all");
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user: UserProfile & { id?: string | number };
}

export async function apiLogin(payload: {
  identifier?: string;
  email?: string;
  phone?: string;
  password?: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function apiGetProfile(id?: string | number): Promise<{ success: boolean; user: UserProfile }> {
  const qs = id ? `?id=${encodeURIComponent(id)}` : "";
  return apiFetch<{ success: boolean; user: UserProfile }>(`/auth/me${qs}`);
}

export async function apiUpdateProfile(payload: {
  id?: string | number;
  name?: string;
  phone?: string;
  phone_number?: string;
  email?: string;
}): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
  return apiFetch<{ success: boolean; message?: string; user?: UserProfile }>("/auth/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchNotifications(userId?: string | number): Promise<FoodiNotification[]> {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  try {
    const res = await apiFetch<FoodiNotification[]>(`/notifications${qs}`);
    if (Array.isArray(res) && res.length > 0) {
      localStorage.setItem("foodi_notifications", JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn("Could not fetch notifications from MySQL:", err);
  }

  try {
    const raw = localStorage.getItem("foodi_notifications");
    if (raw) return JSON.parse(raw);
  } catch {}

  return [];
}

export async function markNotificationAsRead(
  id?: string,
  all?: boolean,
  userId?: string | number
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/notifications/read", {
    method: "POST",
    body: JSON.stringify({ id, all, user_id: userId }),
  });
}

export async function createNotification(payload: {
  title: string;
  message: string;
  type?: string;
  user_id?: string | number;
}): Promise<{ success: boolean; notification?: FoodiNotification }> {
  return apiFetch<{ success: boolean; notification?: FoodiNotification }>("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface DriverApplyPayload {
  user_id?: string | number;
  full_name?: string;
  phone?: string;
  cin_number: string;
  license_number?: string;
  vehicle_type: "motorcycle" | "scooter" | "bicycle" | "car";
  vehicle_brand?: string;
  vehicle_model?: string;
  license_plate?: string;
  zone?: string;
  avatar_path?: string;
  license_photo_path?: string;
  cin_photo_path?: string;
  registration_card_path?: string;
}

export interface RestaurantApplyPayload {
  user_id?: string | number;
  name: string;
  manager_name: string;
  phone_number: string;
  email?: string;
  address: string;
  neighborhood?: string;
  cuisine?: string;
  rc_number?: string;
  ice_number?: string;
  description?: string;
  logo_path?: string;
  cover_image_path?: string;
}

export async function apiApplyDriver(payload: DriverApplyPayload): Promise<{ success: boolean; message: string; data?: any }> {
  return apiFetch<{ success: boolean; message: string; data?: any }>("/partners/driver-apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiApplyRestaurant(payload: RestaurantApplyPayload): Promise<{ success: boolean; message: string; data?: any }> {
  return apiFetch<{ success: boolean; message: string; data?: any }>("/partners/restaurant-apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPendingApplications(): Promise<{
  success: boolean;
  pendingDrivers: any[];
  pendingRestaurants: any[];
}> {
  try {
    return await apiFetch<{
      success: boolean;
      pendingDrivers: any[];
      pendingRestaurants: any[];
    }>("/admin/pending-applications");
  } catch {
    return { success: false, pendingDrivers: [], pendingRestaurants: [] };
  }
}

export async function apiUpdateApplicationStatus(
  type: "driver" | "restaurant",
  id: string | number,
  status: "active" | "suspended" | "rejected" | "approved"
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/admin/approve-application", {
    method: "POST",
    body: JSON.stringify({ type, id, status }),
  });
}
