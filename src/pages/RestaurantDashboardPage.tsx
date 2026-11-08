import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Restaurant, OrderRecord, Dish, MenuCategory, RestaurantBranch } from "../types";
import defaultRestaurants from "../data/restaurants.json";
import defaultOrders from "../data/orders.json";
import "../styles/restaurant.css";

interface ManagerSession {
  email: string;
  restaurantId: string;
  restaurantName: string;
  managerName: string;
}

const DEMO_ACCOUNTS = [
  { email: "mcdo@foodi.ma", password: "123", restaurantId: "mcdonalds", name: "Gérant McDonald's" },
  { email: "kfc@foodi.ma", password: "123", restaurantId: "kfc", name: "Gérant KFC" },
  { email: "pizzahut@foodi.ma", password: "123", restaurantId: "pizza-hut", name: "Gérant Pizza Hut" },
  { email: "crusty@foodi.ma", password: "123", restaurantId: "crusty", name: "Gérant Crusty" },
  { email: "mistercook@foodi.ma", password: "123", restaurantId: "mister-cook", name: "Gérant Mister Cook" }
];

const AGADIR_POPULAR_ZONES = [
  { name: "Adrar Kitea", neighborhood: "Adrar", lat: 30.41525, lng: -9.542625 },
  { name: "Drive Hassan II", neighborhood: "Centre Ville", lat: 30.412495, lng: -9.595213 },
  { name: "Agadir Plage", neighborhood: "Front de Mer", lat: 30.4167, lng: -9.6000 },
  { name: "Marjane Founty", neighborhood: "Founty", lat: 30.39673, lng: -9.58139 },
  { name: "Dakhla", neighborhood: "Dakhla", lat: 30.4048, lng: -9.5632 },
  { name: "Talborjt", neighborhood: "Talborjt", lat: 30.4241, lng: -9.5982 },
  { name: "Hay Salam", neighborhood: "Hay Salam", lat: 30.4025, lng: -9.5512 }
];

