import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, UserAddress, UserProfile, FoodiNotification } from "../types";
import initialAddresses from "../data/addresses.json";
import initialNotifications from "../data/notifications.json";
import {
  saveCustomerAddress,
  fetchCustomerAddresses,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  preloadBrandAssets,
} from "../services/api";

export interface CartConflictData {
  pendingItem: Omit<CartItem, "id">;
  currentRestaurantName: string;
  newRestaurantName: string;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCartAnimating: boolean;
  isNotifOpen: boolean;
  setIsNotifOpen: (open: boolean) => void;
  user: UserProfile;
  login: (identifier: string, details?: { name?: string; phone?: string; email?: string; role?: "client" | "driver" | "restaurant" | "admin" }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  address: UserAddress;
  saveAddress: (addr: UserAddress) => void;
  notifications: FoodiNotification[];
  markNotificationRead: (id: string) => void;
  conflictData: CartConflictData | null;
  confirmConflictReplace: () => void;
  cancelConflict: () => void;
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultGuestUser: UserProfile = {
  name: "",
  phone: "",
  email: "",
  isLoggedIn: false
};

const defaultAddr: UserAddress = initialAddresses[0] as UserAddress;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("foodi_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const isAuth = localStorage.getItem("foodi_authenticated");
      if (isAuth === "true") {
        const stored = localStorage.getItem("foodi_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.isLoggedIn) {
            return parsed;
          }
        }
      }
      // Fallback check in session cookie
      const cookieUser = getSessionCookie();
      if (cookieUser && cookieUser.isLoggedIn) {
        return cookieUser;
      }
      return defaultGuestUser;
    } catch {
      return defaultGuestUser;
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("foodi_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [address, setAddress] = useState<UserAddress>(() => {
    try {
      const stored = localStorage.getItem("foodi_address");
      return stored ? JSON.parse(stored) : defaultAddr;
    } catch {
      return defaultAddr;
    }
  });

  const [notifications, setNotifications] = useState<FoodiNotification[]>(() => {
    try {
      const stored = localStorage.getItem("foodi_notifications");
      return stored ? JSON.parse(stored) : initialNotifications;
    } catch {
      return initialNotifications as FoodiNotification[];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [conflictData, setConflictData] = useState<CartConflictData | null>(null);

  // Preload critical assets and sync saved addresses from backend on mount
  useEffect(() => {
    preloadBrandAssets();
    fetchCustomerAddresses()
      .then((addresses) => {
        if (addresses && addresses.length > 0) {
          const def = addresses.find((a) => a.isDefault) || addresses[0];
          setAddress(def);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const isFavorite = (slug: string) => favorites.includes(slug);

  useEffect(() => {
    localStorage.setItem("foodi_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user.isLoggedIn) {
      localStorage.setItem("foodi_user", JSON.stringify(user));
      localStorage.setItem("foodi_authenticated", "true");
      setSessionCookie(user);
    } else {
      localStorage.removeItem("foodi_user");
      localStorage.removeItem("foodi_authenticated");
      clearSessionCookie();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("foodi_address", JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    localStorage.setItem("foodi_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const applyItemToCart = (item: Omit<CartItem, "id">) => {
    const existingIndex = cart.findIndex(
      (c) =>
        c.dishId === item.dishId &&
        JSON.stringify(c.selectedOptions || {}) === JSON.stringify(item.selectedOptions || {})
    );

    if (existingIndex > -1) {
      setCart((prev) =>
        prev.map((c, idx) =>
          idx === existingIndex ? { ...c, quantity: c.quantity + item.quantity } : c
        )
      );
    } else {
      const newItem: CartItem = {
        ...item,
        id: `${item.dishId}-${Date.now()}`
      };
      setCart((prev) => [...prev, newItem]);
    }
    setIsCartAnimating(true);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 700);
  };

  const addToCart = (item: Omit<CartItem, "id">) => {
    if (!user.isLoggedIn) {
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${currentUrl}`;
      return;
    }

    if (cart.length > 0 && cart[0].restaurantId && item.restaurantId && cart[0].restaurantId !== item.restaurantId) {
      setConflictData({
        pendingItem: item,
        currentRestaurantName: cart[0].restaurantName || "le restaurant actuel",
        newRestaurantName: item.restaurantName || "le nouveau restaurant"
      });
      return;
    }

    applyItemToCart(item);
  };

  const confirmConflictReplace = () => {
    if (!conflictData) return;
    const itemToInsert = conflictData.pendingItem;
    const newItem: CartItem = {
      ...itemToInsert,
      id: `${itemToInsert.dishId}-${Date.now()}`
    };
    setCart([newItem]);
    setConflictData(null);
    setIsCartAnimating(true);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 700);
  };

  const cancelConflict = () => {
    setConflictData(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = (
    identifier: string,
    details?: { name?: string; phone?: string; email?: string; role?: "client" | "driver" | "restaurant" | "admin" }
  ) => {
    localStorage.removeItem("foodi_restaurant_session");
    sessionStorage.clear();
    const isPhone = identifier.includes("+") || /^\d+$/.test(identifier.replace(/\s+/g, ""));
    const updated: UserProfile = {
      name: details?.name || "Fayçal Agadir",
      email: details?.email || (isPhone ? "faycal@foodi.ma" : identifier),
      phone: details?.phone || (isPhone ? identifier : "+212 6 12 34 56 78"),
      role: details?.role || "client",
      isLoggedIn: true
    };
    localStorage.setItem("foodi_authenticated", "true");
    localStorage.setItem("foodi_user", JSON.stringify(updated));
    setUser(updated);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem("foodi_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("foodi_authenticated");
    localStorage.removeItem("foodi_user");
    localStorage.removeItem("foodi_restaurant_session");
    sessionStorage.clear();
    setUser(defaultGuestUser);
    setCart([]);
  };

  const saveAddress = (addr: UserAddress) => {
    setAddress(addr);
    try {
      localStorage.setItem("foodi_address", JSON.stringify(addr));
    } catch {}
    saveCustomerAddress(addr).catch((err) => {
      console.warn("Could not sync address to server:", err);
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        isCartAnimating,
        isNotifOpen,
        setIsNotifOpen,
        user,
        login,
        updateProfile,
        logout,
        address,
        saveAddress,
        notifications,
        markNotificationRead,
        conflictData,
        confirmConflictReplace,
        cancelConflict,
        favorites,
        toggleFavorite,
        isFavorite
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
