import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, UserAddress, UserProfile, FoodiNotification } from "../types";
import initialAddresses from "../data/addresses.json";
import initialNotifications from "../data/notifications.json";

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
  isNotifOpen: boolean;
  setIsNotifOpen: (open: boolean) => void;
  user: UserProfile;
  login: (identifier: string, details?: { name?: string; phone?: string; email?: string }) => void;
  logout: () => void;
  address: UserAddress;
  saveAddress: (addr: UserAddress) => void;
  notifications: FoodiNotification[];
  markNotificationRead: (id: string) => void;
  conflictData: CartConflictData | null;
  confirmConflictReplace: () => void;
  cancelConflict: () => void;
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
      return defaultGuestUser;
    } catch {
      return defaultGuestUser;
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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [conflictData, setConflictData] = useState<CartConflictData | null>(null);

  useEffect(() => {
    localStorage.setItem("foodi_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("foodi_user", JSON.stringify(user));
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
    setIsCartOpen(true);
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
    setIsCartOpen(true);
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

  const login = (identifier: string, details?: { name?: string; phone?: string; email?: string }) => {
    const isPhone = identifier.includes("+") || /^\d+$/.test(identifier.replace(/\s+/g, ""));
    const updated: UserProfile = {
      name: details?.name || "Fayçal Agadir",
      email: details?.email || (isPhone ? "faycal@foodi.ma" : identifier),
      phone: details?.phone || (isPhone ? identifier : "+212 6 12 34 56 78"),
      isLoggedIn: true
    };
    localStorage.setItem("foodi_authenticated", "true");
    setUser(updated);
  };

  const logout = () => {
    localStorage.removeItem("foodi_authenticated");
    localStorage.removeItem("foodi_user");
    setUser(defaultGuestUser);
    setCart([]);
  };

  const saveAddress = (addr: UserAddress) => {
    setAddress(addr);
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
        isNotifOpen,
        setIsNotifOpen,
        user,
        login,
        logout,
        address,
        saveAddress,
        notifications,
        markNotificationRead,
        conflictData,
        confirmConflictReplace,
        cancelConflict
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
