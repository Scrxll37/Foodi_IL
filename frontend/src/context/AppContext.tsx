import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, UserAddress, UserProfile, FoodiNotification } from "../types";
import {
  saveCustomerAddress,
  fetchCustomerAddresses,
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
  preloadBrandAssets,
  fetchNotifications,
  markNotificationAsRead,
} from "../services/api";

export interface CartConflictData {
  pendingItem: Omit<CartItem, "id">;
  currentRestaurantName: string;
  newRestaurantName: string;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">, source?: HTMLElement | { x: number; y: number } | null) => void;
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
  login: (identifier: string, details?: { name?: string; phone?: string; email?: string; role?: "client" | "driver" | "restaurant" | "admin"; id?: string | number }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  logout: () => void;
  address: UserAddress;
  saveAddress: (addr: UserAddress) => void;
  notifications: FoodiNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => Promise<void>;
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

const defaultAddr: UserAddress = {
  id: "addr_default",
  type: "apartment",
  neighborhood: "Talborjt",
  street: "Avenue Hassan II",
  city: "Agadir",
  buildingNameNumber: "Résidence Al Waha, Imm B",
  floorNumber: "3",
  doorNumber: "12",
  instructions: "Sonner à l'interphone B12",
  lat: 30.4278,
  lng: -9.5981,
  isDefault: true,
};

const DEFAULT_NOTIFICATIONS: FoodiNotification[] = [
  {
    id: "notif-1",
    title: "Bienvenue sur Foodi !",
    message: "Découvrez les meilleures enseignes d'Agadir livrées chez vous en quelques clics.",
    time: "À l'instant",
    isRead: false,
    type: "system",
  },
];

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
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [conflictData, setConflictData] = useState<CartConflictData | null>(null);

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

  const refreshNotifications = async () => {
    try {
      const notifs = await fetchNotifications(user?.id);
      if (notifs && notifs.length > 0) {
        setNotifications(notifs);
      }
    } catch {}
  };

  useEffect(() => {
    refreshNotifications();
  }, [user?.id]);

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

  const applyItemToCart = (item: Omit<CartItem, "id">, source?: HTMLElement | { x: number; y: number } | null) => {
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
    flyToCart(source);
  };

  const flyToCart = (source?: HTMLElement | { x: number; y: number } | null) => {
    if (typeof window === "undefined") return;

    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (source instanceof HTMLElement) {
      const rect = source.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    } else if (source && typeof source === "object" && "x" in source) {
      startX = source.x;
      startY = source.y;
    } else if ((window as any).event && (window as any).event.clientX) {
      startX = (window as any).event.clientX;
      startY = (window as any).event.clientY;
    }

    const cartBtn =
      document.getElementById("header-cart-btn") ||
      document.getElementById("bottom-cart-btn") ||
      document.querySelector(".foodi-header-btn[aria-label='Panier']") ||
      document.querySelector(".bottom-nav-cart-btn");

    let targetX = window.innerWidth - 60;
    let targetY = 30;

    if (cartBtn) {
      const rect = cartBtn.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    const flyer = document.createElement("div");
    flyer.style.position = "fixed";
    flyer.style.left = `${startX}px`;
    flyer.style.top = `${startY}px`;
    flyer.style.width = "32px";
    flyer.style.height = "32px";
    flyer.style.marginLeft = "-16px";
    flyer.style.marginTop = "-16px";
    flyer.style.backgroundColor = "#FF5A00";
    flyer.style.color = "#FFFFFF";
    flyer.style.borderRadius = "9999px";
    flyer.style.display = "flex";
    flyer.style.alignItems = "center";
    flyer.style.justifyContent = "center";
    flyer.style.boxShadow = "0 8px 24px rgba(255, 90, 0, 0.5)";
    flyer.style.zIndex = "99999";
    flyer.style.pointerEvents = "none";
    flyer.style.transition = "transform 0.65s cubic-bezier(0.2, 0.8, 0.25, 1), opacity 0.65s ease-in";
    flyer.style.transform = "translate3d(0, 0, 0) scale(1)";
    flyer.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

    document.body.appendChild(flyer);

    requestAnimationFrame(() => {
      const deltaX = targetX - startX;
      const deltaY = targetY - startY;
      flyer.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.35)`;
      flyer.style.opacity = "0.7";
    });

    setTimeout(() => {
      if (flyer.parentNode) {
        flyer.parentNode.removeChild(flyer);
      }
      setIsCartAnimating(true);
      setTimeout(() => {
        setIsCartAnimating(false);
      }, 700);
    }, 650);
  };

  const addToCart = (item: Omit<CartItem, "id">, source?: HTMLElement | { x: number; y: number } | null) => {
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

    applyItemToCart(item, source);
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
    flyToCart();
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
    details?: { name?: string; phone?: string; email?: string; role?: "client" | "driver" | "restaurant" | "admin"; id?: string | number }
  ) => {
    localStorage.removeItem("foodi_restaurant_session");
    sessionStorage.clear();
    const isPhone = identifier.includes("+") || /^\d+$/.test(identifier.replace(/\s+/g, ""));
    const updated: UserProfile = {
      id: details?.id,
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
    markNotificationAsRead(id, false, user?.id).catch((err) => {
      console.warn("Could not mark notification read in MySQL:", err);
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markNotificationAsRead(undefined, true, user?.id).catch((err) => {
      console.warn("Could not mark all notifications read in MySQL:", err);
    });
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
        markAllNotificationsRead,
        refreshNotifications,
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
