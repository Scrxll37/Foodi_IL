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
}

export interface MenuCategory {
  id: string;
  name: string;
  dishes: Dish[];
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
  badge?: string;
  isPromo?: boolean;
  promoLabel?: string;
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
}

export interface FoodiNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "order" | "promo" | "system";
}

export interface OrderRecord {
  id: string;
  restaurantName: string;
  restaurantLogo: string;
  neighborhood: string;
  date: string;
  status: "in_prep" | "in_delivery" | "delivered";
  statusLabel: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    options?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
}
