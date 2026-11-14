import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/admin.css";
import { getStoredRestaurants } from "../services/api";
import { useApp } from "../context/AppContext";

interface DriverReview {
  id: string;
  author: string;
  role: "Client" | "Restaurant";
  date: string;
  rating: number;
  comment: string;
}

interface AdminCourier {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  cin: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  vehicleType: "motorcycle" | "car" | "bicycle";
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  licenseNumber: string;
  status: "pending" | "active" | "suspended" | "rejected";
  appliedDate: string;
  rating: number;
  totalDeliveries: number;
  assignedOrdersCount: number;
  photoUrl: string;
  documents: {
    cinPhotoUrl: string;
    cinBackUrl: string;
    licensePhotoUrl: string;
    registrationCardUrl: string;
    insuranceUrl: string;
  };
  reviews: DriverReview[];
}

interface RestaurantBranch {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
}

interface AdminRestaurant {
  id: string;
  name: string;
  managerName: string;
  phone: string;
  email: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  rcNumber: string;
  iceNumber: string;
  branchesCount: number;
  commissionRate: number;
  deliveryPricingMode: "km" | "fixed";
  customDeliveryFee: number;
  status: "pending" | "active" | "suspended" | "rejected";
  appliedDate: string;
  logo: string;
  rating: number;
  totalOrders: number;
  avgPrepMinutes: number;
  branches: RestaurantBranch[];
}

interface PlatformPricingSettings {
  pricePerKm: number;
  minDeliveryFee: number;
  smallOrderThreshold: number;
  smallOrderFee: number;
  defaultCommissionRate: number;
  serviceStatus: "active" | "maintenance" | "closed";
  supportPhone: string;
  supportEmail: string;
}

