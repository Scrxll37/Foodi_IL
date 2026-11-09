export interface DishOption {
  drinks?: string[];
  sides?: string[];
  sauces?: string[];
  viandes?: string[];
  pâte?: string[];
  taille?: string[];
  supplements?: string[];
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  image: string;
  isPopular?: boolean;
  hasOptions?: boolean;
  options?: DishOption;
  isAvailable?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  dishes: Dish[];
}

export interface CuisineType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
}

export interface RestaurantBranch {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  logo?: string;
  isOpen?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  cover: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  cuisineSlug: string;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  neighborhood: string;
  address: string;
  phone?: string;
  lat?: number;
  lng?: number;
  avgPrepMinutes?: number;
  branches?: RestaurantBranch[];
  badge?: string;
  isPromo?: boolean;
  promoLabel?: string;
  isOpen?: boolean;
  openingTime?: string;
  closingTime?: string;
  autoAcceptOrders?: boolean;
  categories: MenuCategory[];
}

export interface CartItem {
  id: string;
  dishId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface UserAddress {
  id: string;
  type: "apartment" | "house" | "office" | "other";
  neighborhood: string;
  street: string;
  city: "Agadir";
  lat: number;
  lng: number;
  buildingNameNumber: string;
  floorNumber: string;
  doorNumber: string;
  instructions: string;
  isDefault: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
  role?: "client" | "driver" | "restaurant" | "admin";
  notifyTracking?: boolean;
  notifyPromos?: boolean;
  notifyEmail?: boolean;
}

export interface FoodiNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "order" | "promo" | "system";
}

export type OrderStatus =
  | "pending_confirmation"
  | "accepted"
  | "preparing"
  | "in_prep"
  | "searching_driver"
  | "heading_to_restaurant"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

export interface OrderRecord {
  id: string;
  token?: string;
  restaurantName: string;
  restaurantLogo: string;
  neighborhood: string;
  shopNeighborhood?: string;
  shopBranchName?: string;
  branchId?: string;
  buildingNameNumber?: string;
  floorNumber?: string;
  doorNumber?: string;
  street?: string;
  date: string;
  deliveredAt?: string;
  status: OrderStatus;
  statusLabel: string;
  cookingTime?: number;
  travelTime?: number;
  totalTime?: number;
  arrivalTime?: string;
  courierName?: string;
  courierPhone?: string;
  customerName?: string;
  customerPhone?: string;
  shopLat?: number;
  shopLng?: number;
  courierLat?: number;
  courierLng?: number;
  lat?: number;
  lng?: number;
  instructions?: string;
  paymentMethod?: "card" | "cash";
  paymentLabel?: string;
  createdAt?: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    options?: string;
    image?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  mealImage?: string;
}
