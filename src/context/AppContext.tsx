import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, UserAddress, UserProfile, FoodiNotification } from "../types";
import initialAddresses from "../data/addresses.json";
import initialNotifications from "../data/notifications.json";

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
  login: (identifier: string) => void;
  logout: () => void;
  address: UserAddress;
  saveAddress: (addr: UserAddress) => void;
  notifications: FoodiNotification[];
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: UserProfile = {
  name: "Fayçal Agadir",
  phone: "+212 6 12 34 56 78",
  email: "faycal@foodi.ma",
  isLoggedIn: true
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
      const stored = localStorage.getItem("foodi_user");
      return stored ? JSON.parse(stored) : defaultUser;
    } catch {
      return defaultUser;
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

  const addToCart = (item: Omit<CartItem, "id">) => {
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

  const login = (identifier: string) => {
    const isPhone = identifier.includes("+") || /^\d+$/.test(identifier.replace(/\s+/g, ""));
    const updated: UserProfile = {
      name: "Client Foodi",
      email: isPhone ? "client@foodi.ma" : identifier,
      phone: isPhone ? identifier : "+212 6 00 00 00 00",
      isLoggedIn: true
    };
    setUser(updated);
  };

  const logout = () => {
    setUser({
      name: "",
      phone: "",
      email: "",
      isLoggedIn: false
    });
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
        markNotificationRead
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