const DEFAULT_REVIEWS: DriverReview[] = [];
const AGADIR_20_COURIERS: AdminCourier[] = [];
const DEFAULT_PRICING: PlatformPricingSettings = { pricePerKm: 4, minDeliveryFee: 8, smallOrderThreshold: 50, smallOrderFee: 5, defaultCommissionRate: 15, serviceStatus: "active", supportPhone: "+212 5 28 84 92 10", supportEmail: "supervision@foodi.ma" };
const BASE_PENDING_RESTAURANTS: AdminRestaurant[] = [];

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const routeParams = useParams<{ id?: string }>();
  const { logout } = useApp();

  const [activeTab, setActiveTab] = useState<
    "vue" | "livreurs" | "dossiers_livreurs" | "restaurants" | "dossiers_restaurants" | "commandes" | "tarifs" | "parametres"
  >("vue");

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [viewingDriverDossierId, setViewingDriverDossierId] = useState<string | null>(null);
  const [viewingRestauDossierId, setViewingRestauDossierId] = useState<string | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(routeParams.id || null);

  const [zoomImage, setZoomImage] = useState<{ title: string; url: string } | null>(null);

  const [couriers, setCouriers] = useState<AdminCourier[]>(() => {
    try {
      const stored = localStorage.getItem("foodi_admin_couriers_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any, idx: number) => ({
            id: c.id || `DRV-${101 + idx}`,
            fullName: c.fullName || "Livreur Foodi",
            phone: c.phone || "+212 6 62 10 20 30",
            email: c.email || `${(c.fullName || "driver").toLowerCase().replace(/\s+/g, ".")}@foodi.ma`,
            cin: c.cin || "JA184920",
            lat: typeof c.lat === "number" ? c.lat : 30.415,
            lng: typeof c.lng === "number" ? c.lng : -9.580,
            isOnline: Boolean(c.isOnline),
            vehicleType: c.vehicleType || "motorcycle",
            vehicleBrand: c.vehicleBrand || "Yamaha",
            vehicleModel: c.vehicleModel || "Neo's",
            vehiclePlate: c.vehiclePlate || "48291-A-33",
            licenseNumber: c.licenseNumber || "PER-09281-A",
            status: c.status || "active",
            appliedDate: c.appliedDate || "15 Octobre 2026",
            rating: typeof c.rating === "number" ? c.rating : 4.9,
            totalDeliveries: typeof c.totalDeliveries === "number" ? c.totalDeliveries : 42,
            assignedOrdersCount: typeof c.assignedOrdersCount === "number" ? c.assignedOrdersCount : (c.totalDeliveries || 42) + 5,
            photoUrl: c.photoUrl || "/images/ui/driver-reference.jpg",
            documents: c.documents && c.documents.cinPhotoUrl ? c.documents : {
              cinPhotoUrl: "/images/auth/phone-login.png",
              cinBackUrl: "/images/auth/phone-login.png",
              licensePhotoUrl: "/images/auth/phone-register.jpg",
              registrationCardUrl: "/images/auth/adphonee.jpg",
              insuranceUrl: "/images/auth/phone-forgot.png"
            },
            reviews: Array.isArray(c.reviews) && c.reviews.length > 0 ? c.reviews : DEFAULT_REVIEWS
          }));
        }
      }
    } catch {}
    return AGADIR_20_COURIERS;
  });

  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>(() => {
    const baseList: AdminRestaurant[] = (getStoredRestaurants() as any[]).map((r, idx) => ({
      id: r.id || `REST-${idx + 1}`,
      name: r.name,
      managerName: r.name === "Crusty" ? "Karim Benjelloun" : r.name === "McDonald's" ? "Direction Régionale Souss" : "Gérant Partenaire",
      phone: r.phone || "05 28 84 92 10",
      email: `${r.slug || "contact"}@foodi.ma`,
      cuisine: r.cuisine || "Restauration",
      neighborhood: r.neighborhood || "Agadir",
      address: r.address || "Agadir, Maroc",
      rcNumber: `RC-${28000 + idx}`,
      iceNumber: `00${281920000 + idx}00084`,
      branchesCount: (r.branches && r.branches.length) || 1,
      commissionRate: 15,
      deliveryPricingMode: "km",
      customDeliveryFee: r.deliveryFee || 12,
      status: "active",
      appliedDate: "10 Septembre 2026",
      logo: r.logo || "/images/restaurants/crusti.jpg",
      rating: r.rating || 4.8,
      totalOrders: 140 + idx * 15,
      avgPrepMinutes: r.avgPrepMinutes || 20,
      branches: Array.isArray(r.branches) && r.branches.length > 0
        ? r.branches.map((b: any, bIdx: number) => ({
            id: b.id || `b_${bIdx}`,
            name: b.name,
            neighborhood: b.neighborhood,
            address: b.address,
            lat: b.lat || 30.415,
            lng: b.lng || -9.562,
            phone: b.phone || "05 28 22 33 44"
          }))
        : [
            {
              id: `${r.id}_b1`,
              name: `${r.name} (Centre)`,
              neighborhood: r.neighborhood || "Agadir",
              address: r.address || "Agadir, Maroc",
              lat: 30.415,
              lng: -9.562,
              phone: r.phone || "05 28 84 92 10"
            }
          ]
    }));

    try {
      const stored = localStorage.getItem("foodi_admin_restaurants");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            branches: Array.isArray(item.branches) && item.branches.length > 0
              ? item.branches
              : [
                  {
                    id: `${item.id}_b1`,
                    name: `${item.name} (Agadir)`,
                    neighborhood: item.neighborhood || "Agadir",
                    address: item.address || "Agadir, Maroc",
                    lat: 30.415,
                    lng: -9.562,
                    phone: item.phone || "05 28 84 92 10"
                  }
                ],
            customDeliveryFee: item.customDeliveryFee ?? (item.deliveryFee || 12),
            deliveryPricingMode: item.deliveryPricingMode || "km"
          }));
        }
      }
    } catch {}

    return [...BASE_PENDING_RESTAURANTS, ...baseList];
  });

  const [ordersList, setOrdersList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("foodi_admin_orders");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [pricingSettings, setPricingSettings] = useState<PlatformPricingSettings>(() => {
    try {
      const stored = localStorage.getItem("foodi_admin_pricing");
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_PRICING;
  });

  const [showAddDriverModal, setShowAddDriverModal] = useState<boolean>(false);
  const [showAddRestauModal, setShowAddRestauModal] = useState<boolean>(false);

  const [driverEditForm, setDriverEditForm] = useState<{
    fullName: string;
    phone: string;
    email: string;
    cin: string;
    vehicleType: "motorcycle" | "car" | "bicycle";
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    licenseNumber: string;
    isOnline: boolean;
    status: "active" | "pending" | "suspended" | "rejected";
  } | null>(null);

  const [restauEditForm, setRestauEditForm] = useState<{
    name: string;
    managerName: string;
    phone: string;
    email: string;
    cuisine: string;
    neighborhood: string;
    address: string;
    rcNumber: string;
    iceNumber: string;
    commissionRate: number;
    deliveryPricingMode: "km" | "fixed";
    customDeliveryFee: number;
    avgPrepMinutes: number;
    status: "active" | "pending" | "suspended" | "rejected";
  } | null>(null);

  const [newDriverForm, setNewDriverForm] = useState<{
    fullName: string;
    phone: string;
    email: string;
    cin: string;
    vehicleType: "motorcycle" | "car" | "bicycle";
    vehicleBrand: string;
    vehicleModel: string;
    vehiclePlate: string;
    licenseNumber: string;
  }>({
    fullName: "",
    phone: "",
    email: "",
    cin: "",
    vehicleType: "motorcycle",
    vehicleBrand: "Yamaha",
    vehicleModel: "Neo's",
    vehiclePlate: "28-A-190",
    licenseNumber: "MA-28100"
  });

  const [newRestauForm, setNewRestauForm] = useState<{
    name: string;
    managerName: string;
    phone: string;
    email: string;
    cuisine: string;
    neighborhood: string;
    address: string;
    rcNumber: string;
    iceNumber: string;
    commissionRate: number;
    deliveryPricingMode: "km" | "fixed";
    customDeliveryFee: number;
    avgPrepMinutes: number;
  }>({
    name: "",
    managerName: "",
    phone: "",
    email: "",
    cuisine: "Fast-food & Burgers",
    neighborhood: "Talborjt",
    address: "Avenue Hassan II, Agadir",
    rcNumber: "RC-28950",
    iceNumber: "00289123400084",
    commissionRate: 15,
    deliveryPricingMode: "km",
    customDeliveryFee: 12,
    avgPrepMinutes: 20
  });

  const [toastMessage, setToastMessage] = useState<string>("");

  const orderMapRef = useRef<HTMLDivElement | null>(null);
  const orderMapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_admin_couriers_v2", JSON.stringify(couriers));
    } catch {}
  }, [couriers]);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_admin_restaurants", JSON.stringify(restaurants));
    } catch {}
  }, [restaurants]);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_admin_orders", JSON.stringify(ordersList));
    } catch {}
  }, [ordersList]);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_admin_pricing", JSON.stringify(pricingSettings));
    } catch {}
  }, [pricingSettings]);

  useEffect(() => {
    if (routeParams.id) {
      setViewingOrderId(routeParams.id);
      setActiveTab("commandes");
    }
  }, [routeParams.id]);

  useEffect(() => {
    if (!viewingOrderId) {
      if (orderMapInstanceRef.current) {
        orderMapInstanceRef.current.remove();
        orderMapInstanceRef.current = null;
      }
      if (orderMapRef.current && (orderMapRef.current as any)._leaflet_id) {
        delete (orderMapRef.current as any)._leaflet_id;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!orderMapRef.current) return;
      if (orderMapInstanceRef.current) {
        orderMapInstanceRef.current.remove();
        orderMapInstanceRef.current = null;
      }
      if (orderMapRef.current && (orderMapRef.current as any)._leaflet_id) {
        delete (orderMapRef.current as any)._leaflet_id;
      }

      const order = ordersList.find((o) => o.id === viewingOrderId);
      if (!order) return;

      const restLat = order.shopLat || 30.415;
      const restLng = order.shopLng || -9.562;
      const custLat = order.lat || 30.396;
      const custLng = order.lng || -9.559;
      const drvLat = order.courierLat || 30.405;
      const drvLng = order.courierLng || -9.555;

      const map = L.map(orderMapRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([restLat, restLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const restIcon = L.divIcon({
        className: "foodi-map-icon",
        html: `<div style="background:#FF7A00;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:14px;"><i class="fa-solid fa-utensils"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker([restLat, restLng], { icon: restIcon })
        .addTo(map)
        .bindPopup(`<b>${order.restaurantName}</b><br/>Restaurant`);

      const custIcon = L.divIcon({
        className: "foodi-map-icon",
        html: `<div style="background:#0D0D0F;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:14px;"><i class="fa-solid fa-house"></i></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker([custLat, custLng], { icon: custIcon })
        .addTo(map)
        .bindPopup(`<b>Client : ${order.customerName || "Client"}</b><br/>${order.address || "Agadir"}`);

      const drvIcon = L.divIcon({
        className: "foodi-map-icon",
        html: `<div style="background:#10B981;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:15px;"><i class="fa-solid fa-motorcycle"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker([drvLat, drvLng], { icon: drvIcon })
        .addTo(map)
        .bindPopup(`<b>Livreur : ${order.courierName || "Livreur Foodi"}</b><br/>En direct`);

      const latlngs: [number, number][] = [
        [drvLat, drvLng],
        [restLat, restLng],
        [custLat, custLng]
      ];
      L.polyline(latlngs, { color: "#FF7A00", weight: 4, dashArray: "6, 8" }).addTo(map);

      map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });

      orderMapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (orderMapInstanceRef.current) {
        orderMapInstanceRef.current.remove();
        orderMapInstanceRef.current = null;
      }
      if (orderMapRef.current && (orderMapRef.current as any)._leaflet_id) {
        delete (orderMapRef.current as any)._leaflet_id;
      }
    };
  }, [viewingOrderId, ordersList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const pendingCouriers = useMemo(() => {
    return couriers.filter((c) => c.status === "pending");
  }, [couriers]);

  const pendingRestaurants = useMemo(() => {
    return restaurants.filter((r) => r.status === "pending");
  }, [restaurants]);

  const onlineCouriersCount = useMemo(() => {
    return couriers.filter((c) => c.isOnline).length;
  }, [couriers]);

  const totalRevenue = useMemo(() => {
    return ordersList.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [ordersList]);

  const totalFoodiCommission = useMemo(() => {
    return ordersList.reduce((acc, curr) => {
      const subtotal = Number(curr.subtotal) || Math.max(0, (Number(curr.total) || 0) - (Number(curr.deliveryFee) || 0));
      return acc + Math.round(subtotal * (pricingSettings.defaultCommissionRate / 100));
    }, 0);
  }, [ordersList, pricingSettings.defaultCommissionRate]);

  const filteredCouriers = useMemo(() => {
    return couriers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.vehiclePlate.toLowerCase().includes(q) ||
        c.cin.toLowerCase().includes(q)
      );
    });
  }, [couriers, searchQuery]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.managerName.toLowerCase().includes(q)
      );
    });
  }, [restaurants, searchQuery]);

  const handleUpdateCourierStatus = (id: string, newStatus: "active" | "suspended" | "rejected") => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    const label = newStatus === "active" ? "validé" : newStatus === "suspended" ? "suspendu" : "refusé";
    showToast(`Livreur ${label}`);
  };

  const handleUpdateRestaurantStatus = (id: string, newStatus: "active" | "suspended" | "rejected") => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    const label = newStatus === "active" ? "validé" : newStatus === "suspended" ? "suspendu" : "refusé";
    showToast(`Restaurant ${label}`);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Tarifs sauvegardés");
  };

  useEffect(() => {
    if (viewingDriverDossierId) {
      const c = couriers.find((x) => String(x.id).toLowerCase() === String(viewingDriverDossierId).toLowerCase());
      if (c) {
        setDriverEditForm({
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          cin: c.cin,
          vehicleType: c.vehicleType,
          vehicleBrand: c.vehicleBrand,
          vehicleModel: c.vehicleModel,
          vehiclePlate: c.vehiclePlate,
          licenseNumber: c.licenseNumber,
          isOnline: c.isOnline,
          status: c.status
        });
      }
    } else {
      setDriverEditForm(null);
    }
  }, [viewingDriverDossierId, couriers]);

  useEffect(() => {
    if (viewingRestauDossierId) {
      const r = restaurants.find((x) => String(x.id).toLowerCase() === String(viewingRestauDossierId).toLowerCase());
      if (r) {
        setRestauEditForm({
          name: r.name,
          managerName: r.managerName,
          phone: r.phone,
          email: r.email,
          cuisine: r.cuisine,
          neighborhood: r.neighborhood,
          address: r.address,
          rcNumber: r.rcNumber,
          iceNumber: r.iceNumber,
          commissionRate: r.commissionRate,
          deliveryPricingMode: r.deliveryPricingMode,
          customDeliveryFee: r.customDeliveryFee,
          avgPrepMinutes: r.avgPrepMinutes,
          status: r.status
        });
      }
    } else {
      setRestauEditForm(null);
    }
  }, [viewingRestauDossierId, restaurants]);

  const handleSaveDriverDossier = () => {
    if (!viewingDriverDossierId || !activeDriverDossier) return;
    const current = driverEditForm || {
      fullName: activeDriverDossier.fullName,
      phone: activeDriverDossier.phone,
      email: activeDriverDossier.email,
      cin: activeDriverDossier.cin,
      vehicleType: activeDriverDossier.vehicleType || "motorcycle",
      vehicleBrand: activeDriverDossier.vehicleBrand,
      vehicleModel: activeDriverDossier.vehicleModel,
      vehiclePlate: activeDriverDossier.vehiclePlate,
      licenseNumber: activeDriverDossier.licenseNumber || "MA-28000",
      isOnline: Boolean(activeDriverDossier.isOnline),
      status: activeDriverDossier.status
    };
    setCouriers((prev) =>
      prev.map((c) =>
        String(c.id).toLowerCase() === String(viewingDriverDossierId).toLowerCase()
          ? {
              ...c,
              ...current
            }
          : c
      )
    );
    showToast("Dossier livreur mis à jour");
  };

  const handleUpdateDriverField = (field: string, value: any) => {
    if (!activeDriverDossier) return;
    setDriverEditForm((prev) => {
      const base = prev || {
        fullName: activeDriverDossier.fullName,
        phone: activeDriverDossier.phone,
        email: activeDriverDossier.email,
        cin: activeDriverDossier.cin,
        vehicleType: activeDriverDossier.vehicleType || "motorcycle",
        vehicleBrand: activeDriverDossier.vehicleBrand,
        vehicleModel: activeDriverDossier.vehicleModel,
        vehiclePlate: activeDriverDossier.vehiclePlate,
        licenseNumber: activeDriverDossier.licenseNumber || "MA-28000",
        isOnline: Boolean(activeDriverDossier.isOnline),
        status: activeDriverDossier.status
      };
      return {
        ...base,
        [field]: value
      };
    });
  };

  const handleSaveRestauDossier = () => {
    if (!viewingRestauDossierId || !activeRestauDossier) return;
    const current = restauEditForm || {
      name: activeRestauDossier.name,
      managerName: activeRestauDossier.managerName,
      phone: activeRestauDossier.phone,
      email: activeRestauDossier.email,
      cuisine: activeRestauDossier.cuisine,
      neighborhood: activeRestauDossier.neighborhood,
      address: activeRestauDossier.address,
      rcNumber: activeRestauDossier.rcNumber,
      iceNumber: activeRestauDossier.iceNumber,
      commissionRate: activeRestauDossier.commissionRate,
      deliveryPricingMode: activeRestauDossier.deliveryPricingMode,
      customDeliveryFee: activeRestauDossier.customDeliveryFee,
      avgPrepMinutes: activeRestauDossier.avgPrepMinutes,
      status: activeRestauDossier.status
    };
    setRestaurants((prev) =>
      prev.map((r) =>
        String(r.id).toLowerCase() === String(viewingRestauDossierId).toLowerCase()
          ? {
              ...r,
              ...current
            }
          : r
      )
    );
    showToast("Dossier restaurant mis à jour");
  };

  const handleUpdateRestauField = (field: string, value: any) => {
    if (!activeRestauDossier) return;
    setRestauEditForm((prev) => {
      const base = prev || {
        name: activeRestauDossier.name,
        managerName: activeRestauDossier.managerName,
        phone: activeRestauDossier.phone,
        email: activeRestauDossier.email,
        cuisine: activeRestauDossier.cuisine,
        neighborhood: activeRestauDossier.neighborhood,
        address: activeRestauDossier.address,
        rcNumber: activeRestauDossier.rcNumber,
        iceNumber: activeRestauDossier.iceNumber,
        commissionRate: activeRestauDossier.commissionRate,
        deliveryPricingMode: activeRestauDossier.deliveryPricingMode,
        customDeliveryFee: activeRestauDossier.customDeliveryFee,
        avgPrepMinutes: activeRestauDossier.avgPrepMinutes,
        status: activeRestauDossier.status
      };
      return {
        ...base,
        [field]: value
      };
    });
  };

  const handleCreateDriverDemand = () => {
    if (!newDriverForm.fullName || !newDriverForm.phone || !newDriverForm.cin) {
      showToast("Veuillez renseigner les champs obligatoires");
      return;
    }
    const randPart = Array.from({ length: 4 }, () => Math.random().toString(36).substring(2, 6)).join("-");
    const newId = `drv-${Date.now().toString(36)}-${randPart}`;
    const newCourier: AdminCourier = {
      id: newId,
      fullName: newDriverForm.fullName,
      phone: newDriverForm.phone,
      email: newDriverForm.email || `${newDriverForm.fullName.toLowerCase().replace(/\s+/g, ".")}@foodi-driver.ma`,
      cin: newDriverForm.cin,
      lat: 30.415,
      lng: -9.580,
      isOnline: false,
      vehicleType: newDriverForm.vehicleType,
      vehicleBrand: newDriverForm.vehicleBrand || "Yamaha",
      vehicleModel: newDriverForm.vehicleModel || "Neo's",
      vehiclePlate: newDriverForm.vehiclePlate || "99-A-28",
      licenseNumber: newDriverForm.licenseNumber || "MA-28000",
      status: "pending",
      appliedDate: "Aujourd'hui",
      rating: 5.0,
      totalDeliveries: 0,
      assignedOrdersCount: 0,
      photoUrl: `/data/drivers/${newId}/avatar.jpg`,
      documents: {
        cinPhotoUrl: `/data/drivers/${newId}/cin_recto.png`,
        cinBackUrl: `/data/drivers/${newId}/cin_verso.png`,
        licensePhotoUrl: `/data/drivers/${newId}/permis.jpg`,
        registrationCardUrl: `/data/drivers/${newId}/carte_grise.jpg`,
        insuranceUrl: `/data/drivers/${newId}/assurance.png`
      },
      reviews: []
    };
    setCouriers((prev) => [newCourier, ...prev]);
    setShowAddDriverModal(false);
    setNewDriverForm({
      fullName: "",
      phone: "",
      email: "",
      cin: "",
      vehicleType: "motorcycle",
      vehicleBrand: "Yamaha",
      vehicleModel: "Neo's",
      vehiclePlate: "28-A-190",
      licenseNumber: "MA-28100"
    });
    showToast("Candidature livreur ajoutée");
  };

  const handleCreateRestauDemand = () => {
    if (!newRestauForm.name || !newRestauForm.phone || !newRestauForm.managerName) {
      showToast("Veuillez renseigner les champs obligatoires");
      return;
    }
    const newRestaurant: AdminRestaurant = {
      id: `REST-${Date.now().toString().slice(-4)}`,
      name: newRestauForm.name,
      managerName: newRestauForm.managerName,
      phone: newRestauForm.phone,
      email: newRestauForm.email || `${newRestauForm.name.toLowerCase().replace(/\s+/g, "")}@foodi.ma`,
      cuisine: newRestauForm.cuisine || "Restauration",
      neighborhood: newRestauForm.neighborhood || "Agadir",
      address: newRestauForm.address || `${newRestauForm.neighborhood || "Agadir"}, Maroc`,
      rcNumber: newRestauForm.rcNumber || `RC-${Math.floor(28000 + Math.random() * 9000)}`,
      iceNumber: newRestauForm.iceNumber || `00${Math.floor(280000000 + Math.random() * 10000000)}00084`,
      branchesCount: 1,
      commissionRate: newRestauForm.commissionRate || 15,
      deliveryPricingMode: newRestauForm.deliveryPricingMode || "km",
      customDeliveryFee: newRestauForm.customDeliveryFee || 12,
      status: "pending",
      appliedDate: "Aujourd'hui",
      logo: "/images/restaurants/crusti.jpg",
      rating: 4.8,
      totalOrders: 0,
      avgPrepMinutes: newRestauForm.avgPrepMinutes || 20,
      branches: [
        {
          id: `b_${Date.now()}`,
          name: `${newRestauForm.name} (${newRestauForm.neighborhood || "Agadir"})`,
          neighborhood: newRestauForm.neighborhood || "Agadir",
          address: newRestauForm.address || `${newRestauForm.neighborhood || "Agadir"}, Maroc`,
          lat: 30.415,
          lng: -9.562,
          phone: newRestauForm.phone
        }
      ]
    };
    setRestaurants((prev) => [newRestaurant, ...prev]);
    setShowAddRestauModal(false);
    setNewRestauForm({
      name: "",
      managerName: "",
      phone: "",
      email: "",
      cuisine: "Fast-food & Burgers",
      neighborhood: "Talborjt",
      address: "Avenue Hassan II, Agadir",
      rcNumber: "RC-28950",
      iceNumber: "00289123400084",
      commissionRate: 15,
      deliveryPricingMode: "km",
      customDeliveryFee: 12,
      avgPrepMinutes: 20
    });
    showToast("Demande restaurant ajoutée");
  };

  const handleOpenDriverDossier = (driverId: string) => {
    setViewingDriverDossierId(driverId);
    setViewingRestauDossierId(null);
    setViewingOrderId(null);
    const c = couriers.find((x) => String(x.id).toLowerCase() === String(driverId).toLowerCase());
    if (c) {
      setDriverEditForm({
        fullName: c.fullName || "",
        phone: c.phone || "",
        email: c.email || "",
        cin: c.cin || "",
        vehicleType: c.vehicleType || "motorcycle",
        vehicleBrand: c.vehicleBrand || "Yamaha",
        vehicleModel: c.vehicleModel || "Neo's",
        vehiclePlate: c.vehiclePlate || "28-A-190",
        licenseNumber: c.licenseNumber || "MA-28100",
        isOnline: Boolean(c.isOnline),
        status: c.status || "active"
      });
    }
  };

  const handleOpenRestauDossier = (restauId: string) => {
    setViewingRestauDossierId(restauId);
    setViewingDriverDossierId(null);
    setViewingOrderId(null);
    const r = restaurants.find((x) => String(x.id).toLowerCase() === String(restauId).toLowerCase());
    if (r) {
      setRestauEditForm({
        name: r.name || "",
        managerName: r.managerName || "",
        phone: r.phone || "",
        email: r.email || "",
        cuisine: r.cuisine || "",
        neighborhood: r.neighborhood || "",
        address: r.address || "",
        rcNumber: r.rcNumber || "",
        iceNumber: r.iceNumber || "",
        commissionRate: r.commissionRate ?? 15,
        deliveryPricingMode: r.deliveryPricingMode || "km",
        customDeliveryFee: r.customDeliveryFee ?? 12,
        avgPrepMinutes: r.avgPrepMinutes ?? 20,
        status: r.status || "active"
      });
    }
  };

  const activeDriverDossier = useMemo(() => {
    if (!viewingDriverDossierId) return null;
    const found = couriers.find((c) => String(c.id).toLowerCase() === String(viewingDriverDossierId).toLowerCase());
    if (!found) return null;
    return {
      ...found,
      vehicleType: found.vehicleType || "motorcycle",
      licenseNumber: found.licenseNumber || "PER-09281-A",
      assignedOrdersCount: typeof found.assignedOrdersCount === "number" ? found.assignedOrdersCount : (found.totalDeliveries || 42) + 5,
      photoUrl: found.photoUrl || `/data/drivers/${found.id}/avatar.jpg`,
      documents: {
        cinPhotoUrl: found.documents?.cinPhotoUrl || `/data/drivers/${found.id}/cin_recto.png`,
        cinBackUrl: found.documents?.cinBackUrl || `/data/drivers/${found.id}/cin_verso.png`,
        licensePhotoUrl: found.documents?.licensePhotoUrl || `/data/drivers/${found.id}/permis.jpg`,
        registrationCardUrl: found.documents?.registrationCardUrl || `/data/drivers/${found.id}/carte_grise.jpg`,
        insuranceUrl: found.documents?.insuranceUrl || `/data/drivers/${found.id}/assurance.png`
      },
      reviews: Array.isArray(found.reviews) && found.reviews.length > 0 ? found.reviews : DEFAULT_REVIEWS
    };
  }, [viewingDriverDossierId, couriers]);

  const activeRestauDossier = useMemo(() => {
    if (!viewingRestauDossierId) return null;
    return restaurants.find((r) => String(r.id).toLowerCase() === String(viewingRestauDossierId).toLowerCase()) || null;
  }, [viewingRestauDossierId, restaurants]);

  const activeOrderDetails = useMemo(() => {
    if (!viewingOrderId) return null;
    const found = ordersList.find((o) => String(o.id).toLowerCase() === String(viewingOrderId).toLowerCase());
    if (found) return found;
    return {
      id: viewingOrderId,
      restaurantName: "Crusty Pizza & Burgers",
      customerName: "Client Foodi",
      customerPhone: "+212 6 70 88 99 00",
      address: "Boulevard Hassan II, Talborjt, Agadir",
      lat: 30.422,
      lng: -9.598,
      shopLat: 30.415,
      shopLng: -9.562,
      courierName: "Rachid Idrissi",
      courierPhone: "+212 6 61 22 33 44",
      courierLat: 30.418,
      courierLng: -9.580,
      status: "in_transit",
      statusLabel: "En cours de livraison",
      date: "09 Novembre 2026 13:20",
      items: [
        { name: "Menu Burger Crispy Bacon", quantity: 2, price: 65 },
        { name: "Frites Maison & Sauce Gourmet", quantity: 1, price: 20 },
        { name: "Coca Cola Zero 33cl", quantity: 2, price: 15 }
      ],
      subtotal: 180,
      deliveryFee: 12,
      smallOrderFee: 0,
      total: 192,
      paymentMethod: "cash"
    };
  }, [viewingOrderId, ordersList]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="foodi-admin-app">
      {mobileMenuOpen && (
        <div
          className="foodi-admin-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`foodi-admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="foodi-admin-sidebar-header">
          <div className="foodi-admin-logo-row">
            <i className="fa-solid fa-utensils foodi-admin-logo-icon" />
            <span className="foodi-admin-logo-text">Foodi</span>
            <span className="foodi-admin-badge">Admin</span>
          </div>
          <div className="foodi-admin-live-dot" title="Plateforme active" />
        </div>

        <nav className="foodi-admin-sidebar-nav">
          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "vue" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("vue");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-gauge" />
              <span>Vue</span>
            </div>
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "livreurs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("livreurs");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-motorcycle" />
              <span>Livreurs</span>
            </div>
            <span className="foodi-admin-nav-count">{couriers.length}</span>
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "dossiers_livreurs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dossiers_livreurs");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-id-card" />
              <span>Candidatures</span>
            </div>
            {pendingCouriers.length > 0 && (
              <span className="foodi-admin-nav-count highlight">{pendingCouriers.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "restaurants" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("restaurants");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-store" />
              <span>Restaurants</span>
            </div>
            <span className="foodi-admin-nav-count">{restaurants.length}</span>
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "dossiers_restaurants" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dossiers_restaurants");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-file-signature" />
              <span>Demandes</span>
            </div>
            {pendingRestaurants.length > 0 && (
              <span className="foodi-admin-nav-count highlight">{pendingRestaurants.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "commandes" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("commandes");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-bag-shopping" />
              <span>Commandes</span>
            </div>
            <span className="foodi-admin-nav-count">{ordersList.length}</span>
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "tarifs" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("tarifs");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-calculator" />
              <span>Tarification</span>
            </div>
          </button>

          <button
            type="button"
            className={`foodi-admin-nav-item ${activeTab === "parametres" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("parametres");
              setViewingDriverDossierId(null);
              setViewingRestauDossierId(null);
              setViewingOrderId(null);
              setMobileMenuOpen(false);
            }}
          >
            <div className="foodi-admin-nav-item-left">
              <i className="fa-solid fa-sliders" />
              <span>Paramètres</span>
            </div>
          </button>
        </nav>

        <div className="foodi-admin-sidebar-footer">
          <div className="foodi-admin-user-card">
            <div className="foodi-admin-avatar">
              <i className="fa-solid fa-user-shield" />
            </div>
            <div className="foodi-admin-user-info">
              <div className="foodi-admin-user-name">Superviseur Agadir</div>
              <div className="foodi-admin-user-role">Flotte & Partenaires</div>
            </div>
          </div>

          <button
            type="button"
            className="foodi-admin-logout-btn"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="foodi-admin-main">
        <header className="foodi-admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="foodi-admin-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
            >
              <i className="fa-solid fa-bars" />
            </button>
            <div className="foodi-admin-header-title-box">
              <h1 className="foodi-admin-header-title">
                {viewingOrderId
                  ? `Détails Commande : ${viewingOrderId}`
                  : viewingDriverDossierId
                  ? `Dossier Livreur : ${activeDriverDossier?.fullName || viewingDriverDossierId}`
                  : viewingRestauDossierId
                  ? `Dossier Restaurant : ${activeRestauDossier?.name || viewingRestauDossierId}`
                  : activeTab === "vue"
                  ? "Supervision Agadir"
                  : activeTab === "livreurs"
                  ? "Flotte de Livreurs (20 Actifs)"
                  : activeTab === "dossiers_livreurs"
                  ? "Dossiers Candidatures Livreurs"
                  : activeTab === "restaurants"
                  ? "Restaurants Partenaires"
                  : activeTab === "dossiers_restaurants"
                  ? "Demandes d'Adhésion Restaurants"
                  : activeTab === "commandes"
                  ? "Supervision Commandes"
                  : activeTab === "tarifs"
                  ? "Tarification Kilométrique & Frais"
                  : "Paramètres Plateforme"}
              </h1>
              <p className="foodi-admin-header-subtitle">
                Foodi Agadir • Console Centrale de Régulation
              </p>
            </div>
          </div>

          <div className="foodi-admin-header-actions">
            <div className="foodi-admin-search-wrapper">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="foodi-admin-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="foodi-admin-status-pill">
              <i className="fa-solid fa-circle-check" />
              <span>Service Ouvert</span>
            </div>
          </div>
        </header>

        <main className="foodi-admin-content">
          {activeOrderDetails ? (
            <div className="foodi-dossier-page-container">
              <div className="foodi-dossier-hero">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 className="foodi-dossier-hero-name">Commande {activeOrderDetails.id}</h2>
                    <span className={`foodi-badge-status ${activeOrderDetails.status === "delivered" ? "active" : "cooking"}`}>
                      {activeOrderDetails.statusLabel || activeOrderDetails.status}
                    </span>
                  </div>
                  <div className="foodi-dossier-hero-sub">
                    <span>Enregistrée le {activeOrderDetails.date}</span> • <span>Restaurant : {activeOrderDetails.restaurantName}</span>
                  </div>
                </div>

                <div className="foodi-dossier-actions-bar">
                  <button
                    type="button"
                    className="foodi-btn-admin-action outline"
                    onClick={() => {
                      setViewingOrderId(null);
                      if (routeParams.id) navigate("/admin");
                    }}
                  >
                    Retour
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${activeOrderDetails.courierLat || 30.405},${activeOrderDetails.courierLng || -9.555}`}
                    target="_blank"
                    rel="noreferrer"
                    className="foodi-btn-maps"
                  >
                    <i className="fa-solid fa-map-location-dot" />
                    <span>Maps</span>
                  </a>
                </div>
              </div>

              <div className="foodi-order-details-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="foodi-dossier-section-card">
                    <h3 className="foodi-dossier-section-title">
                      <i className="fa-solid fa-motorcycle" /> Coursier Assigné & Suivi
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <img
                        src="/images/ui/driver-reference.jpg"
                        alt="Livreur"
                        style={{ width: 55, height: 55, borderRadius: 12, objectFit: "cover" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{activeOrderDetails.courierName || "Amine Tazi"}</div>
                        <div style={{ fontSize: 12, color: "var(--foodi-muted)" }}>{activeOrderDetails.courierPhone || "+212 6 62 10 20 30"}</div>
                        <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
                          <i className="fa-solid fa-circle" style={{ fontSize: 8, marginRight: 5 }} />
                          En route pour la livraison
                        </div>
                      </div>
                      <button
                        type="button"
                        className="foodi-btn-admin-action outline"
                        onClick={() => {
                          const matched = couriers.find((c) => c.fullName.toLowerCase() === (activeOrderDetails.courierName || "").toLowerCase());
                          handleOpenDriverDossier(matched ? matched.id : "DRV-101");
                        }}
                      >
                        Dossier
                      </button>
                    </div>
                  </div>

                  <div className="foodi-dossier-section-card">
                    <h3 className="foodi-dossier-section-title">
                      <i className="fa-solid fa-location-dot" /> Itinéraire & Coordonnées Client
                    </h3>
                    <div className="foodi-dossier-fields-list">
                      <div className="foodi-dossier-field-item">
                        <span className="foodi-dossier-field-label">Nom du client</span>
                        <span className="foodi-dossier-field-value">{activeOrderDetails.customerName || "Client Foodi"}</span>
                      </div>
                      <div className="foodi-dossier-field-item">
                        <span className="foodi-dossier-field-label">Téléphone client</span>
                        <span className="foodi-dossier-field-value">{activeOrderDetails.customerPhone || "+212 6 12 34 56 78"}</span>
                      </div>
                      <div className="foodi-dossier-field-item" style={{ gridColumn: "1 / -1" }}>
                        <span className="foodi-dossier-field-label">Adresse de livraison à Agadir</span>
                        <span className="foodi-dossier-field-value">{activeOrderDetails.address}</span>
                      </div>
                      {activeOrderDetails.instructions && (
                        <div className="foodi-dossier-field-item" style={{ gridColumn: "1 / -1" }}>
                          <span className="foodi-dossier-field-label">Instructions</span>
                          <span className="foodi-dossier-field-value" style={{ fontStyle: "italic", color: "var(--foodi-muted)" }}>
                            {activeOrderDetails.instructions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="foodi-dossier-section-card">
                    <h3 className="foodi-dossier-section-title">
                      <i className="fa-solid fa-utensils" /> Articles Commandés & Règlement
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(activeOrderDetails.items || []).map((it: any, iIdx: number) => (
                        <div key={iIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--foodi-border-light)", paddingBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {it.image && (
                              <img src={it.image} alt={it.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                            )}
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800 }}>{it.name}</div>
                              <div style={{ fontSize: 11, color: "var(--foodi-muted)" }}>Quantité : {it.quantity}</div>
                            </div>
                          </div>
                          <strong>{it.price * it.quantity} DH</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid var(--foodi-border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Sous-total repas :</span>
                        <strong>{activeOrderDetails.subtotal || Math.max(0, activeOrderDetails.total - (activeOrderDetails.deliveryFee || 12))} DH</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Frais de livraison (versés au livreur) :</span>
                        <strong>{activeOrderDetails.deliveryFee || 12} DH</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: "var(--foodi-orange)", paddingTop: 6, borderTop: "1px dashed var(--foodi-border)" }}>
                        <span>Total TTC :</span>
                        <span>{activeOrderDetails.total} DH</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div ref={orderMapRef} className="foodi-order-map-box" />
                </div>
              </div>
            </div>
          ) : activeDriverDossier ? (
            <div className="foodi-dossier-page-container">
              <div className="foodi-dossier-hero">
                <div className="foodi-dossier-hero-left">
                  <img
                    src={activeDriverDossier.photoUrl}
                    alt={activeDriverDossier.fullName}
                    className="foodi-dossier-driver-photo-lg"
                    onClick={() => setZoomImage({ title: `Photo profil : ${activeDriverDossier.fullName}`, url: activeDriverDossier.photoUrl })}
                  />
                  <div className="foodi-dossier-hero-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 className="foodi-dossier-hero-name">{activeDriverDossier.fullName}</h2>
                      <span className={`foodi-badge-status ${activeDriverDossier.status}`}>
                        {activeDriverDossier.status === "active" ? "Validé" : activeDriverDossier.status === "pending" ? "En attente" : "Suspendu"}
                      </span>
                    </div>
                    <div className="foodi-dossier-hero-sub">
                      <span>Candidature du {activeDriverDossier.appliedDate}</span> • <span>CIN : {activeDriverDossier.cin}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span className={`foodi-badge-status ${activeDriverDossier.isOnline ? "active" : "suspended"}`}>
                        <i className="fa-solid fa-circle" style={{ fontSize: 7 }} />
                        {activeDriverDossier.isOnline ? "En ligne" : "Hors ligne"}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${activeDriverDossier.lat},${activeDriverDossier.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="foodi-btn-maps"
                      >
                        <i className="fa-solid fa-location-dot" />
                        <span>Maps</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="foodi-dossier-actions-bar">
                  <button
                    type="button"
                    className="foodi-btn-admin-action outline"
                    onClick={() => setViewingDriverDossierId(null)}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    className="foodi-btn-admin-action primary"
                    onClick={handleSaveDriverDossier}
                  >
                    Enregistrer
                  </button>
                  {(driverEditForm?.status || activeDriverDossier.status) === "pending" && (
                    <>
                      <button
                        type="button"
                        className="foodi-btn-admin-action danger"
                        onClick={() => {
                          handleUpdateCourierStatus(activeDriverDossier.id, "rejected");
                          setDriverEditForm((prev) => prev ? { ...prev, status: "rejected" } : null);
                        }}
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        className="foodi-btn-admin-action success"
                        onClick={() => {
                          handleUpdateCourierStatus(activeDriverDossier.id, "active");
                          setDriverEditForm((prev) => prev ? { ...prev, status: "active" } : null);
                        }}
                      >
                        Valider
                      </button>
                    </>
                  )}
                  {(driverEditForm?.status || activeDriverDossier.status) === "active" && (
                    <button
                      type="button"
                      className="foodi-btn-admin-action warning"
                      onClick={() => {
                        handleUpdateCourierStatus(activeDriverDossier.id, "suspended");
                        setDriverEditForm((prev) => prev ? { ...prev, status: "suspended" } : null);
                      }}
                    >
                      Suspendre
                    </button>
                  )}
                  {(driverEditForm?.status || activeDriverDossier.status) === "suspended" && (
                    <button
                      type="button"
                      className="foodi-btn-admin-action success"
                      onClick={() => {
                        handleUpdateCourierStatus(activeDriverDossier.id, "active");
                        setDriverEditForm((prev) => prev ? { ...prev, status: "active" } : null);
                      }}
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              <div className="foodi-dossier-section-card">
                <h3 className="foodi-dossier-section-title">
                  <i className="fa-solid fa-chart-line" /> Statistiques & Performances de Course
                </h3>
                <div className="foodi-driver-stats-grid">
                  <div className="foodi-driver-stat-pill">
                    <span className="foodi-driver-stat-num">{activeDriverDossier.assignedOrdersCount ?? 0}</span>
                    <span className="foodi-driver-stat-lbl">Commandes Reçues</span>
                  </div>
                  <div className="foodi-driver-stat-pill">
                    <span className="foodi-driver-stat-num" style={{ color: "#10B981" }}>
                      {activeDriverDossier.totalDeliveries}
                    </span>
                    <span className="foodi-driver-stat-lbl">Livrées avec Succès</span>
                  </div>
                  <div className="foodi-driver-stat-pill">
                    <span className="foodi-driver-stat-num">
                      {(activeDriverDossier.assignedOrdersCount ?? 0) > 0
                        ? `${Math.round((activeDriverDossier.totalDeliveries / (activeDriverDossier.assignedOrdersCount || 1)) * 100)}%`
                        : "100%"}
                    </span>
                    <span className="foodi-driver-stat-lbl">Taux de Complétion</span>
                  </div>
                  <div className="foodi-driver-stat-pill">
                    <span className="foodi-driver-stat-num" style={{ color: "#F59E0B" }}>
                      {activeDriverDossier.rating} ★
                    </span>
                    <span className="foodi-driver-stat-lbl">Note Globale</span>
                  </div>
                </div>
              </div>

              <div className="foodi-dossier-grid">
                <div className="foodi-dossier-section-card">
                  <h3 className="foodi-dossier-section-title">
                    <i className="fa-solid fa-user-pen" /> Informations du Livreur (Modifiables dans le Dossier)
                  </h3>
                  <div className="foodi-dossier-fields-list">
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Nom complet</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.fullName : (activeDriverDossier.fullName || "")}
                        onChange={(e) => handleUpdateDriverField("fullName", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Numéro téléphone</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.phone : (activeDriverDossier.phone || "")}
                        onChange={(e) => handleUpdateDriverField("phone", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Adresse email</span>
                      <input
                        type="email"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.email : (activeDriverDossier.email || "")}
                        onChange={(e) => handleUpdateDriverField("email", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Carte d'Identité (CIN)</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.cin : (activeDriverDossier.cin || "")}
                        onChange={(e) => handleUpdateDriverField("cin", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Type de véhicule</span>
                      <select
                        className="foodi-dossier-select"
                        value={driverEditForm ? driverEditForm.vehicleType : (activeDriverDossier.vehicleType || "motorcycle")}
                        onChange={(e) => handleUpdateDriverField("vehicleType", e.target.value)}
                      >
                        <option value="motorcycle">Moto / Scooter</option>
                        <option value="bicycle">Vélo</option>
                        <option value="car">Voiture</option>
                      </select>
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Marque Véhicule</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.vehicleBrand : (activeDriverDossier.vehicleBrand || "")}
                        onChange={(e) => handleUpdateDriverField("vehicleBrand", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Modèle Véhicule</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.vehicleModel : (activeDriverDossier.vehicleModel || "")}
                        onChange={(e) => handleUpdateDriverField("vehicleModel", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Matricule / Plaque</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.vehiclePlate : (activeDriverDossier.vehiclePlate || "")}
                        onChange={(e) => handleUpdateDriverField("vehiclePlate", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Numéro de permis</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={driverEditForm ? driverEditForm.licenseNumber : (activeDriverDossier.licenseNumber || "")}
                        onChange={(e) => handleUpdateDriverField("licenseNumber", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Disponibilité</span>
                      <select
                        className="foodi-dossier-select"
                        value={driverEditForm ? (driverEditForm.isOnline ? "online" : "offline") : (activeDriverDossier.isOnline ? "online" : "offline")}
                        onChange={(e) => handleUpdateDriverField("isOnline", e.target.value === "online")}
                      >
                        <option value="online">En ligne</option>
                        <option value="offline">Hors ligne</option>
                      </select>
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Statut Administratif</span>
                      <select
                        className="foodi-dossier-select"
                        value={driverEditForm ? driverEditForm.status : activeDriverDossier.status}
                        onChange={(e) => handleUpdateDriverField("status", e.target.value)}
                      >
                        <option value="active">Validé</option>
                        <option value="pending">En attente</option>
                        <option value="suspended">Suspendu</option>
                      </select>
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Position GPS (Google Maps)</span>
                      <span className="foodi-dossier-field-value">
                        <a
                          href={`https://www.google.com/maps?q=${activeDriverDossier.lat},${activeDriverDossier.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="foodi-btn-maps"
                        >
                          Maps
                        </a>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="foodi-dossier-section-card">
                  <h3 className="foodi-dossier-section-title">
                    <i className="fa-solid fa-file-shield" /> Pièces Justificatives (Cliquer pour Agrandir)
                  </h3>
                  <div className="foodi-doc-preview-grid">
                    <div className="foodi-doc-card-box">
                      <div
                        className="foodi-doc-card-thumb"
                        onClick={() => setZoomImage({ title: `CIN Recto : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.cinPhotoUrl || "/images/auth/phone-login.png" })}
                      >
                        <img src={activeDriverDossier.documents?.cinPhotoUrl || "/images/auth/phone-login.png"} alt="CIN Recto" />
                      </div>
                      <div className="foodi-doc-card-title">CIN (Recto)</div>
                      <button
                        type="button"
                        className="foodi-btn-admin-action outline"
                        onClick={() => setZoomImage({ title: `CIN Recto : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.cinPhotoUrl || "/images/auth/phone-login.png" })}
                      >
                        Zoom
                      </button>
                    </div>

                    <div className="foodi-doc-card-box">
                      <div
                        className="foodi-doc-card-thumb"
                        onClick={() => setZoomImage({ title: `Permis de Conduire : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.licensePhotoUrl || "/images/auth/phone-register.jpg" })}
                      >
                        <img src={activeDriverDossier.documents?.licensePhotoUrl || "/images/auth/phone-register.jpg"} alt="Permis" />
                      </div>
                      <div className="foodi-doc-card-title">Permis de Conduire</div>
                      <button
                        type="button"
                        className="foodi-btn-admin-action outline"
                        onClick={() => setZoomImage({ title: `Permis de Conduire : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.licensePhotoUrl || "/images/auth/phone-register.jpg" })}
                      >
                        Zoom
                      </button>
                    </div>

                    <div className="foodi-doc-card-box">
                      <div
                        className="foodi-doc-card-thumb"
                        onClick={() => setZoomImage({ title: `Carte Grise : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.registrationCardUrl || "/images/auth/adphonee.jpg" })}
                      >
                        <img src={activeDriverDossier.documents?.registrationCardUrl || "/images/auth/adphonee.jpg"} alt="Carte Grise" />
                      </div>
                      <div className="foodi-doc-card-title">Carte Grise Véhicule</div>
                      <button
                        type="button"
                        className="foodi-btn-admin-action outline"
                        onClick={() => setZoomImage({ title: `Carte Grise : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.registrationCardUrl || "/images/auth/adphonee.jpg" })}
                      >
                        Zoom
                      </button>
                    </div>

                    <div className="foodi-doc-card-box">
                      <div
                        className="foodi-doc-card-thumb"
                        onClick={() => setZoomImage({ title: `Assurance Véhicule : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.insuranceUrl || "/images/auth/phone-forgot.png" })}
                      >
                        <img src={activeDriverDossier.documents?.insuranceUrl || "/images/auth/phone-forgot.png"} alt="Assurance" />
                      </div>
                      <div className="foodi-doc-card-title">Attestation d'Assurance</div>
                      <button
                        type="button"
                        className="foodi-btn-admin-action outline"
                        onClick={() => setZoomImage({ title: `Assurance Véhicule : ${activeDriverDossier.fullName}`, url: activeDriverDossier.documents?.insuranceUrl || "/images/auth/phone-forgot.png" })}
                      >
                        Zoom
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="foodi-dossier-section-card">
                <h3 className="foodi-dossier-section-title">
                  <i className="fa-solid fa-comments" /> Avis & Commentaires Clients / Restaurants ({(activeDriverDossier.reviews || []).length})
                </h3>
                {(!activeDriverDossier.reviews || activeDriverDossier.reviews.length === 0) ? (
                  <p style={{ color: "var(--foodi-muted)", fontSize: 13, margin: 0 }}>
                    Aucun avis enregistré pour le moment pour ce livreur.
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {(activeDriverDossier.reviews || []).map((rev) => (
                      <div key={rev.id} className="foodi-driver-review-card">
                        <div className="foodi-driver-review-header">
                          <span className="foodi-driver-review-author">{rev.author} ({rev.role})</span>
                          <span className="foodi-driver-review-stars">
                            {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <div className="foodi-driver-review-body">« {rev.comment} »</div>
                        <div style={{ fontSize: 11, color: "var(--foodi-muted)" }}>{rev.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeRestauDossier ? (
            <div className="foodi-dossier-page-container">
              <div className="foodi-dossier-hero">
                <div className="foodi-dossier-hero-left">
                  <img
                    src={activeRestauDossier.logo}
                    alt={activeRestauDossier.name}
                    className="foodi-dossier-driver-photo-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/restaurants/crusti.jpg";
                    }}
                    onClick={() => setZoomImage({ title: `Logo Restaurant : ${activeRestauDossier.name}`, url: activeRestauDossier.logo })}
                  />
                  <div className="foodi-dossier-hero-info">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 className="foodi-dossier-hero-name">{activeRestauDossier.name}</h2>
                      <span className={`foodi-badge-status ${activeRestauDossier.status}`}>
                        {activeRestauDossier.status === "active" ? "Actif" : activeRestauDossier.status === "pending" ? "En attente" : "Suspendu"}
                      </span>
                    </div>
                    <div className="foodi-dossier-hero-sub">
                      <span>Cuisine : {activeRestauDossier.cuisine}</span> • <span>Gérant : {activeRestauDossier.managerName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--foodi-muted)", marginTop: 4 }}>
                      <i className="fa-solid fa-building" /> {(activeRestauDossier.branches || []).length} point(s) de vente à Agadir • RC : {activeRestauDossier.rcNumber} • ICE : {activeRestauDossier.iceNumber}
                    </div>
                  </div>
                </div>

                <div className="foodi-dossier-actions-bar">
                  <button
                    type="button"
                    className="foodi-btn-admin-action outline"
                    onClick={() => setViewingRestauDossierId(null)}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    className="foodi-btn-admin-action primary"
                    onClick={handleSaveRestauDossier}
                  >
                    Enregistrer
                  </button>
                  {(restauEditForm?.status || activeRestauDossier.status) === "pending" && (
                    <>
                      <button
                        type="button"
                        className="foodi-btn-admin-action danger"
                        onClick={() => {
                          handleUpdateRestaurantStatus(activeRestauDossier.id, "rejected");
                          setRestauEditForm((prev) => prev ? { ...prev, status: "rejected" } : null);
                        }}
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        className="foodi-btn-admin-action success"
                        onClick={() => {
                          handleUpdateRestaurantStatus(activeRestauDossier.id, "active");
                          setRestauEditForm((prev) => prev ? { ...prev, status: "active" } : null);
                        }}
                      >
                        Valider
                      </button>
                    </>
                  )}
                  {(restauEditForm?.status || activeRestauDossier.status) === "active" && (
                    <button
                      type="button"
                      className="foodi-btn-admin-action warning"
                      onClick={() => {
                        handleUpdateRestaurantStatus(activeRestauDossier.id, "suspended");
                        setRestauEditForm((prev) => prev ? { ...prev, status: "suspended" } : null);
                      }}
                    >
                      Suspendre
                    </button>
                  )}
                  {(restauEditForm?.status || activeRestauDossier.status) === "suspended" && (
                    <button
                      type="button"
                      className="foodi-btn-admin-action success"
                      onClick={() => {
                        handleUpdateRestaurantStatus(activeRestauDossier.id, "active");
                        setRestauEditForm((prev) => prev ? { ...prev, status: "active" } : null);
                      }}
                    >
                      Activer
                    </button>
                  )}
                </div>
              </div>

              <div className="foodi-dossier-grid">
                <div className="foodi-dossier-section-card">
                  <h3 className="foodi-dossier-section-title">
                    <i className="fa-solid fa-map-location-dot" /> Points de Vente & Succursales Agadir
                  </h3>
                  <div className="foodi-admin-table-container">
                    <table className="foodi-admin-table">
                      <thead>
                        <tr>
                          <th>Nom du Point</th>
                          <th>Quartier</th>
                          <th>Coordonnées</th>
                          <th>Téléphone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeRestauDossier.branches || []).map((b) => (
                          <tr key={b.id}>
                            <td><strong>{b.name}</strong></td>
                            <td>{b.neighborhood}</td>
                            <td>{b.lat}, {b.lng}</td>
                            <td>{b.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="foodi-dossier-section-card">
                  <h3 className="foodi-dossier-section-title">
                    <i className="fa-solid fa-store" /> Informations & Paramétrage Établissement
                  </h3>
                  <div className="foodi-dossier-fields-list">
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Nom Établissement</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.name : (activeRestauDossier.name || "")}
                        onChange={(e) => handleUpdateRestauField("name", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Nom du Gérant</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.managerName : (activeRestauDossier.managerName || "")}
                        onChange={(e) => handleUpdateRestauField("managerName", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Téléphone Direct</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.phone : (activeRestauDossier.phone || "")}
                        onChange={(e) => handleUpdateRestauField("phone", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Email Professionnel</span>
                      <input
                        type="email"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.email : (activeRestauDossier.email || "")}
                        onChange={(e) => handleUpdateRestauField("email", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Spécialité Culinaire</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.cuisine : (activeRestauDossier.cuisine || "")}
                        onChange={(e) => handleUpdateRestauField("cuisine", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Quartier Principal</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.neighborhood : (activeRestauDossier.neighborhood || "")}
                        onChange={(e) => handleUpdateRestauField("neighborhood", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Adresse Complète</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.address : (activeRestauDossier.address || "")}
                        onChange={(e) => handleUpdateRestauField("address", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Numéro RC</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.rcNumber : (activeRestauDossier.rcNumber || "")}
                        onChange={(e) => handleUpdateRestauField("rcNumber", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Numéro ICE</span>
                      <input
                        type="text"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.iceNumber : (activeRestauDossier.iceNumber || "")}
                        onChange={(e) => handleUpdateRestauField("iceNumber", e.target.value)}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Taux Commission Foodi (%)</span>
                      <input
                        type="number"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.commissionRate : (activeRestauDossier.commissionRate ?? 15)}
                        onChange={(e) => handleUpdateRestauField("commissionRate", Number(e.target.value))}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Mode Livraison</span>
                      <select
                        className="foodi-dossier-select"
                        value={restauEditForm ? restauEditForm.deliveryPricingMode : (activeRestauDossier.deliveryPricingMode || "km")}
                        onChange={(e) => handleUpdateRestauField("deliveryPricingMode", e.target.value as any)}
                      >
                        <option value="km">Tarif au Km (4 DH/km)</option>
                        <option value="fixed">Frais Fixe Partenaire</option>
                      </select>
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Frais Fixe (DH)</span>
                      <input
                        type="number"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.customDeliveryFee : (activeRestauDossier.customDeliveryFee ?? 12)}
                        onChange={(e) => handleUpdateRestauField("customDeliveryFee", Number(e.target.value))}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Temps Moyen Préparation (min)</span>
                      <input
                        type="number"
                        className="foodi-dossier-input"
                        value={restauEditForm ? restauEditForm.avgPrepMinutes : (activeRestauDossier.avgPrepMinutes ?? 20)}
                        onChange={(e) => handleUpdateRestauField("avgPrepMinutes", Number(e.target.value))}
                      />
                    </div>
                    <div className="foodi-dossier-field-item">
                      <span className="foodi-dossier-field-label">Statut Partenaire</span>
                      <select
                        className="foodi-dossier-select"
                        value={restauEditForm ? restauEditForm.status : activeRestauDossier.status}
                        onChange={(e) => handleUpdateRestauField("status", e.target.value as any)}
                      >
                        <option value="active">Actif</option>
                        <option value="pending">En attente</option>
                        <option value="suspended">Suspendu</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "vue" ? (
            <>
              <div className="foodi-admin-kpi-grid">
                <div className="foodi-admin-kpi-card">
                  <div className="foodi-admin-kpi-header">
                    <span className="foodi-admin-kpi-label">Volume total</span>
                    <div className="foodi-admin-kpi-icon"><i className="fa-solid fa-wallet" /></div>
                  </div>
                  <span className="foodi-admin-kpi-val">{totalRevenue} DH</span>
                  <span className="foodi-admin-kpi-sub">Plateforme Foodi Agadir</span>
                </div>

                <div className="foodi-admin-kpi-card">
                  <div className="foodi-admin-kpi-header">
                    <span className="foodi-admin-kpi-label">Commissions nettes</span>
                    <div className="foodi-admin-kpi-icon"><i className="fa-solid fa-coins" /></div>
                  </div>
                  <span className="foodi-admin-kpi-val" style={{ color: "var(--foodi-orange)" }}>
                    {totalFoodiCommission} DH
                  </span>
                  <span className="foodi-admin-kpi-sub">{pricingSettings.defaultCommissionRate}% perçus</span>
                </div>

                <div className="foodi-admin-kpi-card">
                  <div className="foodi-admin-kpi-header">
                    <span className="foodi-admin-kpi-label">Flotte livreurs</span>
                    <div className="foodi-admin-kpi-icon"><i className="fa-solid fa-motorcycle" /></div>
                  </div>
                  <span className="foodi-admin-kpi-val">
                    {onlineCouriersCount} / {couriers.length}
                  </span>
                  <span className="foodi-admin-kpi-sub">En ligne dans Agadir</span>
                </div>

                <div className="foodi-admin-kpi-card">
                  <div className="foodi-admin-kpi-header">
                    <span className="foodi-admin-kpi-label">Restaurants ouverts</span>
                    <div className="foodi-admin-kpi-icon"><i className="fa-solid fa-shop" /></div>
                  </div>
                  <span className="foodi-admin-kpi-val">
                    {restaurants.filter((r) => r.status === "active").length}
                  </span>
                  <span className="foodi-admin-kpi-sub neutral">Partenaires actifs</span>
                </div>
              </div>

              <div className="foodi-admin-card">
                <div className="foodi-admin-card-header">
                  <h3 className="foodi-admin-card-title">
                    <i className="fa-solid fa-motorcycle" /> Flotte des Coursiers en Circulation (Agadir)
                  </h3>
                  <button
                    type="button"
                    className="foodi-btn-admin-action outline"
                    onClick={() => setActiveTab("livreurs")}
                  >
                    Tous
                  </button>
                </div>

                <div className="foodi-admin-table-container">
                  <table className="foodi-admin-table">
                    <thead>
                      <tr>
                        <th>Coursier</th>
                        <th>Disponibilité</th>
                        <th>Véhicule</th>
                        <th>Position (Maps)</th>
                        <th>Note</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couriers.slice(0, 6).map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="foodi-admin-entity-cell">
                              <div
                                className="foodi-admin-entity-avatar"
                                onClick={() => setZoomImage({ title: `Photo profil : ${c.fullName}`, url: c.photoUrl })}
                              >
                                <img src={c.photoUrl} alt={c.fullName} />
                              </div>
                              <div>
                                <div className="foodi-admin-entity-name" style={{ cursor: "pointer" }} onClick={() => handleOpenDriverDossier(c.id)}>{c.fullName}</div>
                                <div className="foodi-admin-entity-sub">{c.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`foodi-badge-status ${c.isOnline ? "active" : "suspended"}`}>
                              <i className="fa-solid fa-circle" style={{ fontSize: 7 }} />
                              {c.isOnline ? "En ligne" : "Hors ligne"}
                            </span>
                          </td>
                          <td>{c.vehicleBrand} {c.vehicleModel} ({c.vehiclePlate})</td>
                          <td>
                            <a
                              href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="foodi-btn-maps"
                            >
                              <i className="fa-solid fa-location-dot" />
                              <span>Maps</span>
                            </a>
                          </td>
                          <td><strong>{c.rating}★</strong> ({c.totalDeliveries} courses)</td>
                          <td>
                            <button
                              type="button"
                              className="foodi-btn-admin-action outline"
                              onClick={() => handleOpenDriverDossier(c.id)}
                            >
                              Dossier
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === "livreurs" ? (
            <div className="foodi-admin-card">
              <div className="foodi-admin-card-header">
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-motorcycle" /> Flotte Agadir (20 Coursiers en Circulation)
                </h3>
              </div>

              <div className="foodi-admin-table-container">
                <table className="foodi-admin-table">
                  <thead>
                    <tr>
                      <th>Livreur</th>
                      <th>Disponibilité</th>
                      <th>Véhicule & Plaque</th>
                      <th>Position GPS</th>
                      <th>Livraisons</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCouriers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="foodi-admin-entity-cell">
                            <div
                              className="foodi-admin-entity-avatar"
                              onClick={() => setZoomImage({ title: `Photo profil : ${c.fullName}`, url: c.photoUrl })}
                            >
                              <img src={c.photoUrl} alt={c.fullName} />
                            </div>
                            <div>
                              <div className="foodi-admin-entity-name" style={{ cursor: "pointer" }} onClick={() => handleOpenDriverDossier(c.id)}>{c.fullName}</div>
                              <div className="foodi-admin-entity-sub">{c.phone} • CIN : {c.cin}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`foodi-badge-status ${c.isOnline ? "active" : "suspended"}`}>
                            <i className="fa-solid fa-circle" style={{ fontSize: 7 }} />
                            {c.isOnline ? "En ligne" : "Hors ligne"}
                          </span>
                        </td>
                        <td>
                          <strong>{c.vehicleBrand} {c.vehicleModel}</strong>
                          <div style={{ fontSize: 11, color: "var(--foodi-muted)" }}>{c.vehiclePlate}</div>
                        </td>
                        <td>
                          <a
                            href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="foodi-btn-maps"
                          >
                            <i className="fa-solid fa-location-dot" />
                            <span>Maps</span>
                          </a>
                        </td>
                        <td><strong>{c.totalDeliveries}</strong> ({c.rating}★)</td>
                        <td>
                          <span className={`foodi-badge-status ${c.status}`}>
                            {c.status === "active" ? "Validé" : c.status === "pending" ? "En attente" : "Suspendu"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="foodi-btn-admin-action outline"
                            onClick={() => handleOpenDriverDossier(c.id)}
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "dossiers_livreurs" ? (
            <div className="foodi-admin-card">
              <div className="foodi-admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-id-card" /> Candidatures Livreurs à Examiner ({pendingCouriers.length})
                </h3>
                <button
                  type="button"
                  className="foodi-btn-admin-action primary"
                  onClick={() => setShowAddDriverModal(true)}
                >
                  Ajouter
                </button>
              </div>

              {pendingCouriers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--foodi-muted)" }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: "#10B981", marginBottom: 10 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Toutes les candidatures de livreurs ont été traitées.</p>
                </div>
              ) : (
                <div className="foodi-admin-cards-grid">
                  {pendingCouriers.map((c) => (
                    <div key={c.id} className="foodi-admin-item-card">
                      <div className="foodi-admin-item-top">
                        <span className="foodi-badge-status pending">En attente</span>
                        <span style={{ fontSize: 11, color: "var(--foodi-muted)" }}>{c.appliedDate}</span>
                      </div>

                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <img
                          src={c.photoUrl}
                          alt={c.fullName}
                          style={{ width: 50, height: 50, borderRadius: 12, objectFit: "cover", cursor: "pointer" }}
                          onClick={() => setZoomImage({ title: `Photo profil : ${c.fullName}`, url: c.photoUrl })}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--foodi-charcoal)", cursor: "pointer" }} onClick={() => handleOpenDriverDossier(c.id)}>{c.fullName}</div>
                          <div style={{ fontSize: 12, color: "var(--foodi-muted)" }}>{c.phone} • {c.email}</div>
                        </div>
                      </div>

                      <div className="foodi-admin-item-details">
                        <div>Véhicule : <strong>{c.vehicleBrand} {c.vehicleModel}</strong> ({c.vehiclePlate})</div>
                        <div>Documents : <strong style={{ color: "#10B981" }}>CIN, Permis, Carte Grise complets</strong></div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          className="foodi-btn-admin-action outline"
                          style={{ flex: 1 }}
                          onClick={() => handleOpenDriverDossier(c.id)}
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          className="foodi-btn-admin-action danger"
                          onClick={() => handleUpdateCourierStatus(c.id, "rejected")}
                        >
                          Refuser
                        </button>
                        <button
                          type="button"
                          className="foodi-btn-admin-action success"
                          onClick={() => handleUpdateCourierStatus(c.id, "active")}
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "restaurants" ? (
            <div className="foodi-admin-card">
              <div className="foodi-admin-card-header">
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-store" /> Établissements Partenaires & Frais de Livraison
                </h3>
              </div>

              <div className="foodi-admin-table-container">
                <table className="foodi-admin-table">
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Quartier Principal</th>
                      <th>Succursales</th>
                      <th>Mode Livraison</th>
                      <th>Frais Actuels</th>
                      <th>Commission</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="foodi-admin-entity-cell">
                            <div
                              className="foodi-admin-entity-avatar"
                              onClick={() => setZoomImage({ title: `Logo : ${r.name}`, url: r.logo })}
                            >
                              <img
                                src={r.logo}
                                alt={r.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/restaurants/crusti.jpg";
                                }}
                              />
                            </div>
                            <div>
                              <div className="foodi-admin-entity-name" style={{ cursor: "pointer" }} onClick={() => handleOpenRestauDossier(r.id)}>{r.name}</div>
                              <div className="foodi-admin-entity-sub">{r.cuisine} • {r.managerName}</div>
                            </div>
                          </div>
                        </td>
                        <td>{r.neighborhood}</td>
                        <td><strong>{(r.branches || []).length}</strong> point(s)</td>
                        <td>
                          <span className={`foodi-badge-status ${r.deliveryPricingMode === "km" ? "ready" : "cooking"}`}>
                            {r.deliveryPricingMode === "km" ? "Kilométrique" : "Frais Fixe"}
                          </span>
                        </td>
                        <td>
                          <strong>{r.deliveryPricingMode === "km" ? "4 DH/km" : `${r.customDeliveryFee} DH`}</strong>
                        </td>
                        <td><strong>{r.commissionRate}%</strong></td>
                        <td>
                          <button
                            type="button"
                            className="foodi-btn-admin-action outline"
                            onClick={() => handleOpenRestauDossier(r.id)}
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === "dossiers_restaurants" ? (
            <div className="foodi-admin-card">
              <div className="foodi-admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-file-signature" /> Demandes d'Adhésion Restaurants ({pendingRestaurants.length})
                </h3>
                <button
                  type="button"
                  className="foodi-btn-admin-action primary"
                  onClick={() => setShowAddRestauModal(true)}
                >
                  Ajouter
                </button>
              </div>

              {pendingRestaurants.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--foodi-muted)" }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: "#10B981", marginBottom: 10 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Toutes les demandes de restaurants ont été traitées.</p>
                </div>
              ) : (
                <div className="foodi-admin-cards-grid">
                  {pendingRestaurants.map((r) => (
                    <div key={r.id} className="foodi-admin-item-card">
                      <div className="foodi-admin-item-top">
                        <span className="foodi-badge-status pending">En attente</span>
                        <span style={{ fontSize: 11, color: "var(--foodi-muted)" }}>{r.appliedDate}</span>
                      </div>

                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <img
                          src={r.logo}
                          alt={r.name}
                          style={{ width: 50, height: 50, borderRadius: 12, objectFit: "cover", cursor: "pointer" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/restaurants/crusti.jpg";
                          }}
                          onClick={() => setZoomImage({ title: `Logo : ${r.name}`, url: r.logo })}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--foodi-charcoal)", cursor: "pointer" }} onClick={() => handleOpenRestauDossier(r.id)}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "var(--foodi-muted)" }}>{r.cuisine} • Gérant : {r.managerName}</div>
                        </div>
                      </div>

                      <div className="foodi-admin-item-details">
                        <div>Quartier : <strong>{r.neighborhood}</strong></div>
                        <div>Contact : <strong>{r.phone}</strong></div>
                        <div>RC / ICE : <strong>{r.rcNumber} / {r.iceNumber}</strong></div>
                        <div>Succursales : <strong>{(r.branches || []).length} point(s) à Agadir</strong></div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          className="foodi-btn-admin-action outline"
                          style={{ flex: 1 }}
                          onClick={() => handleOpenRestauDossier(r.id)}
                        >
                          Dossier
                        </button>
                        <button
                          type="button"
                          className="foodi-btn-admin-action danger"
                          onClick={() => handleUpdateRestaurantStatus(r.id, "rejected")}
                        >
                          Refuser
                        </button>
                        <button
                          type="button"
                          className="foodi-btn-admin-action success"
                          onClick={() => handleUpdateRestaurantStatus(r.id, "active")}
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "tarifs" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="foodi-pricing-formula-card">
                <div className="foodi-admin-card-header">
                  <h3 className="foodi-admin-card-title">
                    <i className="fa-solid fa-calculator" /> Paramétrage Tarification Kilométrique & Petites Commandes
                  </h3>
                </div>

                <form onSubmit={handleSavePricing} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="foodi-pricing-formula-item">
                    <div>
                      <div className="foodi-pricing-formula-title">Prix au kilomètre entre restaurant et client (DH / km)</div>
                      <div className="foodi-pricing-formula-desc">Exemple : 2 km = 8 DH, 3 km = 12 DH. Ce montant est versé intégralement au livreur.</div>
                    </div>
                    <div className="foodi-pricing-input-group">
                      <input
                        type="number"
                        className="foodi-pricing-input"
                        value={pricingSettings.pricePerKm}
                        onChange={(e) => setPricingSettings((prev) => ({ ...prev, pricePerKm: Number(e.target.value) }))}
                      />
                      <span>DH/km</span>
                    </div>
                  </div>

                  <div className="foodi-pricing-formula-item">
                    <div>
                      <div className="foodi-pricing-formula-title">Frais de livraison minimum garanti pour le coursier (DH)</div>
                      <div className="foodi-pricing-formula-desc">Garantie plancher pour le livreur même si la course fait moins de 2 km.</div>
                    </div>
                    <div className="foodi-pricing-input-group">
                      <input
                        type="number"
                        className="foodi-pricing-input"
                        value={pricingSettings.minDeliveryFee}
                        onChange={(e) => setPricingSettings((prev) => ({ ...prev, minDeliveryFee: Number(e.target.value) }))}
                      />
                      <span>DH</span>
                    </div>
                  </div>

                  <div className="foodi-pricing-formula-item">
                    <div>
                      <div className="foodi-pricing-formula-title">Seuil petite commande (Commandes de moins de 50 DH)</div>
                      <div className="foodi-pricing-formula-desc">Si le sous-total de la commande est inférieur à ce montant, le supplément s'applique.</div>
                    </div>
                    <div className="foodi-pricing-input-group">
                      <input
                        type="number"
                        className="foodi-pricing-input"
                        value={pricingSettings.smallOrderThreshold}
                        onChange={(e) => setPricingSettings((prev) => ({ ...prev, smallOrderThreshold: Number(e.target.value) }))}
                      />
                      <span>DH</span>
                    </div>
                  </div>

                  <div className="foodi-pricing-formula-item">
                    <div>
                      <div className="foodi-pricing-formula-title">Montant supplément petite commande (Frais de 5 DH)</div>
                      <div className="foodi-pricing-formula-desc">Frais additionnels facturés au client et reversés au livreur.</div>
                    </div>
                    <div className="foodi-pricing-input-group">
                      <input
                        type="number"
                        className="foodi-pricing-input"
                        value={pricingSettings.smallOrderFee}
                        onChange={(e) => setPricingSettings((prev) => ({ ...prev, smallOrderFee: Number(e.target.value) }))}
                      />
                      <span>DH</span>
                    </div>
                  </div>

                  <div className="foodi-pricing-formula-item">
                    <div>
                      <div className="foodi-pricing-formula-title">Taux de commission standard Foodi sur les plats (%)</div>
                      <div className="foodi-pricing-formula-desc">Pourcentage prélevé sur le chiffre d'affaires hors livraison des restaurants.</div>
                    </div>
                    <div className="foodi-pricing-input-group">
                      <input
                        type="number"
                        className="foodi-pricing-input"
                        value={pricingSettings.defaultCommissionRate}
                        onChange={(e) => setPricingSettings((prev) => ({ ...prev, defaultCommissionRate: Number(e.target.value) }))}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <button type="submit" className="foodi-btn-admin-action primary">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : activeTab === "commandes" ? (
            <div className="foodi-admin-card">
              <div className="foodi-admin-card-header">
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-bag-shopping" /> Supervision des Commandes en Direct ({ordersList.length})
                </h3>
              </div>

              <div className="foodi-admin-table-container">
                <table className="foodi-admin-table">
                  <thead>
                    <tr>
                      <th>ID Commande</th>
                      <th>Restaurant</th>
                      <th>Client</th>
                      <th>Livreur Assigné</th>
                      <th>Panier</th>
                      <th>Frais Livraison</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 800 }}>{o.id}</span>
                        </td>
                        <td>{o.restaurantName}</td>
                        <td>{o.customerName || "Client Foodi"}</td>
                        <td>
                          <i className="fa-solid fa-motorcycle" style={{ color: "var(--foodi-orange)", marginRight: 6 }} />
                          {o.courierName || "En attente assignation"}
                        </td>
                        <td>{o.subtotal || o.total - (o.deliveryFee || 12)} DH</td>
                        <td>{o.deliveryFee || 12} DH</td>
                        <td><strong>{o.total} DH</strong></td>
                        <td>
                          <span className={`foodi-badge-status ${o.status === "delivered" ? "active" : "cooking"}`}>
                            {o.statusLabel || o.status}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="foodi-btn-admin-action outline"
                            onClick={() => setViewingOrderId(o.id)}
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="foodi-admin-card" style={{ maxWidth: 700 }}>
              <div className="foodi-admin-card-header">
                <h3 className="foodi-admin-card-title">
                  <i className="fa-solid fa-sliders" /> Paramètres Plateforme Foodi
                </h3>
              </div>

              <form onSubmit={handleSavePricing} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="foodi-admin-form-group">
                  <label className="foodi-admin-form-label">Statut opérationnel Foodi Agadir :</label>
                  <select
                    className="foodi-admin-form-select"
                    value={pricingSettings.serviceStatus}
                    onChange={(e) => setPricingSettings((prev) => ({ ...prev, serviceStatus: e.target.value as any }))}
                  >
                    <option value="active">En service (Ouvert)</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Fermé temporairement</option>
                  </select>
                </div>

                <div className="foodi-admin-form-group">
                  <label className="foodi-admin-form-label">Numéro d'assistance superviseur :</label>
                  <input
                    type="text"
                    className="foodi-admin-form-input"
                    value={pricingSettings.supportPhone}
                    onChange={(e) => setPricingSettings((prev) => ({ ...prev, supportPhone: e.target.value }))}
                  />
                </div>

                <div className="foodi-admin-form-group">
                  <label className="foodi-admin-form-label">Email supervision administrative :</label>
                  <input
                    type="email"
                    className="foodi-admin-form-input"
                    value={pricingSettings.supportEmail}
                    onChange={(e) => setPricingSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" className="foodi-btn-admin-action primary">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {showAddDriverModal && (
        <div className="foodi-modal-backdrop" onClick={() => setShowAddDriverModal(false)}>
          <div className="foodi-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">
                <i className="fa-solid fa-motorcycle" /> Ajouter un Candidat Livreur
              </h3>
              <button
                type="button"
                className="foodi-lightbox-close"
                onClick={() => setShowAddDriverModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="foodi-modal-body">
              <div className="foodi-modal-form-grid">
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Nom complet *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.fullName}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Téléphone *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Numéro CIN *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.cin}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, cin: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Email</label>
                  <input
                    type="email"
                    className="foodi-modal-input"
                    value={newDriverForm.email}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Type de véhicule</label>
                  <select
                    className="foodi-modal-select"
                    value={newDriverForm.vehicleType}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, vehicleType: e.target.value as any }))}
                  >
                    <option value="motorcycle">Moto / Scooter</option>
                    <option value="bicycle">Vélo</option>
                    <option value="car">Voiture</option>
                  </select>
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Marque</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.vehicleBrand}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, vehicleBrand: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Modèle</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.vehicleModel}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Matricule / Plaque</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.vehiclePlate}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, vehiclePlate: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Numéro de permis</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newDriverForm.licenseNumber}
                    onChange={(e) => setNewDriverForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="foodi-modal-footer">
              <button
                type="button"
                className="foodi-btn-admin-action outline"
                onClick={() => setShowAddDriverModal(false)}
              >
                Fermer
              </button>
              <button
                type="button"
                className="foodi-btn-admin-action primary"
                onClick={handleCreateDriverDemand}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRestauModal && (
        <div className="foodi-modal-backdrop" onClick={() => setShowAddRestauModal(false)}>
          <div className="foodi-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="foodi-modal-header">
              <h3 className="foodi-modal-title">
                <i className="fa-solid fa-store" /> Ajouter une Demande Restaurant
              </h3>
              <button
                type="button"
                className="foodi-lightbox-close"
                onClick={() => setShowAddRestauModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="foodi-modal-body">
              <div className="foodi-modal-form-grid">
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Nom du restaurant *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.name}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Nom du gérant *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.managerName}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, managerName: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Téléphone *</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.phone}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Email</label>
                  <input
                    type="email"
                    className="foodi-modal-input"
                    value={newRestauForm.email}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Spécialité culinaire</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.cuisine}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Quartier à Agadir</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.neighborhood}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Adresse complète</label>
                  <input
                    type="text"
                    className="foodi-modal-input"
                    value={newRestauForm.address}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Commission Foodi (%)</label>
                  <input
                    type="number"
                    className="foodi-modal-input"
                    value={newRestauForm.commissionRate}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, commissionRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Mode de livraison</label>
                  <select
                    className="foodi-modal-select"
                    value={newRestauForm.deliveryPricingMode}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, deliveryPricingMode: e.target.value as any }))}
                  >
                    <option value="km">Tarif au Km (4 DH/km)</option>
                    <option value="fixed">Frais Fixe Partenaire</option>
                  </select>
                </div>
                <div className="foodi-modal-form-group">
                  <label className="foodi-modal-label">Frais Fixe si applicable (DH)</label>
                  <input
                    type="number"
                    className="foodi-modal-input"
                    value={newRestauForm.customDeliveryFee}
                    onChange={(e) => setNewRestauForm((prev) => ({ ...prev, customDeliveryFee: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div className="foodi-modal-footer">
              <button
                type="button"
                className="foodi-btn-admin-action outline"
                onClick={() => setShowAddRestauModal(false)}
              >
                Fermer
              </button>
              <button
                type="button"
                className="foodi-btn-admin-action primary"
                onClick={handleCreateRestauDemand}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomImage && (
        <div className="foodi-lightbox-backdrop" onClick={() => setZoomImage(null)}>
          <button
            type="button"
            className="foodi-lightbox-close"
            onClick={() => setZoomImage(null)}
          >
            ✕
          </button>
          <img
            src={zoomImage.url}
            alt={zoomImage.title}
            className="foodi-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="foodi-lightbox-caption">{zoomImage.title}</div>
        </div>
      )}

      {toastMessage && (
        <div className="foodi-admin-toast">
          <i className="fa-solid fa-circle-check" style={{ color: "#10B981" }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