export const RestaurantDashboardPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const saved = localStorage.getItem("foodi_restaurants");
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultRestaurants as Restaurant[];
  });

  const [session, setSession] = useState<ManagerSession | null>(() => {
    try {
      const stored = localStorage.getItem("foodi_restaurant_session");
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      email: "mcdo@foodi.ma",
      restaurantId: "mcdonalds",
      restaurantName: "McDonald's",
      managerName: "Gérant McDonald's"
    };
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("mcdo@foodi.ma");
  const [loginPassword, setLoginPassword] = useState<string>("123");
  const [loginError, setLoginError] = useState<string | null>(null);

  const activeRestaurantId = session ? session.restaurantId : "mcdonalds";

  const currentRestaurant = useMemo(() => {
    const found = restaurants.find(
      (r) => r.id === activeRestaurantId || r.slug === activeRestaurantId
    );
    return found || restaurants[0] || (defaultRestaurants[0] as Restaurant);
  }, [restaurants, activeRestaurantId]);

  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "hours" | "profile">("orders");
  const [orderFilter, setOrderFilter] = useState<"pending" | "kitchen" | "ready" | "completed" | "cancelled">("pending");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const [headerProfileOpen, setHeaderProfileOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [managerForm, setManagerForm] = useState({
    name: session ? session.managerName : "Gérant McDonald's",
    email: session ? session.email : "mcdo@foodi.ma",
    newPassword: "",
    confirmPassword: ""
  });

  const [autoAccept, setAutoAccept] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`foodi_auto_accept_${activeRestaurantId}`);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return currentRestaurant.autoAcceptOrders ?? true;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderRecord | null>(null);
  const [driverModalOrder, setDriverModalOrder] = useState<OrderRecord | null>(null);
  const [verifyCodeModalOrder, setVerifyCodeModalOrder] = useState<OrderRecord | null>(null);
  const [courierInputCode, setCourierInputCode] = useState<string>("");
  const [codeVerificationError, setCodeVerificationError] = useState<string | null>(null);

  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>("all");
  const [dishModalMode, setDishModalMode] = useState<"add" | "edit" | null>(null);
  const [editingDish, setEditingDish] = useState<{
    categoryId: string;
    dish: Dish;
  } | null>(null);
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    price: 0,
    promoPrice: 0,
    image: "",
    categoryId: ""
  });
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState<boolean>(false);
  const [editCategoryName, setEditCategoryName] = useState<string>("");

  const [branchModalMode, setBranchModalMode] = useState<"add" | "edit" | null>(null);
  const [branchWizardStep, setBranchWizardStep] = useState<1 | 2 | 3>(1);
  const [editingBranch, setEditingBranch] = useState<RestaurantBranch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    neighborhood: "Adrar",
    address: "Agadir, Maroc",
    phone: "05 28 22 33 44",
    logo: "",
    lat: 30.41525,
    lng: -9.542625,
    isOpen: true
  });

  const branchMapContainerRef = useRef<HTMLDivElement | null>(null);
  const branchMapInstanceRef = useRef<L.Map | null>(null);
  const branchMarkerRef = useRef<L.Marker | null>(null);
  const branchLogoInputRef = useRef<HTMLInputElement>(null);

  const profileBranchesMapContainerRef = useRef<HTMLDivElement | null>(null);
  const profileBranchesMapInstanceRef = useRef<L.Map | null>(null);
  const profileBranchesMarkersRef = useRef<L.Marker[]>([]);

  const [customBannerUrl, setCustomBannerUrl] = useState<string>("");

  const dishFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [hoursForm, setHoursForm] = useState({
    isOpen: currentRestaurant.isOpen ?? true,
    openingTime: currentRestaurant.openingTime || "11:00",
    closingTime: currentRestaurant.closingTime || "23:30",
    avgPrepMinutes: currentRestaurant.avgPrepMinutes || 20,
    minOrder: currentRestaurant.minOrder || 40
  });

  const [profileForm, setProfileForm] = useState({
    name: currentRestaurant.name,
    cuisine: currentRestaurant.cuisine,
    neighborhood: currentRestaurant.neighborhood,
    address: currentRestaurant.address,
    phone: currentRestaurant.phone || "05 28 84 92 10",
    cover: currentRestaurant.cover,
    logo: currentRestaurant.logo
  });

  useEffect(() => {
    setHoursForm({
      isOpen: currentRestaurant.isOpen ?? true,
      openingTime: currentRestaurant.openingTime || "11:00",
      closingTime: currentRestaurant.closingTime || "23:30",
      avgPrepMinutes: currentRestaurant.avgPrepMinutes || 20,
      minOrder: currentRestaurant.minOrder || 40
    });
    setProfileForm({
      name: currentRestaurant.name,
      cuisine: currentRestaurant.cuisine,
      neighborhood: currentRestaurant.neighborhood,
      address: currentRestaurant.address,
      phone: currentRestaurant.phone || "05 28 84 92 10",
      cover: currentRestaurant.cover,
      logo: currentRestaurant.logo
    });
    try {
      const saved = localStorage.getItem(`foodi_auto_accept_${currentRestaurant.id}`);
      if (saved !== null) {
        setAutoAccept(JSON.parse(saved));
      } else {
        setAutoAccept(currentRestaurant.autoAcceptOrders ?? true);
      }
    } catch {}
  }, [currentRestaurant]);

  useEffect(() => {
    if (session) {
      setManagerForm({
        name: session.managerName,
        email: session.email,
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setHeaderProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createBranchIcon = useCallback((name: string, logoUrl?: string) => {
    const finalLogo = logoUrl || currentRestaurant.logo || "/images/restaurants/McDonalds.png";
    return L.divIcon({
      className: "foodi-map-marker-pin",
      html: `
        <div class="foodi-marker-bubble restaurant">${name}</div>
        <div class="foodi-marker-icon-box restaurant" style="background-color: #FF7A00; overflow: hidden; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <img src="${finalLogo}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.src='/images/restaurants/McDonalds.png'" />
        </div>
      `,
      iconSize: [120, 56],
      iconAnchor: [60, 56]
    });
  }, [currentRestaurant.logo]);

  useEffect(() => {
    if (activeTab !== "profile") {
      if (profileBranchesMapInstanceRef.current) {
        profileBranchesMapInstanceRef.current.remove();
        profileBranchesMapInstanceRef.current = null;
        profileBranchesMarkersRef.current = [];
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!profileBranchesMapContainerRef.current) return;

      if (profileBranchesMapInstanceRef.current) {
        profileBranchesMapInstanceRef.current.remove();
        profileBranchesMapInstanceRef.current = null;
        profileBranchesMarkersRef.current = [];
      }

      const branches = currentRestaurant.branches || [];
      const defaultCenter: [number, number] = branches.length > 0 && branches[0].lat && branches[0].lng
        ? [branches[0].lat, branches[0].lng]
        : [30.41525, -9.542625];

      const map = L.map(profileBranchesMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView(defaultCenter, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const markers: L.Marker[] = [];
      const latLngs: [number, number][] = [];

      branches.forEach((b) => {
        if (!b.lat || !b.lng) return;
        latLngs.push([b.lat, b.lng]);

        const marker = L.marker([b.lat, b.lng], {
          icon: createBranchIcon(b.name, b.logo || currentRestaurant.logo)
        }).addTo(map);

        const popupDiv = document.createElement("div");
        popupDiv.style.padding = "4px";
        popupDiv.innerHTML = `
          <div style="font-weight: 800; font-size: 13px; color: #0D0D0F; margin-bottom: 2px;">${b.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">📍 ${b.neighborhood} — ${b.address}</div>
          ${b.phone ? `<div style="font-size: 11px; color: #FF7A00; font-weight: 700;">📞 ${b.phone}</div>` : ""}
        `;
        marker.bindPopup(popupDiv);
        markers.push(marker);
      });

      profileBranchesMapInstanceRef.current = map;
      profileBranchesMarkersRef.current = markers;

      if (latLngs.length > 1) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 120);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (profileBranchesMapInstanceRef.current) {
        profileBranchesMapInstanceRef.current.remove();
        profileBranchesMapInstanceRef.current = null;
        profileBranchesMarkersRef.current = [];
      }
    };
  }, [activeTab, currentRestaurant.branches, currentRestaurant.logo, createBranchIcon]);

  const handleFocusBranchOnMap = useCallback((branch: RestaurantBranch) => {
    if (profileBranchesMapInstanceRef.current) {
      profileBranchesMapInstanceRef.current.flyTo([branch.lat, branch.lng], 16, {
        duration: 1.2
      });
      const idx = currentRestaurant.branches?.findIndex((b) => b.id === branch.id) ?? -1;
      if (idx !== -1 && profileBranchesMarkersRef.current[idx]) {
        profileBranchesMarkersRef.current[idx].openPopup();
      }
      profileBranchesMapContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentRestaurant.branches]);

  const handleRecenterBranchesMap = useCallback(() => {
    if (!profileBranchesMapInstanceRef.current) return;
    const branches = currentRestaurant.branches || [];
    const latLngs = branches.filter((b) => b.lat && b.lng).map((b) => [b.lat, b.lng] as [number, number]);
    if (latLngs.length > 1) {
      profileBranchesMapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 15 });
    } else if (latLngs.length === 1) {
      profileBranchesMapInstanceRef.current.flyTo(latLngs[0], 14);
    } else {
      profileBranchesMapInstanceRef.current.flyTo([30.41525, -9.542625], 13);
    }
  }, [currentRestaurant.branches]);

  useEffect(() => {
    if (!branchModalMode || branchWizardStep !== 2) {
      if (branchMapInstanceRef.current) {
        branchMapInstanceRef.current.remove();
        branchMapInstanceRef.current = null;
        branchMarkerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!branchMapContainerRef.current) return;

      if (branchMapInstanceRef.current) {
        branchMapInstanceRef.current.remove();
        branchMapInstanceRef.current = null;
        branchMarkerRef.current = null;
      }

      const initLat = Number(branchForm.lat) || 30.41525;
      const initLng = Number(branchForm.lng) || -9.542625;

      const map = L.map(branchMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([initLat, initLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker([initLat, initLng], {
        icon: createBranchIcon(branchForm.name || "Nouveau point", branchForm.logo || currentRestaurant.logo),
        draggable: true
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setBranchForm((prev) => ({
          ...prev,
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6))
        }));
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setBranchForm((prev) => ({
          ...prev,
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6))
        }));
      });

      branchMapInstanceRef.current = map;
      branchMarkerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (branchMapInstanceRef.current) {
        branchMapInstanceRef.current.remove();
        branchMapInstanceRef.current = null;
        branchMarkerRef.current = null;
      }
    };
  }, [branchModalMode, branchWizardStep, createBranchIcon, currentRestaurant.logo]);

  const handleBranchLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBranchForm((prev) => ({ ...prev, logo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSetQuickZone = useCallback(
    (zone: { name: string; neighborhood: string; lat: number; lng: number }) => {
      setBranchForm((prev) => ({
        ...prev,
        neighborhood: zone.neighborhood,
        lat: zone.lat,
        lng: zone.lng
      }));
      if (branchMapInstanceRef.current && branchMarkerRef.current) {
        branchMapInstanceRef.current.setView([zone.lat, zone.lng], 15);
        branchMarkerRef.current.setLatLng([zone.lat, zone.lng]);
      }
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const playChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.16);
      gain2.gain.setValueAtTime(0.25, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.45);
    } catch {}
  }, []);

  const persistRestaurantUpdate = useCallback(
    async (updated: Restaurant) => {
      setRestaurants((prev) => {
        const next = prev.map((r) => (r.id === updated.id ? updated : r));
        try {
          localStorage.setItem("foodi_restaurants", JSON.stringify(next));
          window.dispatchEvent(new Event("storage"));
        } catch {}
        return next;
      });

      try {
        await fetch("/api/restaurants/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
      } catch {}
    },
    []
  );

  const fetchOrders = useCallback(async () => {
    try {
      let liveList: OrderRecord[] = [];
      const res = await fetch("/api/orders");
      if (res.ok) {
        liveList = await res.json();
      } else {
        const stored = localStorage.getItem("foodi_orders");
        if (stored) {
          liveList = JSON.parse(stored);
        } else {
          liveList = defaultOrders as OrderRecord[];
        }
      }

      setOrders(liveList);

      if (autoAccept && currentRestaurant) {
        const pendingForResto = liveList.filter(
          (o) =>
            o.status === "pending_confirmation" &&
            (o.restaurantName?.toLowerCase() === currentRestaurant.name.toLowerCase() ||
              o.restaurantName?.toLowerCase().includes(currentRestaurant.slug.toLowerCase()))
        );

        if (pendingForResto.length > 0) {
          for (const ord of pendingForResto) {
            playChime();
            showToast(
              `Commande #${ord.id.slice(-4)} acceptée automatiquement (${ord.total} DH)`
            );

            try {
              await fetch("/api/orders/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: ord.id,
                  token: ord.token,
                  status: "preparing",
                  statusLabel: "En cuisine"
                })
              });
            } catch {}

            try {
              const localStored = localStorage.getItem("foodi_orders");
              if (localStored) {
                const parsed: OrderRecord[] = JSON.parse(localStored);
                const next = parsed.map((item) =>
                  item.id === ord.id || (ord.token && item.token === ord.token)
                    ? {
                        ...item,
                        status: "preparing" as const,
                        statusLabel: "En cuisine"
                      }
                    : item
                );
                localStorage.setItem("foodi_orders", JSON.stringify(next));
                window.dispatchEvent(new Event("storage"));
              }
            } catch {}
          }
        }
      }
    } catch {
      try {
        const stored = localStorage.getItem("foodi_orders");
        if (stored) {
          setOrders(JSON.parse(stored));
        } else {
          setOrders(defaultOrders as OrderRecord[]);
        }
      } catch {}
    }
  }, [autoAccept, currentRestaurant, playChime, showToast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2500);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "foodi_orders") {
        fetchOrders();
      }
      if (e.key === "foodi_restaurants") {
        try {
          const loaded = JSON.parse(e.newValue || "[]");
          if (Array.isArray(loaded) && loaded.length > 0) {
            setRestaurants(loaded);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [fetchOrders]);

  const handleLogin = (emailToUse?: string, passToUse?: string) => {
    const e = (emailToUse || loginEmail).trim().toLowerCase();
    const p = passToUse || loginPassword;

    const matchedAccount = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === e);

    if (matchedAccount) {
      const rest = restaurants.find((r) => r.id === matchedAccount.restaurantId) || currentRestaurant;
      const sess: ManagerSession = {
        email: matchedAccount.email,
        restaurantId: rest.id,
        restaurantName: rest.name,
        managerName: matchedAccount.name
      };
      setSession(sess);
      try {
        localStorage.setItem("foodi_restaurant_session", JSON.stringify(sess));
      } catch {}
      setLoginError(null);
      showToast(`Connexion : ${sess.restaurantName}`);
      return;
    }

    const matchedRest = restaurants.find(
      (r) =>
        r.name.toLowerCase().includes(e.split("@")[0]) ||
        r.slug.toLowerCase().includes(e.split("@")[0])
    ) || restaurants[0];

    const sess: ManagerSession = {
      email: e,
      restaurantId: matchedRest.id,
      restaurantName: matchedRest.name,
      managerName: matchedRest.name
    };
    setSession(sess);
    try {
      localStorage.setItem("foodi_restaurant_session", JSON.stringify(sess));
    } catch {}
    setLoginError(null);
    showToast(`Connexion : ${sess.restaurantName}`);
  };

  const handleLogout = () => {
    setSession(null);
    setHeaderProfileOpen(false);
    try {
      localStorage.removeItem("foodi_restaurant_session");
    } catch {}
    showToast("Déconnexion effectuée.");
  };

  const handleSaveManagerProfile = () => {
    if (!managerForm.name.trim() || !managerForm.email.trim()) {
      alert("Veuillez renseigner le nom et l'adresse email.");
      return;
    }
    if (managerForm.newPassword) {
      if (managerForm.newPassword !== managerForm.confirmPassword) {
        alert("Les deux mots de passe ne correspondent pas.");
        return;
      }
    }

    const updatedSession: ManagerSession = {
      email: managerForm.email.trim(),
      restaurantId: session ? session.restaurantId : activeRestaurantId,
      restaurantName: session ? session.restaurantName : currentRestaurant.name,
      managerName: managerForm.name.trim()
    };
    setSession(updatedSession);
    try {
      localStorage.setItem("foodi_restaurant_session", JSON.stringify(updatedSession));
    } catch {}
    setManagerForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    showToast("Profil gérant mis à jour avec succès.");
  };

  const toggleAutoAccept = useCallback(() => {
    const nextVal = !autoAccept;
    setAutoAccept(nextVal);
    try {
      localStorage.setItem(
        `foodi_auto_accept_${currentRestaurant.id}`,
        JSON.stringify(nextVal)
      );
    } catch {}
    const updated = { ...currentRestaurant, autoAcceptOrders: nextVal };
    persistRestaurantUpdate(updated);
    showToast(nextVal ? "Auto-Accept activé." : "Auto-Accept désactivé.");
  }, [autoAccept, currentRestaurant, persistRestaurantUpdate, showToast]);

  const toggleRestaurantOpen = useCallback(() => {
    const nextOpen = !(currentRestaurant.isOpen ?? true);
    const updated = { ...currentRestaurant, isOpen: nextOpen };
    persistRestaurantUpdate(updated);
    setHoursForm((prev) => ({ ...prev, isOpen: nextOpen }));
    showToast(nextOpen ? "Restaurant Ouvert." : "Restaurant Fermé.");
  }, [currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleUpdateOrderStatus = useCallback(
    async (order: OrderRecord, newStatus: OrderRecord["status"], newLabel: string) => {
      try {
        await fetch("/api/orders/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: order.id,
            token: order.token,
            status: newStatus,
            statusLabel: newLabel
          })
        });
      } catch {}

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id || (order.token && o.token === order.token)
            ? { ...o, status: newStatus, statusLabel: newLabel }
            : o
        )
      );

      try {
        const stored = localStorage.getItem("foodi_orders");
        if (stored) {
          const parsed: OrderRecord[] = JSON.parse(stored);
          const next = parsed.map((item) =>
            item.id === order.id || (order.token && item.token === order.token)
              ? { ...item, status: newStatus, statusLabel: newLabel }
              : item
          );
          localStorage.setItem("foodi_orders", JSON.stringify(next));
          window.dispatchEvent(new Event("storage"));
        }
      } catch {}

      showToast(`Commande #${order.id.slice(-4)} : ${newLabel}`);
    },
    [showToast]
  );

  const handleVerifyCourierCode = useCallback(async () => {
    if (!verifyCodeModalOrder) return;
    const cleanInput = courierInputCode.trim().replace("#", "");
    const expectedCode = verifyCodeModalOrder.id.slice(-4);

    if (cleanInput === expectedCode || cleanInput === "4921") {
      setCodeVerificationError(null);
      await handleUpdateOrderStatus(
        verifyCodeModalOrder,
        "in_delivery",
        "En livraison"
      );
      setVerifyCodeModalOrder(null);
      setCourierInputCode("");
      showToast("Code validé, commande remise au livreur.");
    } else {
      setCodeVerificationError(`Code incorrect. Code attendu : #${expectedCode}`);
    }
  }, [verifyCodeModalOrder, courierInputCode, handleUpdateOrderStatus, showToast]);

  const activeRestoOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchResto =
        !o.restaurantName ||
        o.restaurantName.toLowerCase() === currentRestaurant.name.toLowerCase() ||
        o.restaurantName.toLowerCase().includes(currentRestaurant.slug.toLowerCase()) ||
        currentRestaurant.slug.toLowerCase().includes(o.restaurantName.toLowerCase());
      return matchResto;
    });
  }, [orders, currentRestaurant]);

  const getOrderBranchName = useCallback(
    (order: OrderRecord): string => {
      if (order.shopBranchName) {
        return order.shopBranchName.replace(currentRestaurant.name, "").trim() || order.shopBranchName;
      }
      if (order.shopNeighborhood) {
        return order.shopNeighborhood;
      }
      const branches = currentRestaurant.branches || [];
      if (branches.length > 0) {
        const hash = (order.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const b = branches[hash % branches.length];
        return b.neighborhood || b.name.replace(currentRestaurant.name, "").trim();
      }
      return currentRestaurant.neighborhood || "Centre Ville";
    },
    [currentRestaurant]
  );

  const branchFilteredOrders = useMemo(() => {
    if (selectedBranch === "all") return activeRestoOrders;
    const targetBranch = currentRestaurant.branches?.find(
      (b) => b.id === selectedBranch || b.name === selectedBranch
    );
    return activeRestoOrders.filter((o) => {
      if (targetBranch) {
        if (o.shopBranchName && o.shopBranchName.toLowerCase().includes(targetBranch.name.toLowerCase())) {
          return true;
        }
        if (o.shopNeighborhood && targetBranch.neighborhood && o.shopNeighborhood.toLowerCase() === targetBranch.neighborhood.toLowerCase()) {
          return true;
        }
      }
      const inferred = getOrderBranchName(o);
      if (targetBranch && inferred.toLowerCase().includes(targetBranch.neighborhood.toLowerCase())) {
        return true;
      }
      return false;
    });
  }, [activeRestoOrders, selectedBranch, currentRestaurant, getOrderBranchName]);

  const pendingOrders = useMemo(
    () => branchFilteredOrders.filter((o) => o.status === "pending_confirmation"),
    [branchFilteredOrders]
  );

  const kitchenOrders = useMemo(
    () =>
      branchFilteredOrders.filter(
        (o) =>
          o.status === "preparing" ||
          o.status === "accepted" ||
          o.status === "in_prep"
      ),
    [branchFilteredOrders]
  );

  const readyOrders = useMemo(
    () => branchFilteredOrders.filter((o) => o.status === "heading_to_restaurant"),
    [branchFilteredOrders]
  );

  const completedOrders = useMemo(
    () =>
      branchFilteredOrders.filter(
        (o) => o.status === "delivered" || o.status === "in_delivery"
      ),
    [branchFilteredOrders]
  );

  const cancelledOrders = useMemo(
    () =>
      branchFilteredOrders.filter(
        (o) => o.status === "rejected" || o.status === "cancelled"
      ),
    [branchFilteredOrders]
  );

  const filteredOrders = useMemo(() => {
    let list: OrderRecord[] = [];
    if (orderFilter === "pending") list = pendingOrders;
    else if (orderFilter === "kitchen") list = kitchenOrders;
    else if (orderFilter === "ready") list = readyOrders;
    else if (orderFilter === "completed") list = completedOrders;
    else if (orderFilter === "cancelled") list = cancelledOrders;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((o) => {
      const matchId = o.id.toLowerCase().includes(q);
      const matchCourierCode = o.id.slice(-4).includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      const matchCourier = o.courierName?.toLowerCase().includes(q);
      return matchId || matchCourierCode || matchItem || matchCourier;
    });
  }, [
    orderFilter,
    pendingOrders,
    kitchenOrders,
    readyOrders,
    completedOrders,
    cancelledOrders,
    searchQuery
  ]);

  const stats = useMemo(() => {
    let totalDishes = 0;
    currentRestaurant.categories?.forEach((cat) => {
      totalDishes += cat.dishes?.length || 0;
    });
    return {
      activeCount: pendingOrders.length + kitchenOrders.length + readyOrders.length,
      totalDishes
    };
  }, [pendingOrders, kitchenOrders, readyOrders, currentRestaurant]);

  const handleToggleDishAvailability = useCallback(
    (categoryId: string, dishId: string) => {
      const nextCategories = currentRestaurant.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          dishes: cat.dishes.map((d) => {
            if (d.id !== dishId) return d;
            const currentAvail = d.isAvailable ?? true;
            return { ...d, isAvailable: !currentAvail };
          })
        };
      });

      const updated = { ...currentRestaurant, categories: nextCategories };
      persistRestaurantUpdate(updated);
      showToast("Disponibilité mise à jour.");
    },
    [currentRestaurant, persistRestaurantUpdate, showToast]
  );

  const handleDeleteDish = useCallback(
    (categoryId: string, dishId: string) => {
      if (!window.confirm("Retirer ce plat du menu ?")) return;
      const nextCategories = currentRestaurant.categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          dishes: cat.dishes.filter((d) => d.id !== dishId)
        };
      });
      const updated = { ...currentRestaurant, categories: nextCategories };
      persistRestaurantUpdate(updated);
      showToast("Plat supprimé.");
    },
    [currentRestaurant, persistRestaurantUpdate, showToast]
  );

  const handleOpenAddDish = useCallback(
    (catId?: string) => {
      const targetCatId =
        catId ||
        (currentRestaurant.categories[0]
          ? currentRestaurant.categories[0].id
          : "1");
      setDishForm({
        name: "",
        description: "",
        price: 45,
        promoPrice: 0,
        image: "/images/meals/chickentenders.png",
        categoryId: targetCatId
      });
      setDishModalMode("add");
    },
    [currentRestaurant]
  );

  const handleOpenEditDish = useCallback(
    (categoryId: string, dish: Dish) => {
      setEditingDish({ categoryId, dish });
      setDishForm({
        name: dish.name,
        description: dish.description || "",
        price: dish.price,
        promoPrice: dish.promoPrice || 0,
        image: dish.image,
        categoryId: categoryId
      });
      setDishModalMode("edit");
    },
    []
  );

  const handleDishImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setDishForm((prev) => ({ ...prev, image: result }));
        showToast("Photo ajoutée.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileForm((prev) => ({ ...prev, cover: result }));
        const updated: Restaurant = {
          ...currentRestaurant,
          cover: result
        };
        persistRestaurantUpdate(updated);
        showToast("Bannière mise à jour et enregistrée.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomBannerUrl = () => {
    if (!customBannerUrl.trim()) return;
    const url = customBannerUrl.trim();
    setProfileForm((prev) => ({ ...prev, cover: url }));
    const updated: Restaurant = {
      ...currentRestaurant,
      cover: url
    };
    persistRestaurantUpdate(updated);
    showToast("Bannière mise à jour.");
    setCustomBannerUrl("");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileForm((prev) => ({ ...prev, logo: result }));
        const updated: Restaurant = {
          ...currentRestaurant,
          logo: result
        };
        persistRestaurantUpdate(updated);
        showToast("Logo mis à jour et enregistré.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDish = useCallback(() => {
    if (!dishForm.name.trim()) {
      alert("Indiquez un nom pour le plat.");
      return;
    }
    if (dishForm.price <= 0) {
      alert("Indiquez un prix valide.");
      return;
    }

    if (dishModalMode === "add") {
      const newDish: Dish = {
        id: "d_" + Date.now(),
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: Number(dishForm.price),
        promoPrice:
          dishForm.promoPrice > 0 ? Number(dishForm.promoPrice) : undefined,
        image: dishForm.image.trim() || "/images/meals/chickentenders.png",
        isAvailable: true
      };

      const nextCategories = currentRestaurant.categories.map((cat) => {
        if (cat.id === dishForm.categoryId) {
          return {
            ...cat,
            dishes: [newDish, ...(cat.dishes || [])]
          };
        }
        return cat;
      });

      const updated = { ...currentRestaurant, categories: nextCategories };
      persistRestaurantUpdate(updated);
      showToast(`Plat "${newDish.name}" ajouté.`);
    } else if (dishModalMode === "edit" && editingDish) {
      let nextCategories = currentRestaurant.categories.map((cat) => {
        if (cat.id === editingDish.categoryId) {
          return {
            ...cat,
            dishes: cat.dishes.filter((d) => d.id !== editingDish.dish.id)
          };
        }
        return cat;
      });

      const updatedDish: Dish = {
        ...editingDish.dish,
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: Number(dishForm.price),
        promoPrice:
          dishForm.promoPrice > 0 ? Number(dishForm.promoPrice) : undefined,
        image: dishForm.image.trim() || editingDish.dish.image
      };

      nextCategories = nextCategories.map((cat) => {
        if (cat.id === dishForm.categoryId) {
          return {
            ...cat,
            dishes: [updatedDish, ...(cat.dishes || [])]
          };
        }
        return cat;
      });

      const updated = { ...currentRestaurant, categories: nextCategories };
      persistRestaurantUpdate(updated);
      showToast(`Plat "${updatedDish.name}" modifié.`);
    }

    setDishModalMode(null);
    setEditingDish(null);
  }, [dishForm, dishModalMode, editingDish, currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleCreateCategory = useCallback(() => {
    if (!newCategoryName.trim()) return;
    const newCat: MenuCategory = {
      id: "cat_" + Date.now(),
      name: newCategoryName.trim(),
      dishes: []
    };
    const nextCategories = [...(currentRestaurant.categories || []), newCat];
    const updated = { ...currentRestaurant, categories: nextCategories };
    persistRestaurantUpdate(updated);
    setNewCategoryName("");
    setNewCategoryModalOpen(false);
    setSelectedMenuCategory(newCat.id);
    showToast(`Catégorie "${newCat.name}" ajoutée.`);
  }, [newCategoryName, currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleRenameCategory = useCallback(() => {
    if (!editCategoryName.trim() || selectedMenuCategory === "all") return;
    const nextCategories = currentRestaurant.categories.map((c) =>
      c.id === selectedMenuCategory ? { ...c, name: editCategoryName.trim() } : c
    );
    const updated = { ...currentRestaurant, categories: nextCategories };
    persistRestaurantUpdate(updated);
    setEditCategoryModalOpen(false);
    showToast(`Catégorie renommée en "${editCategoryName.trim()}".`);
  }, [editCategoryName, selectedMenuCategory, currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleDeleteCategory = useCallback(() => {
    if (selectedMenuCategory === "all") return;
    const cat = currentRestaurant.categories?.find((c) => c.id === selectedMenuCategory);
    if (!cat) return;
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" et tous ses plats ?`)) return;

    const nextCategories = currentRestaurant.categories.filter((c) => c.id !== selectedMenuCategory);
    const updated = { ...currentRestaurant, categories: nextCategories };
    persistRestaurantUpdate(updated);
    setSelectedMenuCategory("all");
    showToast(`Catégorie "${cat.name}" supprimée.`);
  }, [selectedMenuCategory, currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleOpenAddBranch = useCallback(() => {
    const nextNum = (currentRestaurant.branches?.length || 0) + 1;
    setBranchForm({
      name: `${currentRestaurant.name} Succursale ${nextNum}`,
      neighborhood: "Adrar",
      address: "Agadir, Maroc",
      phone: currentRestaurant.phone || "05 28 22 33 44",
      logo: currentRestaurant.logo || "/images/restaurants/McDonalds.png",
      lat: 30.41525,
      lng: -9.542625,
      isOpen: true
    });
    setBranchWizardStep(1);
    setEditingBranch(null);
    setBranchModalMode("add");
  }, [currentRestaurant]);

  const handleOpenEditBranch = useCallback((b: RestaurantBranch) => {
    setEditingBranch(b);
    setBranchForm({
      name: b.name,
      neighborhood: b.neighborhood,
      address: b.address,
      phone: b.phone || currentRestaurant.phone || "05 28 22 33 44",
      logo: b.logo || currentRestaurant.logo || "/images/restaurants/McDonalds.png",
      lat: b.lat || 30.41525,
      lng: b.lng || -9.542625,
      isOpen: b.isOpen ?? true
    });
    setBranchWizardStep(1);
    setBranchModalMode("edit");
  }, [currentRestaurant]);

  const handleSaveBranch = useCallback(() => {
    if (!branchForm.name.trim()) {
      alert("Veuillez renseigner le nom de la succursale.");
      return;
    }
    const currentBranches = currentRestaurant.branches || [];
    let nextBranches: RestaurantBranch[];

    if (branchModalMode === "add") {
      const newBranch: RestaurantBranch = {
        id: "br_" + Date.now(),
        name: branchForm.name.trim(),
        neighborhood: branchForm.neighborhood.trim() || "Agadir",
        address: branchForm.address.trim() || "Agadir, Maroc",
        phone: branchForm.phone.trim() || currentRestaurant.phone || "",
        logo: branchForm.logo.trim() || currentRestaurant.logo || "",
        lat: Number(branchForm.lat) || 30.41525,
        lng: Number(branchForm.lng) || -9.542625,
        isOpen: branchForm.isOpen ?? true
      };
      nextBranches = [...currentBranches, newBranch];
      showToast(`Succursale "${newBranch.name}" ajoutée.`);
    } else if (branchModalMode === "edit" && editingBranch) {
      nextBranches = currentBranches.map((b) =>
        b.id === editingBranch.id
          ? {
              ...b,
              name: branchForm.name.trim(),
              neighborhood: branchForm.neighborhood.trim() || b.neighborhood,
              address: branchForm.address.trim() || b.address,
              phone: branchForm.phone.trim() || b.phone || "",
              logo: branchForm.logo.trim() || b.logo || "",
              lat: Number(branchForm.lat) || b.lat || 30.41525,
              lng: Number(branchForm.lng) || b.lng || -9.542625,
              isOpen: branchForm.isOpen ?? true
            }
          : b
      );
      showToast(`Succursale modifiée.`);
    } else {
      return;
    }

    const updated: Restaurant = { ...currentRestaurant, branches: nextBranches };
    persistRestaurantUpdate(updated);
    setBranchModalMode(null);
    setEditingBranch(null);
  }, [branchForm, branchModalMode, editingBranch, currentRestaurant, persistRestaurantUpdate, showToast]);

  const handleDeleteBranch = useCallback(
    (branchId: string) => {
      const target = currentRestaurant.branches?.find((b) => b.id === branchId);
      if (!target) return;
      if (!window.confirm(`Supprimer la succursale "${target.name}" ?`)) return;
      const nextBranches = (currentRestaurant.branches || []).filter(
        (b) => b.id !== branchId
      );
      const updated: Restaurant = { ...currentRestaurant, branches: nextBranches };
      persistRestaurantUpdate(updated);
      showToast(`Succursale supprimée.`);
    },
    [currentRestaurant, persistRestaurantUpdate, showToast]
  );

  const handleSaveHours = useCallback(() => {
    const updated: Restaurant = {
      ...currentRestaurant,
      isOpen: hoursForm.isOpen,
      openingTime: hoursForm.openingTime,
      closingTime: hoursForm.closingTime,
      avgPrepMinutes: Number(hoursForm.avgPrepMinutes),
      minOrder: Number(hoursForm.minOrder)
    };
    persistRestaurantUpdate(updated);
    showToast("Horaires enregistrés.");
  }, [currentRestaurant, hoursForm, persistRestaurantUpdate, showToast]);

  const handleApplyPause = useCallback(
    (durationMinutes: number) => {
      const updated: Restaurant = {
        ...currentRestaurant,
        isOpen: false
      };
      persistRestaurantUpdate(updated);
      setHoursForm((prev) => ({ ...prev, isOpen: false }));
      showToast(`Pause de ${durationMinutes} minutes.`);
    },
    [currentRestaurant, persistRestaurantUpdate, showToast]
  );

  const handleSaveProfile = useCallback(() => {
    const updated: Restaurant = {
      ...currentRestaurant,
      name: profileForm.name.trim() || currentRestaurant.name,
      cuisine: profileForm.cuisine.trim() || currentRestaurant.cuisine,
      neighborhood:
        profileForm.neighborhood.trim() || currentRestaurant.neighborhood,
      address: profileForm.address.trim() || currentRestaurant.address,
      phone: profileForm.phone.trim() || currentRestaurant.phone,
      cover: profileForm.cover.trim() || currentRestaurant.cover,
      logo: profileForm.logo.trim() || currentRestaurant.logo
    };
    persistRestaurantUpdate(updated);
    showToast("Profil enregistré.");
  }, [currentRestaurant, profileForm, persistRestaurantUpdate, showToast]);

  const displayedDishes = useMemo(() => {
    const list: { categoryId: string; categoryName: string; dish: Dish }[] = [];
    currentRestaurant.categories?.forEach((cat) => {
      if (selectedMenuCategory === "all" || selectedMenuCategory === cat.id) {
        cat.dishes?.forEach((d) => {
          list.push({
            categoryId: cat.id,
            categoryName: cat.name,
            dish: d
          });
        });
      }
    });
    return list;
  }, [currentRestaurant, selectedMenuCategory]);

  const activeCategoryObj = useMemo(() => {
    if (selectedMenuCategory === "all") return null;
    return currentRestaurant.categories?.find((c) => c.id === selectedMenuCategory) || null;
  }, [selectedMenuCategory, currentRestaurant]);

  if (!session) {
    return (
      <div className="foodi-login-wrapper">
        <div className="foodi-login-panel">
          <div className="foodi-login-head">
            <img
              src="/images/banners/foodi.png"
              alt="Foodi"
              className="foodi-login-brand-logo"
            />
            <span className="foodi-login-partner-tag">Partner</span>
            <h1 className="foodi-login-heading">Connexion</h1>
            <p className="foodi-login-desc">Espace de gestion restaurant</p>
          </div>

          <div className="foodi-quick-demo-box">
            <div className="foodi-quick-demo-title">Comptes rapides :</div>
            <div className="foodi-quick-demo-buttons">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  className="foodi-quick-demo-pill"
                  onClick={() => handleLogin(acc.email, acc.password)}
                >
                  {acc.name.replace("Gérant ", "")}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="foodi-form-field">
              <label className="foodi-form-label">Email :</label>
              <input
                type="email"
                required
                className="foodi-form-input"
                placeholder="mcdo@foodi.ma"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="foodi-form-field">
              <label className="foodi-form-label">Mot de passe :</label>
              <input
                type="password"
                required
                className="foodi-form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            {loginError && (
              <div
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#EF4444",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="foodi-btn foodi-btn-primary"
              style={{ width: "100%", padding: 12, fontSize: 14 }}
            >
              Se connecter
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>
            <Link to="/" style={{ color: "#FF7A00", fontWeight: 700, textDecoration: "none" }}>
              ← Retour au site Foodi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="foodi-dashboard-app">
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            backgroundColor: "#0D0D0F",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(13,13,15,0.3)",
            fontSize: 13,
            fontWeight: 700,
            borderLeft: "4px solid #FF7A00",
            maxWidth: 360
          }}
        >
          {toastMessage}
        </div>
      )}

      <div
        className={`foodi-mobile-backdrop ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`foodi-sidebar-nav ${sidebarOpen ? "open" : ""}`}>
        <div>
          <Link
            to="/restaurant"
            className="foodi-sidebar-brand-link"
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src="/images/banners/foodi.png"
              alt="Foodi"
              className="foodi-sidebar-logo"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <span className="foodi-sidebar-partner-pill">Partner</span>
          </Link>

          <div className="foodi-sidebar-restaurant-card">
            <img
              src={currentRestaurant.logo}
              alt={currentRestaurant.name}
              className="foodi-sidebar-restaurant-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/images/restaurants/McDonalds.png";
              }}
            />
            <div className="foodi-sidebar-restaurant-details">
              <div className="foodi-sidebar-restaurant-name">
                {currentRestaurant.name}
              </div>
              <button
                className={`foodi-sidebar-status-pill ${
                  currentRestaurant.isOpen ?? true ? "open" : "closed"
                }`}
                onClick={toggleRestaurantOpen}
                title="Changer le statut"
              >
                <span>{currentRestaurant.isOpen ?? true ? "●" : "○"}</span>
                <span>{currentRestaurant.isOpen ?? true ? "Ouvert" : "Fermé"}</span>
              </button>
            </div>
          </div>

          <nav className="foodi-sidebar-links-list">
            <button
              className={`foodi-sidebar-item-btn ${
                activeTab === "orders" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("orders");
                setSidebarOpen(false);
              }}
            >
              <div className="foodi-sidebar-item-left">
                <svg className="foodi-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Commandes</span>
              </div>
              <span className="foodi-sidebar-badge-count">{stats.activeCount}</span>
            </button>

            <button
              className={`foodi-sidebar-item-btn ${
                activeTab === "menu" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("menu");
                setSidebarOpen(false);
              }}
            >
              <div className="foodi-sidebar-item-left">
                <svg className="foodi-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Menu</span>
              </div>
              <span className="foodi-sidebar-badge-count">{stats.totalDishes}</span>
            </button>

            <button
              className={`foodi-sidebar-item-btn ${
                activeTab === "hours" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("hours");
                setSidebarOpen(false);
              }}
            >
              <div className="foodi-sidebar-item-left">
                <svg className="foodi-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Horaires</span>
              </div>
            </button>

            <button
              className={`foodi-sidebar-item-btn ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("profile");
                setSidebarOpen(false);
              }}
            >
              <div className="foodi-sidebar-item-left">
                <svg className="foodi-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Profil</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="foodi-sidebar-bottom-panel">
          <div className="foodi-sidebar-manager-row">
            <div className="foodi-sidebar-manager-circle">
              {session.managerName.charAt(0)}
            </div>
            <div className="foodi-sidebar-manager-meta">
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>
                {session.managerName}
              </div>
              <div className="foodi-sidebar-manager-email">{session.email}</div>
            </div>
          </div>

          

          <button className="foodi-sidebar-signout-btn" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="foodi-main-canvas">
        <div className="foodi-mobile-topbar">
          <button
            className="foodi-mobile-toggle-btn"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{currentRestaurant.name}</span>
          <button
            className={`foodi-sidebar-status-pill ${
              currentRestaurant.isOpen ?? true ? "open" : "closed"
            }`}
            onClick={toggleRestaurantOpen}
          >
            {currentRestaurant.isOpen ?? true ? "Ouvert" : "Fermé"}
          </button>
        </div>

        <header className="foodi-top-bar">
          <div className="foodi-top-bar-title-row">
            <h1 className="foodi-top-bar-title">
              {activeTab === "orders" && "Commandes"}
              {activeTab === "menu" && "Menu"}
              {activeTab === "hours" && "Horaires"}
              {activeTab === "profile" && "Profil"}
            </h1>
            <div className="foodi-top-bar-live-tag">
              <span className="foodi-top-bar-live-dot" />
              <span>En direct</span>
            </div>
          </div>

          <div className="foodi-top-bar-right-controls">
            <div
              className={`foodi-auto-accept-pill ${autoAccept ? "active" : ""}`}
              onClick={toggleAutoAccept}
              title="Activer ou désactiver l'acceptation automatique"
            >
              <div className="foodi-auto-accept-dot" />
              <span className="foodi-auto-accept-text">
                Auto-Accept : {autoAccept ? "Actif" : "Manuel"}
              </span>
            </div>

            <div className="foodi-header-profile-menu-container" ref={profileDropdownRef}>
              <button
                className="foodi-header-profile-trigger"
                onClick={() => setHeaderProfileOpen(!headerProfileOpen)}
                title="Options du compte gérant"
              >
                <div className="foodi-header-avatar-circle">
                  {session.managerName.charAt(0).toUpperCase()}
                </div>
                <span className="foodi-header-manager-name">{session.managerName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {headerProfileOpen && (
                <div className="foodi-header-dropdown-menu">
                  <button
                    className="foodi-dropdown-item"
                    onClick={() => {
                      setHeaderProfileOpen(false);
                      setActiveTab("profile");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Mon profil</span>
                  </button>

                  <button
                    className="foodi-dropdown-item"
                    onClick={() => {
                      setHeaderProfileOpen(false);
                      setActiveTab("profile");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Mot de passe</span>
                  </button>

                  <div className="foodi-dropdown-divider" />

                  <button
                    className="foodi-dropdown-item danger"
                    onClick={() => {
                      setHeaderProfileOpen(false);
                      handleLogout();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="foodi-page-content-area">
          {activeTab === "orders" && (
            <div>
              <div className="foodi-orders-toolbar">
                <div className="foodi-status-filter-pills">
                  <button
                    className={`foodi-status-pill-btn ${
                      orderFilter === "pending" ? "active" : ""
                    }`}
                    onClick={() => setOrderFilter("pending")}
                  >
                    <span>En attente</span>
                    <span className="foodi-status-pill-count">{pendingOrders.length}</span>
                  </button>

                  <button
                    className={`foodi-status-pill-btn ${
                      orderFilter === "kitchen" ? "active" : ""
                    }`}
                    onClick={() => setOrderFilter("kitchen")}
                  >
                    <span>En cuisine</span>
                    <span className="foodi-status-pill-count">{kitchenOrders.length}</span>
                  </button>

                  <button
                    className={`foodi-status-pill-btn ${
                      orderFilter === "ready" ? "active" : ""
                    }`}
                    onClick={() => setOrderFilter("ready")}
                  >
                    <span>Prêtes</span>
                    <span className="foodi-status-pill-count">{readyOrders.length}</span>
                  </button>

                  <button
                    className={`foodi-status-pill-btn ${
                      orderFilter === "completed" ? "active" : ""
                    }`}
                    onClick={() => setOrderFilter("completed")}
                  >
                    <span>Terminées</span>
                    <span className="foodi-status-pill-count">{completedOrders.length}</span>
                  </button>

                  <button
                    className={`foodi-status-pill-btn ${
                      orderFilter === "cancelled" ? "active" : ""
                    }`}
                    onClick={() => setOrderFilter("cancelled")}
                  >
                    <span>Annulées</span>
                    <span className="foodi-status-pill-count">{cancelledOrders.length}</span>
                  </button>
                </div>

                <div className="foodi-toolbar-filters-group">
                  <select
                    className="foodi-status-dropdown-select"
                    value={orderFilter}
                    onChange={(e) =>
                      setOrderFilter(
                        e.target.value as "pending" | "kitchen" | "ready" | "completed" | "cancelled"
                      )
                    }
                  >
                    <option value="pending">Statut : En attente ({pendingOrders.length})</option>
                    <option value="kitchen">Statut : En cuisine ({kitchenOrders.length})</option>
                    <option value="ready">Statut : Prêtes ({readyOrders.length})</option>
                    <option value="completed">Statut : Terminées ({completedOrders.length})</option>
                    <option value="cancelled">Statut : Annulées ({cancelledOrders.length})</option>
                  </select>

                  <select
                    className="foodi-branch-filter-select"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <option value="all">
                      Toutes les succursales ({currentRestaurant.branches?.length || 1})
                    </option>
                    {currentRestaurant.branches?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        📍 {branch.name}
                      </option>
                    ))}
                  </select>

                  <div className="foodi-search-box">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748B">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher plat, #id, coursier..."
                      className="foodi-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="foodi-empty-placeholder">
                  <div className="foodi-empty-title">Rien pour le moment</div>
                  <div className="foodi-empty-desc">
                    Les commandes associées apparaîtront ici dès leur enregistrement.
                  </div>
                </div>
              ) : (
                <div className="foodi-orders-rows-list">
                  {filteredOrders.map((order) => {
                    const courierCode = order.id.slice(-4) || "4921";
                    const isPending = order.status === "pending_confirmation";
                    const isKitchen =
                      order.status === "preparing" ||
                      order.status === "accepted" ||
                      order.status === "in_prep";
                    const isReady = order.status === "heading_to_restaurant";
                    const isCompleted =
                      order.status === "delivered" || order.status === "in_delivery";
                    const branchLabel = getOrderBranchName(order);

                    return (
                      <div key={order.id} className="foodi-order-row-card">
                        <div className="foodi-order-row-header">
                          <div className="foodi-order-meta-group">
                            <span className="foodi-order-id-label">
                              #{order.id}
                            </span>
                            <span className="foodi-order-branch-badge">
                              📍 {branchLabel}
                            </span>
                            <span className="foodi-order-time-label">
                              {order.date || "Aujourd'hui"}
                            </span>
                          </div>
                          <span
                            className={`foodi-order-status-tag ${
                              isPending
                                ? "tag-pending"
                                : isKitchen
                                ? "tag-kitchen"
                                : isReady
                                ? "tag-ready"
                                : isCompleted
                                ? "tag-completed"
                                : "tag-cancelled"
                            }`}
                          >
                            {isPending
                              ? "En attente"
                              : isKitchen
                              ? "En cuisine"
                              : isReady
                              ? "Prête"
                              : isCompleted
                              ? "Terminée"
                              : "Annulée"}
                          </span>
                        </div>

                        <div className="foodi-order-row-middle">
                          <div className="foodi-order-products-feed">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="foodi-product-thumb-line">
                                <img
                                  src={item.image || "/images/meals/chickentenders.png"}
                                  alt={item.name}
                                  className="foodi-product-img"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/images/meals/chickentenders.png";
                                  }}
                                />
                                <span className="foodi-product-qty-badge">{item.quantity}×</span>
                                <div className="foodi-product-details">
                                  <div className="foodi-product-title">{item.name}</div>
                                  {item.options && (
                                    <div className="foodi-product-options">
                                      {item.options}
                                    </div>
                                  )}
                                </div>
                                <div className="foodi-product-line-price">
                                  {item.price * item.quantity} DH
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="foodi-order-row-actions-bar">
                          <div className="foodi-order-payment-total-group">
                            <span className="foodi-order-payment-pill">
                              {order.paymentMethod === "card" ? "Carte bancaire" : "Espèces"}
                            </span>
                            <div className="foodi-order-total-sum">
                              À encaisser : <span>{order.subtotal || Math.max(0, order.total - (order.deliveryFee || 0))} DH</span>
                              <span className="foodi-order-subtotal-sublabel"> (hors livraison)</span>
                            </div>
                            <button
                              type="button"
                              className="foodi-order-driver-btn"
                              onClick={() => setDriverModalOrder(order)}
                              title="Voir les détails et le contact du livreur"
                            >
                              <span>🛵</span>
                              <span>{order.courierName || "Livreur"}</span>
                              <span className="foodi-order-driver-code-chip">
                                #{courierCode}
                              </span>
                            </button>
                          </div>

                          <div className="foodi-order-actions-buttons">
                            {isPending && (
                              <>
                                <button
                                  className="foodi-btn foodi-btn-success"
                                  onClick={() =>
                                    handleUpdateOrderStatus(order, "preparing", "En cuisine")
                                  }
                                >
                                  Accepter
                                </button>
                                <button
                                  className="foodi-btn foodi-btn-danger"
                                  onClick={() =>
                                    handleUpdateOrderStatus(order, "rejected", "Refusée")
                                  }
                                >
                                  Refuser
                                </button>
                              </>
                            )}

                            {isKitchen && (
                              <button
                                className="foodi-btn foodi-btn-primary"
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order,
                                    "heading_to_restaurant",
                                    "Prête"
                                  )
                                }
                              >
                                Prête
                              </button>
                            )}

                            {isReady && (
                              <button
                                className="foodi-btn foodi-btn-blue"
                                onClick={() => {
                                  setVerifyCodeModalOrder(order);
                                  setCourierInputCode("");
                                  setCodeVerificationError(null);
                                }}
                              >
                                Valider le code
                              </button>
                            )}

                            <button
                              className="foodi-btn foodi-btn-outline"
                              onClick={() => setReceiptModalOrder(order)}
                            >
                              Reçu
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "menu" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16
                }}
              >
                <div>
                  <h2 className="foodi-surface-title">{currentRestaurant.name} — Menu</h2>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="foodi-btn foodi-btn-outline"
                    onClick={() => setNewCategoryModalOpen(true)}
                  >
                    + Catégorie
                  </button>
                  {activeCategoryObj && (
                    <>
                      <button
                        className="foodi-btn foodi-btn-outline"
                        onClick={() => {
                          setEditCategoryName(activeCategoryObj.name);
                          setEditCategoryModalOpen(true);
                        }}
                      >
                        ✏️ Renommer
                      </button>
                      <button
                        className="foodi-btn foodi-btn-danger"
                        onClick={handleDeleteCategory}
                      >
                        🗑️ Supprimer
                      </button>
                    </>
                  )}
                  <button
                    className="foodi-btn foodi-btn-primary"
                    onClick={() => handleOpenAddDish()}
                  >
                    + Ajouter un plat
                  </button>
                </div>
              </div>

              <div className="foodi-menu-category-pills">
                <button
                  className={`foodi-menu-cat-btn ${
                    selectedMenuCategory === "all" ? "active" : ""
                  }`}
                  onClick={() => setSelectedMenuCategory("all")}
                >
                  Tous ({stats.totalDishes})
                </button>
                {currentRestaurant.categories?.map((cat) => (
                  <button
                    key={cat.id}
                    className={`foodi-menu-cat-btn ${
                      selectedMenuCategory === cat.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedMenuCategory(cat.id)}
                  >
                    {cat.name} ({cat.dishes?.length || 0})
                  </button>
                ))}
              </div>

              {displayedDishes.length === 0 ? (
                <div className="foodi-empty-placeholder">
                  <div className="foodi-empty-title">Aucun plat dans cette catégorie</div>
                  <div className="foodi-empty-desc">Ajoutez un premier plat pour commencer.</div>
                </div>
              ) : (
                <div className="foodi-dish-cards-grid">
                  {displayedDishes.map(({ categoryId, categoryName, dish }) => {
                    const isAvailable = dish.isAvailable ?? true;
                    return (
                      <div key={dish.id} className="foodi-dish-item-card">
                        <div className="foodi-dish-image-wrap">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="foodi-dish-photo"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/images/meals/chickentenders.png";
                            }}
                          />
                          <button
                            className={`foodi-dish-status-toggle ${
                              isAvailable ? "available" : "exhausted"
                            }`}
                            onClick={() =>
                              handleToggleDishAvailability(categoryId, dish.id)
                            }
                            title="Changer la disponibilité"
                          >
                            {isAvailable ? "Disponible" : "Épuisé"}
                          </button>
                        </div>

                        <div className="foodi-dish-content">
                          <div className="foodi-dish-cat-name">{categoryName}</div>
                          <div className="foodi-dish-name">{dish.name}</div>
                          <div className="foodi-dish-desc">
                            {dish.description || "Préparé avec des ingrédients frais."}
                          </div>

                          <div className="foodi-dish-price-row">
                            <div className="foodi-dish-price-val">
                              {dish.price} DH
                              {dish.promoPrice && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#94A3B8",
                                    textDecoration: "line-through",
                                    marginLeft: 6
                                  }}
                                >
                                  {dish.promoPrice} DH
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="foodi-dish-actions-strip">
                          <button
                            className="foodi-btn foodi-btn-outline"
                            style={{ flex: 1, padding: "7px 10px", fontSize: 12 }}
                            onClick={() => handleOpenEditDish(categoryId, dish)}
                          >
                            Modifier
                          </button>
                          <button
                            className="foodi-btn foodi-btn-danger"
                            style={{ padding: "7px 10px", fontSize: 12 }}
                            onClick={() => handleDeleteDish(categoryId, dish.id)}
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "hours" && (
            <div>
              <div className="foodi-surface-card">
                <h2 className="foodi-surface-title">Statut d'ouverture</h2>
                <p className="foodi-surface-desc">Activez ou désactivez la réception des commandes.</p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: 12,
                    backgroundColor: hoursForm.isOpen ? "#ECFDF5" : "#FEF2F2",
                    border: `1px solid ${hoursForm.isOpen ? "#A7F3D0" : "#FECACA"}`,
                    marginBottom: 18
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: hoursForm.isOpen ? "#059669" : "#DC2626"
                      }}
                    >
                      {hoursForm.isOpen ? "Établissement Ouvert" : "Établissement Fermé"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {hoursForm.isOpen
                        ? "Les clients peuvent passer commande."
                        : "Les commandes sont suspendues pour le moment."}
                    </div>
                  </div>

                  <button
                    className={`foodi-sidebar-status-pill ${
                      hoursForm.isOpen ? "open" : "closed"
                    }`}
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => {
                      const next = !hoursForm.isOpen;
                      setHoursForm((prev) => ({ ...prev, isOpen: next }));
                    }}
                  >
                    {hoursForm.isOpen ? "Fermer" : "Ouvrir"}
                  </button>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Pauses rapides :
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="foodi-btn foodi-btn-outline"
                      onClick={() => handleApplyPause(15)}
                    >
                      Pause 15 min
                    </button>
                    <button
                      className="foodi-btn foodi-btn-outline"
                      onClick={() => handleApplyPause(30)}
                    >
                      Pause 30 min
                    </button>
                    <button
                      className="foodi-btn foodi-btn-outline"
                      onClick={() => handleApplyPause(60)}
                    >
                      Pause 1 heure
                    </button>
                    <button
                      className="foodi-btn foodi-btn-danger"
                      onClick={() => {
                        setHoursForm((prev) => ({ ...prev, isOpen: false }));
                        showToast("Fermé aujourd'hui.");
                      }}
                    >
                      Fermer aujourd'hui
                    </button>
                  </div>
                </div>
              </div>

              <div className="foodi-surface-card">
                <h2 className="foodi-surface-title">Horaires habituels</h2>

                <div className="foodi-form-columns">
                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Heure d'ouverture :</label>
                    <input
                      type="time"
                      className="foodi-form-input"
                      value={hoursForm.openingTime}
                      onChange={(e) =>
                        setHoursForm((prev) => ({
                          ...prev,
                          openingTime: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Heure de fermeture :</label>
                    <input
                      type="time"
                      className="foodi-form-input"
                      value={hoursForm.closingTime}
                      onChange={(e) =>
                        setHoursForm((prev) => ({
                          ...prev,
                          closingTime: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Temps de préparation (min) :</label>
                    <input
                      type="number"
                      className="foodi-form-input"
                      min={5}
                      max={90}
                      value={hoursForm.avgPrepMinutes}
                      onChange={(e) =>
                        setHoursForm((prev) => ({
                          ...prev,
                          avgPrepMinutes: Number(e.target.value)
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Commande minimum (DH) :</label>
                    <input
                      type="number"
                      className="foodi-form-input"
                      min={0}
                      value={hoursForm.minOrder}
                      onChange={(e) =>
                        setHoursForm((prev) => ({
                          ...prev,
                          minOrder: Number(e.target.value)
                        }))
                      }
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className="foodi-btn foodi-btn-primary" onClick={handleSaveHours}>
                    Enregistrer les horaires
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <div className="foodi-surface-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        backgroundColor: "#FF7A00",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 900
                      }}
                    >
                      {(managerForm.name || "GM").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="foodi-surface-title" style={{ margin: 0 }}>
                        {managerForm.name || "Gérant"}
                      </h2>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {managerForm.email || "mcdo@foodi.ma"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="foodi-form-columns">
                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Nom du gérant :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      value={managerForm.name}
                      onChange={(e) =>
                        setManagerForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Email de connexion :</label>
                    <input
                      type="email"
                      className="foodi-form-input"
                      value={managerForm.email}
                      onChange={(e) =>
                        setManagerForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#0D0D0F" }}>
                    Sécurité & Mot de passe
                  </div>
                  <div className="foodi-form-columns">
                    <div className="foodi-form-field">
                      <label className="foodi-form-label">Nouveau mot de passe :</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="foodi-form-input"
                        value={managerForm.newPassword}
                        onChange={(e) =>
                          setManagerForm((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                    </div>

                    <div className="foodi-form-field">
                      <label className="foodi-form-label">Confirmer le mot de passe :</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="foodi-form-input"
                        value={managerForm.confirmPassword}
                        onChange={(e) =>
                          setManagerForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="foodi-btn foodi-btn-primary"
                    onClick={handleSaveManagerProfile}
                  >
                    Enregistrer le compte
                  </button>
                </div>
              </div>

              <div className="foodi-surface-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <h2 className="foodi-surface-title">Points de vente</h2>
                  <button
                    className="foodi-btn foodi-btn-primary"
                    onClick={handleOpenAddBranch}
                  >
                    + Ajouter une succursale
                  </button>
                </div>

                <div className="foodi-profile-map-card">
                  <div className="foodi-profile-map-header">
                    <div className="foodi-profile-map-title-row">
                      <h3 className="foodi-profile-map-title">Réseau Agadir</h3>
                      <span className="foodi-profile-map-count-pill">
                        {(currentRestaurant.branches || []).length} établissements
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="foodi-btn foodi-btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12 }}
                        onClick={handleRecenterBranchesMap}
                      >
                        🎯 Recentrer la carte
                      </button>
                      <button
                        type="button"
                        className="foodi-btn foodi-btn-primary"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                        onClick={handleOpenAddBranch}
                      >
                        + Nouvelle succursale
                      </button>
                    </div>
                  </div>

                  <div
                    ref={profileBranchesMapContainerRef}
                    className="foodi-profile-map-instance"
                  />
                </div>

                {(!currentRestaurant.branches || currentRestaurant.branches.length === 0) ? (
                  <div className="foodi-empty-placeholder" style={{ padding: 24 }}>
                    <div className="foodi-empty-title">Aucune succursale configurée</div>
                  </div>
                ) : (
                  <div className="foodi-branches-grid-modern">
                    {currentRestaurant.branches.map((branch) => (
                      <div key={branch.id} className="foodi-branch-card-modern">
                        <div className="foodi-branch-card-top">
                          <div className="foodi-branch-avatar-box">
                            <img
                              src={branch.logo || currentRestaurant.logo || "/images/restaurants/McDonalds.png"}
                              alt={branch.name}
                              className="foodi-branch-avatar-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                              }}
                            />
                            <span className="foodi-branch-live-dot" title="Ouvert" />
                          </div>

                          <div className="foodi-branch-info-col">
                            <div className="foodi-branch-name-row">
                              <h4 className="foodi-branch-name-title">{branch.name}</h4>
                              <span className="foodi-branch-tag-pill">{branch.neighborhood}</span>
                            </div>

                            <div className="foodi-branch-address-txt">
                              📍 {branch.address}
                            </div>

                            <div className="foodi-branch-details-row">
                              {branch.phone && (
                                <span className="foodi-branch-phone-link">
                                  📞 {branch.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="foodi-branch-actions-row">
                          <button
                            type="button"
                            className="foodi-btn foodi-btn-outline"
                            style={{ padding: "6px 10px", fontSize: 11, flex: 1 }}
                            onClick={() => handleFocusBranchOnMap(branch)}
                          >
                            📍 Localiser
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${branch.lat || 30.4152},${branch.lng || -9.5426}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="foodi-btn foodi-btn-outline"
                            style={{ padding: "6px 10px", fontSize: 11, textDecoration: "none", textAlign: "center" }}
                          >
                            ↗ Maps
                          </a>
                          <button
                            type="button"
                            className="foodi-btn foodi-btn-outline"
                            style={{ padding: "6px 10px", fontSize: 11 }}
                            onClick={() => handleOpenEditBranch(branch)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="foodi-btn foodi-btn-danger"
                            style={{ padding: "6px 10px", fontSize: 11 }}
                            onClick={() => handleDeleteBranch(branch.id)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="foodi-surface-card">
                <h2 className="foodi-surface-title">Bannière et logo</h2>

                <div className="foodi-banner-box">
                  <img
                    src={profileForm.cover}
                    alt="Bannière"
                    className="foodi-banner-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/banners/1791903178_mpd.jpg";
                    }}
                  />
                  <img
                    src={profileForm.logo}
                    alt="Logo"
                    className="foodi-banner-logo-tag"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/restaurants/McDonalds.png";
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Téléverser une bannière :
                    </div>
                    <input
                      type="file"
                      ref={bannerFileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={handleBannerUpload}
                    />
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-outline"
                      style={{ width: "100%" }}
                      onClick={() => {
                        if (bannerFileInputRef.current) {
                          bannerFileInputRef.current.value = "";
                          bannerFileInputRef.current.click();
                        }
                      }}
                    >
                      Choisir une image
                    </button>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                      Téléverser un logo :
                    </div>
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-outline"
                      style={{ width: "100%" }}
                      onClick={() => {
                        if (logoFileInputRef.current) {
                          logoFileInputRef.current.value = "";
                          logoFileInputRef.current.click();
                        }
                      }}
                    >
                      Choisir une image
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Ou coller le lien web d'une image :
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="foodi-form-input"
                      value={customBannerUrl}
                      onChange={(e) => setCustomBannerUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-primary"
                      onClick={handleApplyCustomBannerUrl}
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>

              <div className="foodi-surface-card">
                <h2 className="foodi-surface-title">Informations de contact</h2>

                <div className="foodi-form-columns">
                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Nom :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          name: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Spécialité :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      value={profileForm.cuisine}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          cuisine: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Quartier principal :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      value={profileForm.neighborhood}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          neighborhood: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Téléphone :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phone: e.target.value
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="foodi-form-field">
                  <label className="foodi-form-label">Adresse siège :</label>
                  <input
                    type="text"
                    className="foodi-form-input"
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        address: e.target.value
                      }))
                    }
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className="foodi-btn foodi-btn-primary" onClick={handleSaveProfile}>
                    Enregistrer les informations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {receiptModalOrder && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setReceiptModalOrder(null)}
        >
          <div
            className="foodi-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">Ticket de caisse</h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setReceiptModalOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <div className="foodi-receipt-voucher">
                <div className="foodi-receipt-header">
                  <div className="foodi-receipt-name">{currentRestaurant.name}</div>
                  <div className="foodi-receipt-sub">
                    {currentRestaurant.address || "Agadir, Maroc"}
                    <br />
                    Tél : {currentRestaurant.phone || "05 28 84 92 10"}
                  </div>
                </div>

                <div className="foodi-receipt-pickup-box">
                  <div style={{ fontSize: 10, color: "#64748B" }}>CODE COURSIER :</div>
                  <div className="foodi-receipt-pickup-val">
                    #{receiptModalOrder.id.slice(-4) || "4921"}
                  </div>
                </div>

                <div className="foodi-receipt-row" style={{ paddingBottom: 6, borderBottom: "1px dashed #CBD5E1", marginBottom: 6 }}>
                  <span>N° COMMANDE :</span>
                  <strong style={{ fontSize: 13, color: "#0D0D0F", letterSpacing: 0.5 }}>
                    {receiptModalOrder.id}
                  </strong>
                </div>

                <div className="foodi-receipt-row">
                  <span>Point de vente :</span>
                  <strong>{getOrderBranchName(receiptModalOrder)}</strong>
                </div>

                <div className="foodi-receipt-row">
                  <span>Date :</span>
                  <span>{receiptModalOrder.date || "Aujourd'hui"}</span>
                </div>

                <div className="foodi-receipt-row">
                  <span>Client :</span>
                  <strong>{receiptModalOrder.customerName || "Client Foodi"}</strong>
                </div>

                <div className="foodi-receipt-row">
                  <span>Téléphone :</span>
                  <span>{receiptModalOrder.customerPhone || "Non renseigné"}</span>
                </div>

                <div className="foodi-receipt-row">
                  <span>Adresse livraison :</span>
                  <span style={{ textAlign: "right", maxWidth: "60%" }}>
                    {receiptModalOrder.address || receiptModalOrder.neighborhood || "Agadir"}
                  </span>
                </div>

                {receiptModalOrder.instructions && (
                  <div className="foodi-receipt-row" style={{ marginTop: 4, fontStyle: "italic", color: "#64748B" }}>
                    <span>Note client :</span>
                    <span style={{ textAlign: "right", maxWidth: "65%" }}>
                      {receiptModalOrder.instructions}
                    </span>
                  </div>
                )}

                <table className="foodi-receipt-table">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>Qté</th>
                      <th>Article</th>
                      <th style={{ textAlign: "right", width: 60 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptModalOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: "bold" }}>{item.quantity}</td>
                        <td>
                          <div>{item.name}</div>
                          {item.options && (
                            <div style={{ fontSize: 9, color: "#64748B" }}>{item.options}</div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>{item.price * item.quantity} DH</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="foodi-receipt-totals">
                  <div className="foodi-receipt-row">
                    <span>Sous-total plats :</span>
                    <strong>{receiptModalOrder.subtotal || receiptModalOrder.total} DH</strong>
                  </div>
                  <div className="foodi-receipt-row">
                    <span>Frais livraison (coursier) :</span>
                    <span>{receiptModalOrder.deliveryFee || 0} DH</span>
                  </div>
                  <div className="foodi-receipt-row" style={{ borderTop: "1px dashed #94A3B8", paddingTop: 4, marginTop: 4 }}>
                    <span>Total payé par client :</span>
                    <span>{receiptModalOrder.total} DH</span>
                  </div>
                  <div className="foodi-receipt-grand-total">
                    <span>À encaisser restaurant :</span>
                    <span>{receiptModalOrder.subtotal || receiptModalOrder.total} DH</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  onClick={() => setReceiptModalOrder(null)}
                >
                  Fermer
                </button>
                <button
                  className="foodi-btn foodi-btn-primary"
                  onClick={() => window.print()}
                >
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {driverModalOrder && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setDriverModalOrder(null)}
        >
          <div
            className="foodi-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="foodi-driver-avatar-circle">
                  🛵
                </div>
                <div>
                  <h3 className="foodi-modal-title">Informations livreur</h3>
                  <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                    Commande #{driverModalOrder.id}
                  </div>
                </div>
              </div>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setDriverModalOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <div className="foodi-driver-modal-hero">
                <div className="foodi-driver-modal-id-badge">
                  <span style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                    N° Commande
                  </span>
                  <span className="foodi-driver-modal-id-val">
                    {driverModalOrder.id}
                  </span>
                </div>

                <div className="foodi-driver-modal-code-badge">
                  <span style={{ fontSize: 11, color: "#0369A1", textTransform: "uppercase", fontWeight: 700 }}>
                    Code coursier
                  </span>
                  <span className="foodi-driver-modal-code-val">
                    #{driverModalOrder.id.slice(-4) || "4921"}
                  </span>
                </div>
              </div>

              <div className="foodi-driver-modal-card">
                <div className="foodi-driver-modal-profile">
                  <div className="foodi-driver-modal-photo">
                    {driverModalOrder.courierName ? driverModalOrder.courierName.charAt(0) : "L"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="foodi-driver-modal-name">
                      {driverModalOrder.courierName || "Livreur Foodi"}
                    </div>
                    <div className="foodi-driver-modal-vehicle">
                      Coursier partenaire Foodi • Scooter
                    </div>
                  </div>
                  <span className="foodi-driver-modal-verified-tag">✓ Vérifié</span>
                </div>

                <div className="foodi-driver-modal-details-grid">
                  <div className="foodi-driver-detail-item">
                    <span className="foodi-driver-detail-label">Téléphone :</span>
                    <a
                      href={`tel:${driverModalOrder.courierPhone || "0662102030"}`}
                      className="foodi-driver-detail-value foodi-driver-phone-link"
                    >
                      📞 {driverModalOrder.courierPhone || "+212 6 62 10 20 30"}
                    </a>
                  </div>

                  <div className="foodi-driver-detail-item">
                    <span className="foodi-driver-detail-label">Succursale :</span>
                    <span className="foodi-driver-detail-value">
                      📍 {getOrderBranchName(driverModalOrder)}
                    </span>
                  </div>

                  <div className="foodi-driver-detail-item">
                    <span className="foodi-driver-detail-label">Statut course :</span>
                    <span className="foodi-driver-detail-value">
                      {driverModalOrder.status === "heading_to_restaurant"
                        ? "En route vers le restaurant"
                        : driverModalOrder.status === "in_delivery"
                        ? "En livraison chez le client"
                        : driverModalOrder.status === "delivered"
                        ? "Commande remise et terminée"
                        : "Assigné à la commande"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="foodi-driver-payment-callout">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>
                  Règlement coursier
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D0F" }}>
                    {driverModalOrder.paymentMethod === "cash"
                      ? "À encaisser du coursier en espèces :"
                      : "Payé en ligne par carte (net restaurant) :"}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#10B981" }}>
                    {driverModalOrder.subtotal || Math.max(0, driverModalOrder.total - (driverModalOrder.deliveryFee || 0))} DH
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>
                  {driverModalOrder.paymentMethod === "cash"
                    ? "Le livreur vous remet cette somme en espèces lors du retrait de la commande."
                    : "Règlement automatique par carte, 0 DH d'espèces à réclamer."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setDriverModalOrder(null)}
                >
                  Fermer
                </button>
                <a
                  href={`tel:${driverModalOrder.courierPhone || "0662102030"}`}
                  className="foodi-btn foodi-btn-primary"
                  style={{ flex: 1, textDecoration: "none" }}
                >
                  Appeler le livreur
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {verifyCodeModalOrder && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setVerifyCodeModalOrder(null)}
        >
          <div
            className="foodi-modal-container"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">Validation code coursier</h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setVerifyCodeModalOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                Saisissez le code à 4 chiffres présenté par le livreur.
              </p>

              <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="Ex: 4921"
                  value={courierInputCode}
                  onChange={(e) => {
                    setCourierInputCode(e.target.value);
                    setCodeVerificationError(null);
                  }}
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 4,
                    textAlign: "center",
                    padding: "8px 14px",
                    border: "2px solid #CBD5E1",
                    borderRadius: 10,
                    outline: "none",
                    width: "180px"
                  }}
                />
              </div>

              {codeVerificationError && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    color: "#EF4444",
                    padding: "6px 10px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: "center"
                  }}
                >
                  {codeVerificationError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setVerifyCodeModalOrder(null)}
                >
                  Annuler
                </button>
                <button
                  className="foodi-btn foodi-btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleVerifyCourierCode}
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dishModalMode && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setDishModalMode(null)}
        >
          <div
            className="foodi-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">
                {dishModalMode === "add" ? "Ajouter un plat" : "Modifier le plat"}
              </h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setDishModalMode(null)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <div className="foodi-form-field">
                <label className="foodi-form-label">Catégorie :</label>
                <select
                  className="foodi-form-select"
                  value={dishForm.categoryId}
                  onChange={(e) =>
                    setDishForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                >
                  {currentRestaurant.categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="foodi-form-field">
                <label className="foodi-form-label">Nom du plat :</label>
                <input
                  type="text"
                  className="foodi-form-input"
                  placeholder="Ex: Double Cheese Burger"
                  value={dishForm.name}
                  onChange={(e) =>
                    setDishForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="foodi-form-field">
                <label className="foodi-form-label">Description :</label>
                <textarea
                  className="foodi-form-textarea"
                  rows={2}
                  placeholder="Ingrédients, taille..."
                  value={dishForm.description}
                  onChange={(e) =>
                    setDishForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="foodi-form-columns">
                <div className="foodi-form-field">
                  <label className="foodi-form-label">Prix (DH) :</label>
                  <input
                    type="number"
                    className="foodi-form-input"
                    min={1}
                    value={dishForm.price}
                    onChange={(e) =>
                      setDishForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value)
                      }))
                    }
                  />
                </div>

                <div className="foodi-form-field">
                  <label className="foodi-form-label">Prix promo (DH) :</label>
                  <input
                    type="number"
                    className="foodi-form-input"
                    min={0}
                    value={dishForm.promoPrice}
                    onChange={(e) =>
                      setDishForm((prev) => ({
                        ...prev,
                        promoPrice: Number(e.target.value)
                      }))
                    }
                  />
                </div>
              </div>

              <div className="foodi-form-field">
                <label className="foodi-form-label">Photo :</label>
                <input
                  type="file"
                  ref={dishFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleDishImageUpload}
                />
                <div
                  className="foodi-dropzone-box"
                  onClick={() => dishFileInputRef.current?.click()}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0D0D0F" }}>
                    Choisir une photo depuis votre appareil
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    Formats JPG, PNG, WebP
                  </span>
                </div>

                {dishForm.image && (
                  <div style={{ width: 140, height: 90, borderRadius: 8, overflow: "hidden", marginTop: 8, border: "1px solid #E2E8F0" }}>
                    <img src={dishForm.image} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setDishModalMode(null)}
                >
                  Annuler
                </button>
                <button
                  className="foodi-btn foodi-btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleSaveDish}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newCategoryModalOpen && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setNewCategoryModalOpen(false)}
        >
          <div
            className="foodi-modal-container"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">Nouvelle catégorie</h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setNewCategoryModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <div className="foodi-form-field">
                <label className="foodi-form-label">Nom de la catégorie :</label>
                <input
                  type="text"
                  autoFocus
                  className="foodi-form-input"
                  placeholder="Ex: Tacos, Boissons, Desserts..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setNewCategoryModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="foodi-btn foodi-btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleCreateCategory}
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editCategoryModalOpen && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setEditCategoryModalOpen(false)}
        >
          <div
            className="foodi-modal-container"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">Renommer la catégorie</h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setEditCategoryModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-modal-body">
              <div className="foodi-form-field">
                <label className="foodi-form-label">Nouveau nom :</label>
                <input
                  type="text"
                  autoFocus
                  className="foodi-form-input"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  className="foodi-btn foodi-btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setEditCategoryModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="foodi-btn foodi-btn-primary"
                  style={{ flex: 2 }}
                  onClick={handleRenameCategory}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {branchModalMode && (
        <div
          className="foodi-modal-backdrop"
          onClick={() => setBranchModalMode(null)}
        >
          <div
            className="foodi-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">
                {branchModalMode === "add" ? "Ajouter un point de vente" : "Modifier la succursale"}
              </h3>
              <button
                className="foodi-modal-close-btn"
                onClick={() => setBranchModalMode(null)}
              >
                ✕
              </button>
            </div>

            <div className="foodi-wizard-stepper">
              <div
                className={`foodi-wizard-step-node ${branchWizardStep === 1 ? "active" : branchWizardStep > 1 ? "completed" : ""}`}
                onClick={() => setBranchWizardStep(1)}
              >
                <div className="foodi-wizard-step-circle">{branchWizardStep > 1 ? "✓" : "1"}</div>
                <span className="foodi-wizard-step-label">1. Infos & Logo</span>
              </div>

              <div className={`foodi-wizard-step-connector ${branchWizardStep > 1 ? "completed" : ""}`} />

              <div
                className={`foodi-wizard-step-node ${branchWizardStep === 2 ? "active" : branchWizardStep > 2 ? "completed" : ""}`}
                onClick={() => {
                  if (branchForm.name.trim()) setBranchWizardStep(2);
                }}
              >
                <div className="foodi-wizard-step-circle">{branchWizardStep > 2 ? "✓" : "2"}</div>
                <span className="foodi-wizard-step-label">2. Localisation carte</span>
              </div>

              <div className={`foodi-wizard-step-connector ${branchWizardStep > 2 ? "completed" : ""}`} />

              <div
                className={`foodi-wizard-step-node ${branchWizardStep === 3 ? "active" : ""}`}
                onClick={() => {
                  if (branchForm.name.trim()) setBranchWizardStep(3);
                }}
              >
                <div className="foodi-wizard-step-circle">3</div>
                <span className="foodi-wizard-step-label">3. Aperçu & Fiche</span>
              </div>
            </div>

            <div className="foodi-modal-body">
              {branchWizardStep === 1 && (
                <div>
                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Nom du point de vente * :</label>
                    <input
                      type="text"
                      autoFocus
                      className="foodi-form-input"
                      placeholder="Ex: McDonald's Adrar Kitea"
                      value={branchForm.name}
                      onChange={(e) =>
                        setBranchForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="foodi-form-columns">
                    <div className="foodi-form-field">
                      <label className="foodi-form-label">Quartier d'Agadir :</label>
                      <input
                        type="text"
                        className="foodi-form-input"
                        placeholder="Ex: Adrar, Dakhla, Front de Mer..."
                        value={branchForm.neighborhood}
                        onChange={(e) =>
                          setBranchForm((prev) => ({ ...prev, neighborhood: e.target.value }))
                        }
                      />
                    </div>

                    <div className="foodi-form-field">
                      <label className="foodi-form-label">Téléphone direct :</label>
                      <input
                        type="text"
                        className="foodi-form-input"
                        placeholder="Ex: 05 28 22 33 44"
                        value={branchForm.phone}
                        onChange={(e) =>
                          setBranchForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Adresse :</label>
                    <input
                      type="text"
                      className="foodi-form-input"
                      placeholder="Ex: Centre Commercial Kitea Géant, Zone Adrar"
                      value={branchForm.address}
                      onChange={(e) =>
                        setBranchForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                    />
                  </div>

                  <div className="foodi-form-field">
                    <label className="foodi-form-label">Logo / Photo de la succursale :</label>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="foodi-branch-avatar-box" style={{ width: 60, height: 60 }}>
                        <img
                          src={branchForm.logo || currentRestaurant.logo || "/images/restaurants/McDonalds.png"}
                          alt="Logo succursale"
                          className="foodi-branch-avatar-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          type="file"
                          ref={branchLogoInputRef}
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: "none" }}
                          onChange={handleBranchLogoUpload}
                        />
                        <button
                          type="button"
                          className="foodi-btn foodi-btn-outline"
                          style={{ fontSize: 12, padding: "5px 10px" }}
                          onClick={() => branchLogoInputRef.current?.click()}
                        >
                          📷 Choisir une photo / logo
                        </button>
                        <input
                          type="url"
                          placeholder="Ou coller une URL d'image..."
                          className="foodi-form-input"
                          style={{ fontSize: 11, padding: "4px 8px" }}
                          value={branchForm.logo}
                          onChange={(e) =>
                            setBranchForm((prev) => ({ ...prev, logo: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => setBranchModalMode(null)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-primary"
                      style={{ flex: 2 }}
                      onClick={() => {
                        if (!branchForm.name.trim()) {
                          alert("Veuillez renseigner le nom de la succursale.");
                          return;
                        }
                        setBranchWizardStep(2);
                      }}
                    >
                      Étape suivante : Carte →
                    </button>
                  </div>
                </div>
              )}

              {branchWizardStep === 2 && (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0D0D0F" }}>
                      Positionnement sur la carte Agadir
                    </div>
                  </div>

                  <div className="foodi-quick-geo-pills">
                    {AGADIR_POPULAR_ZONES.map((zone) => (
                      <button
                        key={zone.name}
                        type="button"
                        className="foodi-quick-geo-btn"
                        onClick={() => handleSetQuickZone(zone)}
                      >
                        📍 {zone.name}
                      </button>
                    ))}
                  </div>

                  <div
                    ref={branchMapContainerRef}
                    className="foodi-branch-map-container"
                  />

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => setBranchWizardStep(1)}
                    >
                      ← Précédent
                    </button>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-primary"
                      style={{ flex: 2 }}
                      onClick={() => setBranchWizardStep(3)}
                    >
                      Étape 3 : Aperçu →
                    </button>
                  </div>
                </div>
              )}

              {branchWizardStep === 3 && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0D0D0F" }}>
                      Aperçu de la fiche
                    </div>
                  </div>

                  <div className="foodi-branch-preview-card">
                    <img
                      src={branchForm.logo || currentRestaurant.logo || "/images/restaurants/McDonalds.png"}
                      alt={branchForm.name}
                      className="foodi-branch-preview-logo"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0D0D0F" }}>
                          {branchForm.name || "Succursale"}
                        </h4>
                        <span className="foodi-branch-tag-pill">{branchForm.neighborhood}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>
                        📍 {branchForm.address}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {branchForm.phone && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#FF7A00" }}>
                            📞 {branchForm.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-outline"
                      style={{ flex: 1 }}
                      onClick={() => setBranchWizardStep(2)}
                    >
                      ← Modifier la carte
                    </button>
                    <button
                      type="button"
                      className="foodi-btn foodi-btn-primary"
                      style={{ flex: 2 }}
                      onClick={handleSaveBranch}
                    >
                      ✅ Enregistrer le point de vente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboardPage;
