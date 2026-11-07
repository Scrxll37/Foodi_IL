import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/driver.css";
import {
  Bike,
  Car,
  Power,
  Clock,
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  LogOut,
  User,
  FileText,
  Check,
  Bell,
  HelpCircle,
  Settings,
  Compass,
  ArrowLeft,
  X,
  ExternalLink,
  PackageCheck,
  Building2,
  Zap,
  Info,
  DollarSign,
  TrendingUp,
  Star,
  QrCode,
  LocateFixed,
  AlertCircle,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  Camera,
  RotateCcw,
  Menu,
  PhoneCall,
  Search,
  MessageSquare,
  Share2,
  Layers
} from "lucide-react";
import { OrderRecord, OrderStatus } from "../types";
import ordersData from "../data/orders.json";
import { fetchRoadRoute, buildRouteGeometry, LatLng } from "../utils/routing";
import { EmailChangeModal } from "../components/EmailChangeModal";
import { DriverHeroIllustration } from "../components/DriverHeroIllustration";

type DriverState =
  | "offline"
  | "online_searching"
  | "offer_received"
  | "heading_to_restaurant"
  | "arrived_at_restaurant"
  | "picked_up"
  | "heading_to_customer"
  | "arrived_at_customer"
  | "delivered";

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("foodi_driver_onboarded");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [onboardStep, setOnboardStep] = useState<1 | 2 | 3>(1);
  const [stepLoading, setStepLoading] = useState<boolean>(false);
  const [stepLoadingText, setStepLoadingText] = useState<string>("");

  const [vehicleType, setVehicleType] = useState<"motorcycle" | "car">("motorcycle");
  const [vehBrand, setVehBrand] = useState<string>("Yamaha");
  const [vehModel, setVehModel] = useState<string>("NMAX 155");
  const [vehEngine, setVehEngine] = useState<string>("155 cc");
  const [vehColor, setVehColor] = useState<string>("Noir Mat");
  const [vehPlate, setVehPlate] = useState<string>("48291-A-33");
  const [vehYear, setVehYear] = useState<string>("2023");
  const [vehPhotoUploaded, setVehPhotoUploaded] = useState<boolean>(true);
  const [vehBackPhotoUploaded, setVehBackPhotoUploaded] = useState<boolean>(true);
  const [vehRegUploaded, setVehRegUploaded] = useState<boolean>(true);

  const [driverFirstName, setDriverFirstName] = useState<string>("Amine");
  const [driverLastName, setDriverLastName] = useState<string>("Tazi");
  const [driverPhone, setDriverPhone] = useState<string>("+212 6 62 10 20 30");
  const [driverEmail, setDriverEmail] = useState<string>("amine.tazi@foodi.ma");
  const [userPhotoUploaded, setUserPhotoUploaded] = useState<boolean>(true);
  const [permitUploaded, setPermitUploaded] = useState<boolean>(true);
  const [cinUploaded, setCinUploaded] = useState<boolean>(true);
  const [cinNumber, setCinNumber] = useState<string>("JC582910");
  const [licenseNumber, setLicenseNumber] = useState<string>("33/89210");

  const [driverState, setDriverState] = useState<DriverState>("offline");
  const [activeTab, setActiveTab] = useState<"home" | "deliveries" | "profile" | "settings">("home");
  const [orderDetailsTab, setOrderDetailsTab] = useState<"order" | "customer">("order");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailSuccessToast, setEmailSuccessToast] = useState<string>("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccessToast, setPasswordSuccessToast] = useState<string>("");

  const [todayEarnings, setTodayEarnings] = useState<number>(184);
  const [todayDeliveriesCount, setTodayDeliveriesCount] = useState<number>(7);
  const [onlineMinutes, setOnlineMinutes] = useState<number>(225);

  const [driverLocation, setDriverLocation] = useState<LatLng>([30.4215, -9.5982]);
  const [isDemoLocation, setIsDemoLocation] = useState<boolean>(true);

  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [incomingOffers, setIncomingOffers] = useState<Array<OrderRecord & { remainingSeconds: number }>>([]);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState<boolean>(false);
  const [pickupCodeInput, setPickupCodeInput] = useState<string>("");
  const [pickupCodeError, setPickupCodeError] = useState<string>("");

  const [routeDistance, setRouteDistance] = useState<string>("1.8 km");
  const [routeDuration, setRouteDuration] = useState<string>("6 min");

  const [completedList, setCompletedList] = useState<Array<{
    id: string;
    restaurantName: string;
    neighborhood: string;
    earned: number;
    time: string;
    distance: string;
  }>>([
    {
      id: "CMD-AGD-4921",
      restaurantName: "McDonald's Agadir",
      neighborhood: "Talborjt",
      earned: 25,
      time: "18:30",
      distance: "4.2 km"
    },
    {
      id: "CMD-AGD-3810",
      restaurantName: "KFC Hassan II",
      neighborhood: "Haut Founty",
      earned: 28,
      time: "17:15",
      distance: "5.8 km"
    },
    {
      id: "CMD-AGD-2104",
      restaurantName: "Tacos de Lyon",
      neighborhood: "Dakhla",
      earned: 22,
      time: "16:00",
      distance: "3.6 km"
    }
  ]);

  const [trackingDeliveries, setTrackingDeliveries] = useState<Array<{
    id: string;
    loadNum: string;
    status: "in_transit" | "delivered";
    statusLabel: string;
    restaurantName: string;
    restaurantLogo: string;
    restaurantAddress: string;
    neighborhood: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    distance: string;
    time: string;
    duration: string;
    earned: number;
    shopCoords: LatLng;
    customerCoords: LatLng;
    steps: Array<{
      title: string;
      location: string;
      time: string;
      status: "completed" | "current" | "pending";
    }>;
  }>>([
    {
      id: "CMD-AGD-4921",
      loadNum: "41239110",
      status: "in_transit",
      statusLabel: "En transit",
      restaurantName: "McDonald's Agadir",
      restaurantLogo: "/images/restaurants/McDonalds.png",
      restaurantAddress: "362 C Ave, Seattle",
      neighborhood: "Talborjt",
      customerName: "David Martinez",
      customerPhone: "+212 6 71 82 93 04",
      customerAddress: "789 Pine Street, Talborjt",
      distance: "4.2 km",
      time: "18:30",
      duration: "18 min",
      earned: 25,
      shopCoords: [30.4167, -9.6],
      customerCoords: [30.4278, -9.5981],
      steps: [
        { title: "Prise en charge (Restaurant)", location: "McDonald's Agadir, Boulevard Mohammed V", time: "18:15", status: "completed" },
        { title: "En transit vers le client", location: "Avenue Hassan II, Talborjt", time: "En cours (≈ 12 min)", status: "current" },
        { title: "Livraison au client", location: "789 Pine Street, Talborjt", time: "Estimée 18:35", status: "pending" }
      ]
    },
    {
      id: "CMD-AGD-3568",
      loadNum: "3568129",
      status: "delivered",
      statusLabel: "Livrée",
      restaurantName: "KFC Hassan II",
      restaurantLogo: "/images/restaurants/KFC.jpg",
      restaurantAddress: "456 Oak Avenue, Founty",
      neighborhood: "Haut Founty",
      customerName: "Jessica Turner",
      customerPhone: "+212 6 61 44 55 66",
      customerAddress: "789 Pine Street, Chicago",
      distance: "5.8 km",
      time: "17:15",
      duration: "24 min",
      earned: 28,
      shopCoords: [30.419, -9.587],
      customerCoords: [30.412, -9.579],
      steps: [
        { title: "Prise en charge (Restaurant)", location: "KFC Hassan II, Boulevard Mohammed V", time: "16:50", status: "completed" },
        { title: "En transit vers le client", location: "Boulevard Hassan II", time: "17:05", status: "completed" },
        { title: "Livré au client", location: "789 Pine Street, Haut Founty", time: "17:15", status: "completed" }
      ]
    },
    {
      id: "CMD-AGD-1248",
      loadNum: "1248075",
      status: "delivered",
      statusLabel: "Livrée",
      restaurantName: "Pizza Hut Marina",
      restaurantLogo: "/images/restaurants/PIZZAHUT.png",
      restaurantAddress: "456 Oak Avenue, Marina",
      neighborhood: "Marina",
      customerName: "Ashley Roberts",
      customerPhone: "+212 6 70 99 88 77",
      customerAddress: "789 Pine Street, Marina Bay",
      distance: "2.9 km",
      time: "14:40",
      duration: "12 min",
      earned: 22,
      shopCoords: [30.428, -9.615],
      customerCoords: [30.432, -9.621],
      steps: [
        { title: "Prise en charge (Restaurant)", location: "Pizza Hut Marina, Quai des Yachts", time: "14:20", status: "completed" },
        { title: "En transit vers le client", location: "Promenade de la Marina", time: "14:32", status: "completed" },
        { title: "Livré au client", location: "Résidence Marina Bay, Appt 12", time: "14:40", status: "completed" }
      ]
    },
    {
      id: "CMD-AGD-0892",
      loadNum: "9821430",
      status: "delivered",
      statusLabel: "Livrée",
      restaurantName: "Tacos de Lyon",
      restaurantLogo: "/images/restaurants/otacos.png",
      restaurantAddress: "Avenue des FAR, Agadir",
      neighborhood: "Dakhla",
      customerName: "Ismail M.",
      customerPhone: "+212 6 63 77 88 99",
      customerAddress: "Rue 204, Quartier Dakhla",
      distance: "3.6 km",
      time: "13:00",
      duration: "15 min",
      earned: 22,
      shopCoords: [30.415, -9.582],
      customerCoords: [30.408, -9.565],
      steps: [
        { title: "Prise en charge (Restaurant)", location: "Tacos de Lyon, Avenue des FAR", time: "12:45", status: "completed" },
        { title: "En transit vers le client", location: "Boulevard Hassan I", time: "12:55", status: "completed" },
        { title: "Livré au client", location: "Rue 204, Dakhla", time: "13:00", status: "completed" }
      ]
    }
  ]);

  const [trackingSearchQuery, setTrackingSearchQuery] = useState<string>("");
  const [trackingFilter, setTrackingFilter] = useState<"all" | "in_transit" | "delivered">("all");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>("CMD-AGD-4921");
  const [trackingSubTab, setTrackingSubTab] = useState<"info" | "docs">("info");
  const [trackingMobileView, setTrackingMobileView] = useState<"list" | "detail">("list");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const simulationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverLocation([pos.coords.latitude, pos.coords.longitude]);
        setIsDemoLocation(false);
      },
      () => {
        setIsDemoLocation(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleStartOverProfile = () => {
    setIsOnboarded(false);
    setOnboardStep(1);
    try {
      localStorage.removeItem("foodi_driver_onboarded");
    } catch {}
    playChime();
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStepLoading(true);
    setStepLoadingText("Validation technique du véhicule et de la carte grise...");
    setTimeout(() => {
      setStepLoading(false);
      setOnboardStep(2);
    }, 550);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStepLoading(true);
    setStepLoadingText("Contrôle sécurisé des pièces d'identité et du permis...");
    setTimeout(() => {
      setStepLoading(false);
      setOnboardStep(3);
    }, 700);
  };

  const handleFinishOnboarding = () => {
    setIsOnboarded(true);
    try {
      localStorage.setItem("foodi_driver_onboarded", "true");
    } catch {}
    setDriverState("online_searching");
    setActiveTab("home");
    playChime();
  };

  const createDriverIcon = () => {
    return L.divIcon({
      className: "foodi-map-marker-pin",
      html: `
        <div class="foodi-marker-bubble driver">Votre position (Livreur)</div>
        <div class="foodi-marker-icon-box driver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
      `,
      iconSize: [110, 56],
      iconAnchor: [55, 56]
    });
  };

  const createDestIcon = (label: string, isRestaurant: boolean) => {
    const typeClass = isRestaurant ? "restaurant" : "customer";
    const iconSvg = isRestaurant
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    return L.divIcon({
      className: "foodi-map-marker-pin",
      html: `
        <div class="foodi-marker-bubble ${typeClass}">${label}</div>
        <div class="foodi-marker-icon-box ${typeClass}">
          ${iconSvg}
        </div>
      `,
      iconSize: [120, 56],
      iconAnchor: [60, 56]
    });
  };

  const isNavigating =
    driverState === "heading_to_restaurant" ||
    driverState === "arrived_at_restaurant" ||
    driverState === "picked_up" ||
    driverState === "heading_to_customer" ||
    driverState === "arrived_at_customer";

  const isOrderActive = isNavigating || isAccepting;

  const isNavigatingRef = useRef<boolean>(isNavigating);
  isNavigatingRef.current = isNavigating;
  const driverStateRef = useRef<DriverState>(driverState);
  driverStateRef.current = driverState;

  const isHeadingToRestaurant =
    driverState === "heading_to_restaurant" || driverState === "arrived_at_restaurant";

  const targetCoords: LatLng = isHeadingToRestaurant
    ? [activeOrder?.shopLat || 30.4167, activeOrder?.shopLng || -9.6]
    : [activeOrder?.lat || 30.4278, activeOrder?.lng || -9.5981];

  const targetLabel = isHeadingToRestaurant
    ? activeOrder?.restaurantName || "Restaurant"
    : activeOrder?.neighborhood || "Client";

  useEffect(() => {
    if (!isNavigating) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(driverLocation, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(driverLocation, { icon: createDriverIcon() }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(driverLocation);
    }

    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    destMarkerRef.current = L.marker(targetCoords, {
      icon: createDestIcon(targetLabel, isHeadingToRestaurant)
    }).addTo(map);

    let isMounted = true;

    fetchRoadRoute(driverLocation, targetCoords).then((points) => {
      if (!isMounted || !mapInstanceRef.current) return;

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const polyline = L.polyline(points, {
        color: "#FF5A00",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      routePolylineRef.current = polyline;

      const geometry = buildRouteGeometry(points);
      const km = (geometry.totalDistance / 1000).toFixed(1);
      setRouteDistance(`${km} km`);
      const mins = Math.max(3, Math.round(geometry.totalDistance / 380));
      setRouteDuration(`${mins} min`);

      map.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 16
      });
    });

    return () => {
      isMounted = false;
    };
  }, [isNavigating, isHeadingToRestaurant, activeOrder, driverLocation]);

  const filteredTrackingDeliveries = trackingDeliveries.filter((d) => {
    const matchesFilter =
      trackingFilter === "all" ? true : d.status === trackingFilter;
    const matchesQuery =
      trackingSearchQuery.trim() === ""
        ? true
        : d.id.toLowerCase().includes(trackingSearchQuery.toLowerCase()) ||
          d.loadNum.includes(trackingSearchQuery) ||
          d.customerName.toLowerCase().includes(trackingSearchQuery.toLowerCase()) ||
          d.restaurantName.toLowerCase().includes(trackingSearchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const selectedDelivery =
    trackingDeliveries.find((d) => d.id === selectedDeliveryId) ||
    filteredTrackingDeliveries[0] ||
    trackingDeliveries[0];

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(driverLocation, 15, { animate: true });
  };

  const handleGoOnline = () => {
    setDriverState("online_searching");
  };

  const handleGoOffline = () => {
    if (isOrderActive) return;
    clearSimulationTimeouts();
    setDriverState("offline");
    setIncomingOffers([]);
    setActiveOrder(null);
  };

  const clearSimulationTimeouts = useCallback(() => {
    simulationTimeoutsRef.current.forEach((t) => clearTimeout(t));
    simulationTimeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      simulationTimeoutsRef.current.forEach((t) => clearTimeout(t));
      simulationTimeoutsRef.current = [];
    };
  }, []);

  const mockOfferPool: Array<Omit<OrderRecord, "id" | "token">> = [
    {
      restaurantName: "McDonald's Agadir",
      restaurantLogo: "/images/restaurants/McDonalds.png",
      mealImage: "/images/meals/1791902884_mcdo2.png",
      neighborhood: "Talborjt",
      shopNeighborhood: "Talborjt",
      street: "Avenue Hassan II",
      buildingNameNumber: "Résidence Najah, Bât B",
      floorNumber: "2ème",
      doorNumber: "Appt 8",
      date: "Aujourd'hui",
      status: "searching_driver",
      statusLabel: "Recherche d'un coursier Foodi",
      total: 94,
      subtotal: 94,
      deliveryFee: 25,
      address: "Talborjt, Avenue Hassan II, Agadir",
      items: [
        { name: "Menu Maxi Best Of Big Mac", quantity: 1, price: 74 },
        { name: "McFlurry Oreo", quantity: 1, price: 20 }
      ],
      instructions: "Sonner à l'interphone et monter au 2ème étage.",
      customerName: "Youssef Bennani",
      customerPhone: "+212 6 71 82 93 04",
      shopLat: 30.4167,
      shopLng: -9.6,
      lat: 30.4278,
      lng: -9.5981
    },
    {
      restaurantName: "KFC Hassan II",
      restaurantLogo: "/images/restaurants/KFC.jpg",
      mealImage: "/images/banners/1791902905_kfc1.png",
      neighborhood: "Haut Founty",
      shopNeighborhood: "Hassan II",
      street: "Boulevard Mohammed V",
      buildingNameNumber: "Immeuble Al Amal, Entrée 2",
      floorNumber: "1er",
      doorNumber: "Appt 3",
      date: "Aujourd'hui",
      status: "searching_driver",
      statusLabel: "Recherche d'un coursier Foodi",
      total: 112,
      subtotal: 112,
      deliveryFee: 28,
      address: "Haut Founty, Agadir",
      items: [
        { name: "Bucket 12 Tenders Hot & Spicy", quantity: 1, price: 89 },
        { name: "Grande Frite", quantity: 1, price: 23 }
      ],
      instructions: "Laisser au gardien de la résidence si pas de réponse.",
      customerName: "Sara Mansouri",
      customerPhone: "+212 6 61 44 55 66",
      shopLat: 30.419,
      shopLng: -9.587,
      lat: 30.412,
      lng: -9.579
    },
    {
      restaurantName: "Pizza Hut Agadir",
      restaurantLogo: "/images/restaurants/PIZZAHUT.png",
      mealImage: "/images/banners/1791902911_pizzahut.jpg",
      neighborhood: "Marina Agadir",
      shopNeighborhood: "Marina",
      street: "Quai des Yachts",
      buildingNameNumber: "Résidence Marina Bay",
      floorNumber: "3ème",
      doorNumber: "Appt 12",
      date: "Aujourd'hui",
      status: "searching_driver",
      statusLabel: "Recherche d'un coursier Foodi",
      total: 135,
      subtotal: 135,
      deliveryFee: 22,
      address: "Marina, Agadir",
      items: [
        { name: "Pizza Pan Super Supreme (Large)", quantity: 1, price: 110 },
        { name: "Pain à l'ail Mozzarella", quantity: 1, price: 25 }
      ],
      instructions: "Code barrière d'accès : 4820.",
      customerName: "Mehdi Alami",
      customerPhone: "+212 6 70 99 88 77",
      shopLat: 30.428,
      shopLng: -9.615,
      lat: 30.432,
      lng: -9.621
    },
    {
      restaurantName: "Tacos de Lyon",
      restaurantLogo: "/images/restaurants/otacos.png",
      mealImage: "/images/meals/1791902884_mcdo2.png",
      neighborhood: "Quartier Salam",
      shopNeighborhood: "Dakhla",
      street: "Avenue des FAR",
      buildingNameNumber: "Résidence Atlas, Bât C",
      floorNumber: "1er",
      doorNumber: "Appt 4",
      date: "Aujourd'hui",
      status: "searching_driver",
      statusLabel: "Recherche d'un coursier Foodi",
      total: 85,
      subtotal: 85,
      deliveryFee: 22,
      address: "Salam, Agadir",
      items: [
        { name: "Maxi Tacos Viande Hachée", quantity: 1, price: 65 },
        { name: "Boisson Tiramisu", quantity: 1, price: 20 }
      ],
      instructions: "Appeler dès arrivée devant la pharmacie.",
      customerName: "Ismail M.",
      customerPhone: "+212 6 63 77 88 99",
      shopLat: 30.411,
      shopLng: -9.575,
      lat: 30.418,
      lng: -9.562
    }
  ];

  const appendSimulatedOrder = useCallback((indexOffset: number) => {
    const poolLength = mockOfferPool.length;
    setIncomingOffers((prev) => {
      const template = mockOfferPool[(prev.length + indexOffset) % poolLength];
      const newOrder: OrderRecord & { remainingSeconds: number } = {
        ...template,
        id: `CMD-AGD-${Math.floor(1000 + Math.random() * 9000)}`,
        token: `trk_demo_${Date.now()}_${indexOffset}`,
        remainingSeconds: 15
      };
      return [...prev, newOrder];
    });
    setDriverState("offer_received");
    playChime();
  }, [playChime, mockOfferPool]);

  const declinedOrderIdsRef = useRef<Set<string>>(new Set());
  const processedOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchAllOrders = useCallback(async (): Promise<OrderRecord[]> => {
    let apiOrders: OrderRecord[] = [];
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        apiOrders = await res.json();
      }
    } catch {}

    let localOrders: OrderRecord[] = [];
    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        localOrders = JSON.parse(raw);
      }
    } catch {}

    const map = new Map<string, OrderRecord>();
    const staticBaseline = ordersData as unknown as OrderRecord[];
    [...staticBaseline, ...apiOrders, ...localOrders].forEach((ord) => {
      if (ord && ord.id) {
        map.set(ord.id, { ...map.get(ord.id), ...ord });
      }
    });

    return Array.from(map.values());
  }, []);

  const formatOrderAsOffer = useCallback((ord: OrderRecord): OrderRecord & { remainingSeconds: number } => {
    return {
      ...ord,
      restaurantName: ord.restaurantName || "Restaurant Foodi",
      restaurantLogo: ord.restaurantLogo || "/images/restaurants/McDonalds.png",
      neighborhood: ord.neighborhood || "Talborjt",
      shopNeighborhood: ord.shopNeighborhood || ord.neighborhood || "Talborjt",
      deliveryFee: ord.deliveryFee || 25,
      remainingSeconds: 25,
      mealImage: ord.mealImage || ord.items?.[0]?.image || ord.restaurantLogo || "/images/meals/1791902884_mcdo2.png"
    };
  }, []);

  const checkNewOrders = useCallback(async () => {
    if (driverStateRef.current === "offline" || isNavigatingRef.current) return;

    const allOrders = await fetchAllOrders();
    const candidateOrders = allOrders.filter((ord) => {
      if (!ord || !ord.id) return false;
      if (declinedOrderIdsRef.current.has(ord.id)) return false;
      if (activeOrder?.id === ord.id) return false;
      const isPending =
        ord.status === "searching_driver" ||
        ord.status === "pending_confirmation" ||
        ord.status === "preparing";
      return isPending;
    });

    if (candidateOrders.length === 0) return;

    setIncomingOffers((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const newItems = candidateOrders
        .filter((o) => !existingIds.has(o.id) && !processedOrderIdsRef.current.has(o.id))
        .map(formatOrderAsOffer);

      if (newItems.length === 0) return prev;

      newItems.forEach((it) => processedOrderIdsRef.current.add(it.id));
      setDriverState("offer_received");
      playChime();
      return [...newItems, ...prev];
    });
  }, [fetchAllOrders, activeOrder, formatOrderAsOffer, playChime]);

  useEffect(() => {
    if (driverState !== "online_searching" || isNavigating) return;

    checkNewOrders();
    const interval = setInterval(() => {
      checkNewOrders();
    }, 2500);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "foodi_orders") {
        checkNewOrders();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [driverState, isNavigating, checkNewOrders]);

  const updateLiveOrderStatus = async (status: OrderStatus, statusLabel: string) => {
    if (!activeOrder) return;
    const patch = {
      id: activeOrder.id,
      token: activeOrder.token,
      status,
      statusLabel,
      courierName: `${driverFirstName} ${driverLastName}`,
      courierPhone: driverPhone
    };

    try {
      await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch {}

    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((o: any) =>
          o.id === activeOrder.id || (activeOrder.token && o.token === activeOrder.token)
            ? { ...o, ...patch }
            : o
        );
        localStorage.setItem("foodi_orders", JSON.stringify(updated));
      }
    } catch {}
  };

  const handleTriggerSimulatedOffer = (count: number = 1) => {
    if (isOrderActive) return;

    clearSimulationTimeouts();

    if (count === 1) {
      appendSimulatedOrder(0);
      return;
    }

    appendSimulatedOrder(0);

    const t1 = setTimeout(() => {
      if (driverStateRef.current === "offline" || isNavigatingRef.current) return;
      appendSimulatedOrder(1);
    }, 3000);

    const t2 = setTimeout(() => {
      if (driverStateRef.current === "offline" || isNavigatingRef.current) return;
      appendSimulatedOrder(2);
    }, 8000);

    simulationTimeoutsRef.current = [t1, t2];
  };

  useEffect(() => {
    if (incomingOffers.length === 0 || isNavigating) return;

    const interval = setInterval(() => {
      setIncomingOffers((prevList) => {
        const nextList = prevList
          .map((item) => ({ ...item, remainingSeconds: item.remainingSeconds - 1 }))
          .filter((item) => item.remainingSeconds > 0);

        if (nextList.length === 0) {
          setDriverState("online_searching");
        }
        return nextList;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingOffers.length, isNavigating]);

  const handleAcceptSingleOffer = async (offer: OrderRecord) => {
    clearSimulationTimeouts();
    setIsProfileDropdownOpen(false);
    setIsMobileSidebarOpen(false);
    setActiveTab("home");
    setActiveOrder(offer);
    setIncomingOffers([]);
    setIsAccepting(true);
    playChime();

    const patch = {
      id: offer.id,
      token: offer.token,
      status: "heading_to_restaurant" as OrderStatus,
      statusLabel: "Coursier assigné, en route vers le restaurant",
      courierName: `${driverFirstName} ${driverLastName}`,
      courierPhone: driverPhone
    };

    try {
      await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch {}

    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((o: any) =>
          o.id === offer.id || (offer.token && o.token === offer.token)
            ? { ...o, ...patch }
            : o
        );
        localStorage.setItem("foodi_orders", JSON.stringify(updated));
      }
    } catch {}

    setTimeout(() => {
      setIsAccepting(false);
      setDriverState("heading_to_restaurant");
      setPickupCodeInput("");
      setPickupCodeError("");

      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight || document.body.scrollHeight,
          behavior: "smooth"
        });
        const bottomPanel = document.querySelector(".driver-bottom-panel");
        if (bottomPanel) {
          bottomPanel.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 250);
    }, 600);
  };

  useEffect(() => {
    if (isNavigating) {
      setActiveTab("home");
      const timer = setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight || document.body.scrollHeight,
          behavior: "smooth"
        });
        const bottomPanel = document.querySelector(".driver-bottom-panel");
        if (bottomPanel) {
          bottomPanel.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isNavigating]);

  const handleDeclineSingleOffer = (offerId: string) => {
    declinedOrderIdsRef.current.add(offerId);
    setIncomingOffers((prevList) => {
      const nextList = prevList.filter((item) => item.id !== offerId);
      if (nextList.length === 0) {
        setDriverState("online_searching");
      }
      return nextList;
    });
  };

  const handleArrivedAtRestaurant = () => {
    setDriverState("arrived_at_restaurant");
    updateLiveOrderStatus("heading_to_restaurant", "Coursier arrivé au restaurant, retrait en cours");
  };

  const handleOrderPickedUp = () => {
    setDriverState("picked_up");
    updateLiveOrderStatus("in_delivery", "Commande récupérée, coursier en route vers votre adresse");
    setTimeout(() => {
      setDriverState("heading_to_customer");
    }, 450);
  };

  const handleArrivedAtCustomer = () => {
    setDriverState("arrived_at_customer");
    updateLiveOrderStatus("in_delivery", "Coursier arrivé devant votre adresse");
  };

  const handleCompleteDelivery = () => {
    if (!activeOrder) return;
    clearSimulationTimeouts();
    const earned = activeOrder.deliveryFee || 25;

    updateLiveOrderStatus("delivered", "Commande livrée avec succès");

    setTodayEarnings((prev) => prev + earned);
    setTodayDeliveriesCount((prev) => prev + 1);

    setCompletedList((prev) => [
      {
        id: activeOrder.id,
        restaurantName: activeOrder.restaurantName,
        neighborhood: activeOrder.neighborhood,
        earned,
        time: "À l'instant",
        distance: routeDistance || "4.2 km"
      },
      ...prev
    ]);

    setTrackingDeliveries((prev) => [
      {
        id: activeOrder.id,
        loadNum: activeOrder.id.replace(/\D/g, "") || String(Date.now()).slice(-7),
        status: "delivered",
        statusLabel: "Livrée",
        restaurantName: activeOrder.restaurantName,
        restaurantLogo: activeOrder.restaurantLogo || "/images/restaurants/McDonalds.png",
        restaurantAddress: activeOrder.street || activeOrder.address || "Restaurant, Agadir",
        neighborhood: activeOrder.neighborhood || "Talborjt",
        customerName: activeOrder.customerName || "Client Foodi",
        customerPhone: activeOrder.customerPhone || "+212 6 71 82 93 04",
        customerAddress: activeOrder.address || "Agadir",
        distance: routeDistance || "4.2 km",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        duration: routeDuration || "18 min",
        earned,
        shopCoords: [activeOrder.shopLat || 30.4167, activeOrder.shopLng || -9.6],
        customerCoords: [activeOrder.lat || 30.4278, activeOrder.lng || -9.5981],
        steps: [
          { title: "Prise en charge (Restaurant)", location: `${activeOrder.restaurantName}, Agadir`, time: "Validé", status: "completed" },
          { title: "En transit vers le client", location: activeOrder.neighborhood || "Agadir", time: "Validé", status: "completed" },
          { title: "Livré au client", location: activeOrder.address || "Agadir", time: "À l'instant", status: "completed" }
        ]
      },
      ...prev
    ]);

    setDriverState("delivered");
  };

  const handleBackToHome = () => {
    setActiveOrder(null);
    setDriverState("online_searching");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setPasswordSuccessToast("Mot de passe mis à jour avec succès !");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsPasswordModalOpen(false);
    playChime();
    setTimeout(() => setPasswordSuccessToast(""), 4500);
  };

  const openNavigationApp = (app: "google" | "waze" | "apple") => {
    const [lat, lng] = targetCoords;
    let url = "";
    if (app === "google") {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (app === "waze") {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else {
      url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    }
    window.open(url, "_blank");
  };

  if (!isOnboarded) {
    return (
      <div className="driver-onboard-page">
        <header className="driver-onboard-header">
          <div className="driver-onboard-logo-area">
            <Link to="/">
              <img src="/images/logohor.png" alt="Foodi" style={{ height: 32, objectFit: "contain" }} />
            </Link>
            <span className="driver-onboard-title-divider" />
            <span className="driver-onboard-title-text">
              Inscription Coursier Partenaire
            </span>
          </div>

          <div className="driver-onboard-stepper">
            <div className="driver-onboard-step-pill">
              <span className={`driver-onboard-step-num ${onboardStep >= 1 ? "active" : "pending"}`}>
                1
              </span>
              <span className="driver-onboard-step-label">Véhicule</span>
            </div>

            <div className="driver-onboard-step-line" />

            <div className="driver-onboard-step-pill">
              <span className={`driver-onboard-step-num ${onboardStep >= 2 ? "active" : "pending"}`}>
                2
              </span>
              <span className="driver-onboard-step-label">Identité & Permis</span>
            </div>

            <div className="driver-onboard-step-line" />

            <div className="driver-onboard-step-pill">
              <span className={`driver-onboard-step-num ${onboardStep === 3 ? "done" : "pending"}`}>
                3
              </span>
              <span className="driver-onboard-step-label">Validation</span>
            </div>
          </div>
        </header>

        <div className="driver-onboard-body">
          <aside className="driver-onboard-sidebar">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 9999, backgroundColor: "rgba(255, 90, 0, 0.15)", color: "#FF5A00", fontSize: 12, fontWeight: 900, border: "1px solid rgba(255, 90, 0, 0.3)", width: "fit-content" }}>
                <Bike size={16} />
                <span>Réseau Coursiers Agadir</span>
              </div>

              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.25 }}>
                  Rejoignez la flotte de livraison Foodi
                </h2>
                <p style={{ fontSize: 13, color: "#A1A1AA", marginTop: 8, lineHeight: 1.6 }}>
                  Remplissez vos informations véhicule, téléversez votre permis et commencez à livrer en toute indépendance.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ backgroundColor: "#27272A", padding: 14, borderRadius: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255, 90, 0, 0.2)", color: "#FF5A00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "#FFFFFF" }}>Rémunération par course</h4>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Tarifs garantis dès la prise en charge et 100% des pourboires.</p>
                  </div>
                </div>

                <div style={{ backgroundColor: "#27272A", padding: 14, borderRadius: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 900, color: "#FFFFFF" }}>Assurance & Sécurité</h4>
                    <p style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Couverture complète lors de chacun de vos trajets en service.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #27272A", paddingTop: 16, fontSize: 12, color: "#71717A", display: "flex", justifyContent: "space-between" }}>
              <span>Grand Agadir</span>
              <strong style={{ color: "#E4E4E7" }}>Talborjt • Founty • Marina</strong>
            </div>
          </aside>

          <div className="driver-onboard-form-card">
            {stepLoading ? (
              <div style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, border: "4px solid rgba(255, 90, 0, 0.2)", borderTopColor: "#FF5A00", borderRadius: 9999, animation: "spin 1s linear infinite" }} />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0B1020" }}>{stepLoadingText}</h3>
                  <p style={{ fontSize: 12, color: "#7A8194", marginTop: 4 }}>Traitement sécurisé de vos données Foodi...</p>
                </div>
              </div>
            ) : onboardStep === 1 ? (
              <form onSubmit={handleNextStep1} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ borderBottom: "1px solid rgba(11, 16, 32, 0.08)", paddingBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#FF5A00", letterSpacing: 0.5 }}>
                    Étape 1 sur 2
                  </span>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>
                    Informations sur votre véhicule de livraison
                  </h2>
                  <p style={{ fontSize: 12, color: "#7A8194", marginTop: 4 }}>
                    Sélectionnez le type d'engin utilisé pour vos livraisons et indiquez les détails de votre deux-roues.
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block" }}>
                    Type de véhicule
                  </label>
                  <div className="driver-vehicle-selector">
                    <div
                      onClick={() => setVehicleType("motorcycle")}
                      className={`driver-vehicle-option ${vehicleType === "motorcycle" ? "selected" : ""}`}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFF2EB", color: "#FF5A00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bike size={24} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: "#0B1020" }}>Moto / Scooter</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "2px 6px", borderRadius: 9999 }}>Actif</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#7A8194" }}>Idéal pour la rapidité urbaine à Agadir</span>
                      </div>
                    </div>

                    <div className="driver-vehicle-option disabled">
                      <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#F1F5F9", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Car size={24} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: "#64748B" }}>Voiture</span>
                          <span style={{ fontSize: 10, fontWeight: 900, color: "#64748B", backgroundColor: "#E2E8F0", padding: "2px 6px", borderRadius: 9999 }}>Bientôt</span>
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>Ouverture prochaine</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="driver-onboard-input-grid">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Marque du véhicule
                    </label>
                    <input
                      type="text"
                      required
                      value={vehBrand}
                      onChange={(e) => setVehBrand(e.target.value)}
                      placeholder="ex: Yamaha, Honda, SYM"
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Modèle précis
                    </label>
                    <input
                      type="text"
                      required
                      value={vehModel}
                      onChange={(e) => setVehModel(e.target.value)}
                      placeholder="ex: NMAX 155, TMAX"
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Cylindrée moteur
                    </label>
                    <input
                      type="text"
                      required
                      value={vehEngine}
                      onChange={(e) => setVehEngine(e.target.value)}
                      placeholder="ex: 125 cc, 155 cc"
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Couleur du deux-roues
                    </label>
                    <input
                      type="text"
                      required
                      value={vehColor}
                      onChange={(e) => setVehColor(e.target.value)}
                      placeholder="ex: Noir mat, Blanc"
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Immatriculation (Plaque)
                    </label>
                    <input
                      type="text"
                      required
                      value={vehPlate}
                      onChange={(e) => setVehPlate(e.target.value)}
                      placeholder="ex: 48291-A-33"
                      className="driver-input-box"
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Année de fabrication
                    </label>
                    <input
                      type="text"
                      required
                      value={vehYear}
                      onChange={(e) => setVehYear(e.target.value)}
                      placeholder="ex: 2023"
                      className="driver-input-box"
                    />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(11, 16, 32, 0.08)", paddingTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 900, color: "#0B1020", display: "block" }}>
                    Documents & Photos du véhicule
                  </label>
                  <p style={{ fontSize: 11, color: "#7A8194", marginTop: 2 }}>
                    Téléversez des photos claires et lisibles pour vérification rapide
                  </p>

                  <div className="driver-upload-grid">
                    <div
                      onClick={() => setVehPhotoUploaded(true)}
                      className={`driver-upload-card ${vehPhotoUploaded ? "ready" : ""}`}
                    >
                      <Camera size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Photo moto complète</span>
                      <span className={`driver-upload-badge ${vehPhotoUploaded ? "ready" : "pending"}`}>
                        {vehPhotoUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setVehBackPhotoUploaded(true)}
                      className={`driver-upload-card ${vehBackPhotoUploaded ? "ready" : ""}`}
                    >
                      <Camera size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Vue arrière & Plaque</span>
                      <span className={`driver-upload-badge ${vehBackPhotoUploaded ? "ready" : "pending"}`}>
                        {vehBackPhotoUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setVehRegUploaded(true)}
                      className={`driver-upload-card ${vehRegUploaded ? "ready" : ""}`}
                    >
                      <FileText size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Carte grise / Certificat</span>
                      <span className={`driver-upload-badge ${vehRegUploaded ? "ready" : "pending"}`}>
                        {vehRegUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="driver-onboard-form-actions">
                  <button
                    type="submit"
                    className="driver-btn-panel-primary driver-onboard-submit-btn"
                  >
                    <span className="driver-text-desktop">Continuer vers les informations personnelles</span>
                    <span className="driver-text-mobile">Continuer</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            ) : onboardStep === 2 ? (
              <form onSubmit={handleNextStep2} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ borderBottom: "1px solid rgba(11, 16, 32, 0.08)", paddingBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#10B981", letterSpacing: 0.5 }}>
                    Étape 2 sur 2
                  </span>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>
                    Identité du coursier & Permis de conduire
                  </h2>
                  <p style={{ fontSize: 12, color: "#7A8194", marginTop: 4 }}>
                    Complétez vos coordonnées personnelles et téléversez vos justificatifs d'identité et de permis.
                  </p>
                </div>

                <div className="driver-onboard-input-grid">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Prénom
                    </label>
                    <input
                      type="text"
                      required
                      value={driverFirstName}
                      onChange={(e) => setDriverFirstName(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Nom de famille
                    </label>
                    <input
                      type="text"
                      required
                      value={driverLastName}
                      onChange={(e) => setDriverLastName(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Numéro CNIE
                    </label>
                    <input
                      type="text"
                      required
                      value={cinNumber}
                      onChange={(e) => setCinNumber(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 4 }}>
                      Numéro de Permis de conduire
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="driver-input-box"
                    />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(11, 16, 32, 0.08)", paddingTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 900, color: "#0B1020", display: "block" }}>
                    Pièces justificatives obligatoires
                  </label>
                  <p style={{ fontSize: 11, color: "#7A8194", marginTop: 2 }}>
                    Vérification légale pour activer les paiements et courses
                  </p>

                  <div className="driver-upload-grid">
                    <div
                      onClick={() => setUserPhotoUploaded(true)}
                      className={`driver-upload-card ${userPhotoUploaded ? "ready" : ""}`}
                    >
                      <User size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Selfie photo de profil</span>
                      <span className={`driver-upload-badge ${userPhotoUploaded ? "ready" : "pending"}`}>
                        {userPhotoUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setPermitUploaded(true)}
                      className={`driver-upload-card ${permitUploaded ? "ready" : ""}`}
                    >
                      <ShieldCheck size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Permis de conduire Cat. A/B</span>
                      <span className={`driver-upload-badge ${permitUploaded ? "ready" : "pending"}`}>
                        {permitUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setCinUploaded(true)}
                      className={`driver-upload-card ${cinUploaded ? "ready" : ""}`}
                    >
                      <FileText size={22} color="#FF5A00" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>Carte d'Identité (CIN)</span>
                      <span className={`driver-upload-badge ${cinUploaded ? "ready" : "pending"}`}>
                        {cinUploaded ? "✓ Prêt" : "+ Téléverser"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="driver-onboard-form-actions-split">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(1)}
                    className="driver-btn-decline driver-onboard-back-btn"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="driver-btn-panel-primary driver-onboard-submit-btn"
                  >
                    <span className="driver-text-desktop">Valider et terminer mon inscription</span>
                    <span className="driver-text-mobile">Valider mon inscription</span>
                    <Check size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: 9999, backgroundColor: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #A7F3D0" }}>
                  <Check size={38} />
                </div>

                <div style={{ maxWidth: 460 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "3px 12px", borderRadius: 9999, border: "1px solid rgba(16, 185, 129, 0.3)", textTransform: "uppercase" }}>
                    Dossier approuvé
                  </span>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0B1020", marginTop: 8 }}>
                    Bienvenue dans l'équipe, {driverFirstName} !
                  </h2>
                  <p style={{ fontSize: 13, color: "#7A8194", marginTop: 6, lineHeight: 1.6 }}>
                    Votre scooter <strong>{vehBrand} {vehModel}</strong> et vos pièces réglementaires sont enregistrés. Vous êtes maintenant prêt à passer en ligne pour recevoir des courses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="driver-toggle-online-btn"
                  style={{ marginTop: 8 }}
                >
                  <span>Accéder à mon tableau de bord livreur</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-layout">
      <aside className="driver-sidebar">
        <div>
          <Link
            to={isOrderActive ? "#" : "/"}
            onClick={(e) => { if (isOrderActive) e.preventDefault(); }}
            className={`driver-sidebar-logo-wrap ${isOrderActive ? "locked" : ""}`}
            title={isOrderActive ? "Livraison en cours" : "Accueil Foodi"}
          >
            <div className="driver-sidebar-logo-icon">F</div>
            <span className="driver-sidebar-logo-text">Foodi</span>
          </Link>

          <nav className="driver-sidebar-menu">
            <button
              type="button"
              disabled={isOrderActive}
              onClick={() => {
                if (isOrderActive) return;
                setActiveTab("home");
                if (driverState === "delivered") setDriverState("online_searching");
              }}
              className={`driver-sidebar-link ${activeTab === "home" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
            >
              <Bike size={18} />
              <span>{isOrderActive ? "Course en cours" : driverState === "online_searching" ? "En attente d'une commande" : "Accueil"}</span>
            </button>

            <button
              type="button"
              disabled={isOrderActive}
              onClick={() => {
                if (isOrderActive) return;
                setActiveTab("deliveries");
              }}
              className={`driver-sidebar-link ${activeTab === "deliveries" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
              title={isOrderActive ? "Livraison en cours : vous ne pouvez pas quitter cet écran" : undefined}
            >
              <PackageCheck size={18} />
              <span>Mes livraisons</span>
            </button>

            <button
              type="button"
              disabled={isOrderActive}
              onClick={() => {
                if (isOrderActive) return;
                setActiveTab("profile");
              }}
              className={`driver-sidebar-link ${activeTab === "profile" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
              title={isOrderActive ? "Livraison en cours : vous ne pouvez pas quitter cet écran" : undefined}
            >
              <User size={18} />
              <span>Mon profil</span>
            </button>

           

           
          </nav>
        </div>

        <div className="driver-sidebar-bottom">
          <div className="driver-sidebar-online-card">
            <div className="driver-sidebar-online-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`driver-status-dot ${isOrderActive || driverState !== "offline" ? "online" : "offline"}`} />
                <span style={{ fontSize: 13, fontWeight: 800, color: driverState !== "offline" ? "#FFFFFF" : "#94A3B8" }}>
                  {isOrderActive ? "Course active" : driverState !== "offline" ? "En ligne" : "Hors ligne"}
                </span>
              </div>

              <button
                type="button"
                disabled={isOrderActive}
                onClick={() => {
                  if (isOrderActive) return;
                  if (driverState === "offline") {
                    handleGoOnline();
                  } else {
                    handleGoOffline();
                  }
                }}
                className={`driver-switch-toggle ${driverState !== "offline" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
                title={isOrderActive ? "Impossible de passer hors ligne pendant une course" : driverState !== "offline" ? "Passer hors ligne" : "Passer en ligne"}
              >
                <span className="driver-switch-handle" />
              </button>
            </div>
            <span style={{ fontSize: 11, color: isOrderActive ? "#FF7A1A" : "#94A3B8" }}>
              {isOrderActive ? "Verrouillé : terminez la livraison" : driverState !== "offline" ? "Vous recevez les commandes" : "Vous êtes hors ligne"}
            </span>
          </div>

          <button
            type="button"
            disabled={isOrderActive}
            onClick={() => {
              if (isOrderActive) return;
              navigate("/login");
            }}
            className={`driver-sidebar-logout-btn ${isOrderActive ? "locked" : ""}`}
            title={isOrderActive ? "Déconnexion impossible pendant une livraison" : "Se déconnecter"}
          >
            <LogOut size={16} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div className="driver-canvas">
        <header className="driver-canvas-header">
          <div className="driver-canvas-header-left">
            {!isOrderActive && (
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="driver-header-hamburger-btn"
                title="Ouvrir le menu"
                aria-label="Menu"
              >
                <Menu size={22} />
              </button>
            )}

            {isOrderActive ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "not-allowed",
                  userSelect: "none"
                }}
                title="Livraison active en cours"
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FF5A00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontStyle: "italic", fontSize: 16 }}>F</div>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#FF5A00", letterSpacing: "-0.5px" }}>Foodi</span>
              </div>
            ) : (
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none"
                }}
                title="Accueil Foodi"
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FF5A00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontStyle: "italic", fontSize: 16 }}>F</div>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#FF5A00", letterSpacing: "-0.5px" }}>Foodi</span>
              </Link>
            )}
          </div>

          <div className="driver-canvas-header-right">
            <div className="driver-header-profile-wrap">
              <button
                type="button"
                disabled={isOrderActive}
                onClick={() => {
                  if (isOrderActive) return;
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                }}
                className={`driver-header-profile-btn ${isOrderActive ? "locked" : ""}`}
                title={isOrderActive ? "Course active : profil verrouillé" : "Menu profil"}
              >
                <div className="driver-avatar-box">
                  {driverFirstName.slice(0, 1).toUpperCase()}
                </div>
                <div className="driver-profile-meta" style={{ textAlign: "left" }}>
                  <span className="driver-profile-name">{driverFirstName} {driverLastName}</span>
                  <span className={`driver-status-chip ${driverState !== "offline" ? "online" : "offline"}`}>
                    <span className={`driver-status-dot ${driverState !== "offline" ? "online" : "offline"}`} />
                    <span>{isOrderActive ? "Course active" : driverState !== "offline" ? "En ligne" : "Hors ligne"}</span>
                  </span>
                </div>
              </button>

              {isProfileDropdownOpen && !isOrderActive && (
                <>
                  <div
                    className="driver-dropdown-backdrop"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />
                  <div className="driver-profile-dropdown">
                    <div className="driver-dropdown-user-header">
                      <div className="driver-dropdown-user-name">{driverFirstName} {driverLastName}</div>
                      <div className="driver-dropdown-user-role">
                        {isOrderActive ? "🔒 Course active en cours" : "Coursier Foodi Agadir"}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOrderActive}
                      onClick={() => {
                        if (isOrderActive) return;
                        setActiveTab("profile");
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`driver-dropdown-item ${isOrderActive ? "locked" : ""}`}
                      title={isOrderActive ? "Course en cours" : undefined}
                    >
                      <User size={16} />
                      <span>Mon profil</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOrderActive}
                      onClick={() => {
                        if (isOrderActive) return;
                        if (driverState === "offline") {
                          handleGoOnline();
                        } else {
                          handleGoOffline();
                        }
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`driver-dropdown-item ${isOrderActive ? "locked" : ""}`}
                      title={isOrderActive ? "Impossible de passer hors ligne pendant une course" : undefined}
                    >
                      <Power size={16} color={driverState !== "offline" ? "#EF4444" : "#10B981"} />
                      <span>{driverState !== "offline" ? "Passer hors ligne" : "Passer en ligne"}</span>
                    </button>

                    <div style={{ height: 1, backgroundColor: "rgba(11, 16, 32, 0.06)", margin: "4px 0" }} />

                    <button
                      type="button"
                      disabled={isOrderActive}
                      onClick={() => {
                        if (isOrderActive) return;
                        setIsProfileDropdownOpen(false);
                        navigate("/login");
                      }}
                      className={`driver-dropdown-item danger ${isOrderActive ? "locked" : ""}`}
                      title={isOrderActive ? "Déconnexion impossible pendant une livraison" : undefined}
                    >
                      <LogOut size={16} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="driver-mobile-status-strip">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`driver-status-dot ${isOrderActive || driverState !== "offline" ? "online" : "offline"}`} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0B1020" }}>
              {isOrderActive ? "Course en cours" : driverState !== "offline" ? "En ligne" : "Hors ligne"}
            </span>
          </div>
          <button
            type="button"
            disabled={isOrderActive}
            onClick={() => {
              if (isOrderActive) return;
              if (driverState === "offline") {
                handleGoOnline();
              } else {
                handleGoOffline();
              }
            }}
            className={`driver-switch-toggle ${driverState !== "offline" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
            title={isOrderActive ? "Impossible de passer hors ligne pendant une course" : driverState !== "offline" ? "Passer hors ligne" : "Passer en ligne"}
          >
            <span className="driver-switch-handle" />
          </button>
        </div>

        <main className="driver-main">
          {activeTab === "home" && !isNavigating && driverState !== "delivered" && (
            driverState === "online_searching" ? (
              <div className="driver-hero-canvas">
                <svg className="driver-wave-corner-bl" viewBox="0 0 240 200" fill="none">
                  <path d="M 0 100 C 60 140, 140 180, 240 200 L 0 200 Z" fill="#FFEFE6" />
                  <path d="M 0 140 C 40 160, 90 190, 160 200 L 0 200 Z" fill="#FFD8C2" opacity="0.6" />
                </svg>
                <svg className="driver-wave-corner-br" viewBox="0 0 260 220" fill="none">
                  <path d="M 260 90 C 200 130, 100 170, 0 220 L 260 220 Z" fill="#FF5A00" opacity="0.85" />
                  <path d="M 260 140 C 220 165, 140 195, 60 220 L 260 220 Z" fill="#FF7A1A" />
                </svg>

                <DriverHeroIllustration />

                <h2 className="driver-hero-title">En attente d'une commande...</h2>
                <p className="driver-hero-subtitle">Restez connecté, une commande arrivera bientôt !</p>

                <div className="driver-hero-loader-wrap">
                  <div className="driver-hero-loader-bar" />
                </div>

                <div className="driver-hero-pill-info">
                  <Clock size={15} color="#FF5A00" />
                  <span>Nous vous notifierons dès qu'une commande est disponible</span>
                  <Bell size={15} color="#FF5A00" />
                </div>

                <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedOffer(1)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(255, 90, 0, 0.3)",
                      color: "#FF5A00",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "8px 18px",
                      borderRadius: 9999,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(255, 90, 0, 0.12)"
                    }}
                  >
                    <Sparkles size={14} />
                    <span>Simuler 1 commande (15s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedOffer(3)}
                    style={{
                      backgroundColor: "#FFF2EB",
                      border: "1px solid rgba(255, 90, 0, 0.4)",
                      color: "#FF5A00",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "8px 18px",
                      borderRadius: 9999,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(255, 90, 0, 0.12)"
                    }}
                  >
                    <Zap size={14} />
                    <span>Simuler 3 commandes (cascade 3s & 5s)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="driver-home-wrapper">
                <div className="driver-control-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 520 }}>
                    <div style={{ width: 68, height: 68, borderRadius: 9999, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                      <Power size={32} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0B1020" }}>Vous êtes actuellement hors ligne</h2>
                      <p style={{ fontSize: 13, color: "#7A8194", marginTop: 4 }}>
                        Passez en ligne pour commencer à recevoir des livraisons et maximiser vos gains dans le Grand Agadir.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoOnline}
                      className="driver-toggle-online-btn"
                    >
                      <Bike size={22} />
                      <span>Passer en ligne</span>
                    </button>
                  </div>
                </div>

                <div className="driver-stats-grid">
                  <div className="driver-stat-card">
                    <div className="driver-stat-header">
                      <span>Gains du jour</span>
                      <DollarSign size={16} color="#10B981" />
                    </div>
                    <div className="driver-stat-val" style={{ color: "#047857" }}>{todayEarnings}.00 MAD</div>
                    <div className="driver-stat-sub">Pourboires 100% reversés</div>
                  </div>

                  <div className="driver-stat-card">
                    <div className="driver-stat-header">
                      <span>Courses complétées</span>
                      <PackageCheck size={16} color="#FF5A00" />
                    </div>
                    <div className="driver-stat-val">{todayDeliveriesCount}</div>
                    <div className="driver-stat-sub">+2 par rapport à hier</div>
                  </div>

                  <div className="driver-stat-card">
                    <div className="driver-stat-header">
                      <span>Temps connecté</span>
                      <Clock size={16} color="#6366F1" />
                    </div>
                    <div className="driver-stat-val">
                      {Math.floor(onlineMinutes / 60)}h {onlineMinutes % 60}m
                    </div>
                    <div className="driver-stat-sub">Secteur Agadir Centre</div>
                  </div>

                  <div className="driver-stat-card">
                    <div className="driver-stat-header">
                      <span>Note satisfaction</span>
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    </div>
                    <div className="driver-stat-val">4.95 ★</div>
                    <div className="driver-stat-sub">Sur 142 évaluations</div>
                  </div>
                </div>
              </div>
            )
          )}

        {activeTab === "home" && isNavigating && (
          <div className="driver-nav-screen">
            <div ref={mapContainerRef} className="driver-nav-map-container" />

            <div className="driver-nav-top-banner">
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span className="driver-nav-top-step">
                  {isHeadingToRestaurant ? "Étape 1/2 : Vers le restaurant" : "Étape 2/2 : Vers le client"}
                </span>
                <span style={{ color: "#CBD5E1" }}>•</span>
                <span className="driver-nav-top-dest">{targetLabel}</span>
              </div>
              <div className="driver-nav-driver-loc-bar">
                <Navigation size={12} color="#FF5A00" style={{ transform: "rotate(45deg)", flexShrink: 0 }} />
                <span>  <strong>Boulevard Hassan II </strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecenter}
              className="driver-map-recenter-btn"
              title="Recentrer sur ma position"
            >
              <LocateFixed size={20} />
            </button>

            {isDemoLocation && (
              <div className="driver-demo-pill">
                <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "#F59E0B" }} />
                <span>Position Agadir (Mode démo)</span>
              </div>
            )}

            <div className="driver-bottom-panel">
              <div className="driver-panel-driver-pos-badge">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Navigation size={13} color="#FF5A00" style={{ transform: "rotate(45deg)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#FF5A00", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Position livreur
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#0B1020" }}>
                  Boulevard Hassan II, Talborjt, Agadir
                </span>
              </div>

              <div className="driver-panel-row-top">
                <div className="driver-panel-eta-badge">
                  <Clock size={16} />
                  <span>{routeDuration} ({routeDistance})</span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: "#10B981" }}>
                  Gain course : {activeOrder?.deliveryFee || 25}.00 MAD
                </div>
              </div>

              <div className="driver-panel-info-block">
                <img
                  src={
                    isHeadingToRestaurant
                      ? activeOrder?.restaurantLogo || "/images/restaurants/McDonalds.png"
                      : "/images/auth/verify.jpg"
                  }
                  alt={targetLabel}
                  className="driver-panel-avatar"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="driver-panel-title">{targetLabel}</div>
                  <div className="driver-panel-addr">
                    {isHeadingToRestaurant
                      ? "Avenue Hassan II, Talborjt, Agadir"
                      : `${activeOrder?.street || "Avenue Hassan II"}, ${activeOrder?.buildingNameNumber || ""}`}
                  </div>
                </div>
              </div>

              {!isHeadingToRestaurant && activeOrder?.instructions && (
                <div className="driver-panel-instructions">
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span>Consigne : {activeOrder.instructions}</span>
                </div>
              )}

              <div className="driver-gps-options-row">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${targetCoords[0]},${targetCoords[1]}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                  className="driver-gps-btn"
                >
                  <img src="/images/ui/google-maps.svg" alt="Google Maps" className="driver-gps-logo" />
                  <span className="driver-gps-name">Google Maps</span>
                </a>

                <a
                  href={`https://waze.com/ul?ll=${targetCoords[0]},${targetCoords[1]}&navigate=yes`}
                  target="_blank"
                  rel="noreferrer"
                  className="driver-gps-btn"
                >
                  <img src="/images/ui/waze.svg" alt="Waze" className="driver-gps-logo" />
                  <span className="driver-gps-name">Waze</span>
                </a>

                <a
                  href={`http://maps.apple.com/?daddr=${targetCoords[0]},${targetCoords[1]}&dirflg=d`}
                  target="_blank"
                  rel="noreferrer"
                  className="driver-gps-btn"
                >
                  <img src="/images/ui/apple-maps.svg" alt="Apple Maps" className="driver-gps-logo" />
                  <span className="driver-gps-name">Apple Maps</span>
                </a>
              </div>

              <div className="driver-panel-action-btns">
                <button
                  type="button"
                  onClick={() => setIsOrderDetailsOpen(true)}
                  className="driver-btn-panel-secondary"
                >
                  <FileText size={16} />
                  <span>Détails</span>
                </button>

                {driverState === "heading_to_restaurant" && (
                  <button
                    type="button"
                    onClick={handleArrivedAtRestaurant}
                    className="driver-btn-panel-primary"
                  >
                    <MapPin size={18} />
                    <span>Je suis arrivé</span>
                  </button>
                )}

                {driverState === "arrived_at_restaurant" && (
                  <button
                    type="button"
                    onClick={handleOrderPickedUp}
                    className="driver-btn-panel-success"
                  >
                    <CheckCircle2 size={18} />
                    <span>Commande récupérée</span>
                  </button>
                )}

                {driverState === "heading_to_customer" && (
                  <button
                    type="button"
                    onClick={handleArrivedAtCustomer}
                    className="driver-btn-panel-primary"
                  >
                    <MapPin size={18} />
                    <span>Arrivé chez le client</span>
                  </button>
                )}

                {driverState === "arrived_at_customer" && (
                  <button
                    type="button"
                    onClick={handleCompleteDelivery}
                    className="driver-btn-panel-success"
                  >
                    <CheckCircle2 size={18} />
                    <span>Terminer la livraison</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {driverState === "delivered" && (
          <div className="driver-modal-overlay">
            <div className="driver-completion-card">
              <div className="driver-completion-icon-ring">
                <Check size={44} />
              </div>

              <div>
                <h3 className="driver-completion-title">Livraison effectuée avec succès !</h3>
                <p className="driver-completion-sub">
                  Merci pour votre ponctualité. Le client a confirmé la réception de son repas.
                </p>
              </div>

              <div className="driver-completion-earnings-box">
                <div style={{ fontSize: 12, fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                  Gain crédité sur votre compte
                </div>
                <div className="driver-completion-amount">+25.00 MAD</div>
              </div>

              <div className="driver-trip-summary-list">
                <div className="driver-trip-summary-item">
                  <span>Restaurant :</span>
                  <strong>{activeOrder?.restaurantName}</strong>
                </div>
                <div className="driver-trip-summary-item">
                  <span>Destination :</span>
                  <strong>{activeOrder?.neighborhood}</strong>
                </div>
                <div className="driver-trip-summary-item">
                  <span>Distance totale :</span>
                  <strong>5.2 km</strong>
                </div>
                <div className="driver-trip-summary-item">
                  <span>Durée de livraison :</span>
                  <strong>22 minutes</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackToHome}
                style={{
                  width: "100%",
                  backgroundColor: "#FF5A00",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 15,
                  fontWeight: 900,
                  padding: 14,
                  borderRadius: 16,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(255, 90, 0, 0.3)"
                }}
              >
                Retour à l'accueil coursier
              </button>
            </div>
          </div>
        )}

        {activeTab === "deliveries" && (
          <div className="driver-logistics-container">
            <div
              className="driver-logistics-list-col"
              style={{ display: trackingMobileView === "detail" && window.innerWidth < 1024 ? "none" : undefined }}
            >
              <div className="driver-logistics-header">
                <div className="driver-logistics-title-row">
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0B1020" }}>Historique des livraisons</h3>
                    <p style={{ fontSize: 11, color: "#7A8194", marginTop: 2 }}>
                      Suivi et historique de vos courses réalisées
                    </p>
                  </div>
                  <div className="driver-earnings-pill">
                    <span className="driver-earnings-label">Gains du jour</span>
                    <span className="driver-earnings-val" style={{ color: "#047857" }}>{todayEarnings}.00 MAD</span>
                  </div>
                </div>

                <div className="driver-logistics-search-wrap">
                  <Search size={15} className="driver-logistics-search-icon" />
                  <input
                    type="text"
                    value={trackingSearchQuery}
                    onChange={(e) => setTrackingSearchQuery(e.target.value)}
                    placeholder="Rechercher par n° de commande, client..."
                    className="driver-logistics-search-input"
                  />
                </div>

                <div className="driver-logistics-filters">
                  <button
                    type="button"
                    onClick={() => setTrackingFilter("all")}
                    className={`driver-logistics-filter-btn ${trackingFilter === "all" ? "active" : ""}`}
                  >
                    <span>Toutes</span>
                    <span className="driver-logistics-filter-count">{trackingDeliveries.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingFilter("in_transit")}
                    className={`driver-logistics-filter-btn ${trackingFilter === "in_transit" ? "active" : ""}`}
                  >
                    <span>En cours</span>
                    <span className="driver-logistics-filter-count">
                      {trackingDeliveries.filter((d) => d.status === "in_transit").length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingFilter("delivered")}
                    className={`driver-logistics-filter-btn ${trackingFilter === "delivered" ? "active" : ""}`}
                  >
                    <span>Livrées</span>
                    <span className="driver-logistics-filter-count">
                      {trackingDeliveries.filter((d) => d.status === "delivered").length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="driver-logistics-cards-list">
                {filteredTrackingDeliveries.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedDeliveryId(item.id);
                      if (window.innerWidth < 1024) setTrackingMobileView("detail");
                    }}
                    className={`driver-logistics-card ${selectedDeliveryId === item.id ? "selected" : ""}`}
                  >
                    <div className="driver-logistics-card-top">
                      <span className="driver-logistics-card-id">#{item.loadNum}</span>
                      <span className={`driver-logistics-badge ${item.status}`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="driver-logistics-route-bar">
                      <div className="driver-logistics-dot" />
                      <div className="driver-logistics-line">
                        <div className="driver-logistics-vehicle-icon">
                          <Bike size={13} />
                        </div>
                      </div>
                      <div className="driver-logistics-dot" />
                    </div>

                    <div className="driver-logistics-addresses">
                      <div className="driver-logistics-addr-row">
                        <Building2 size={13} color="#FF5A00" style={{ flexShrink: 0 }} />
                        <span className="driver-logistics-addr-text">{item.restaurantAddress}</span>
                      </div>
                      <div className="driver-logistics-addr-row">
                        <MapPin size={13} color="#10B981" style={{ flexShrink: 0 }} />
                        <span className="driver-logistics-addr-text">{item.customerAddress}</span>
                      </div>
                    </div>

                    <div className="driver-logistics-customer-row">
                      <div className="driver-logistics-cust-info">
                        <div className="driver-logistics-cust-avatar">
                          {item.customerName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="driver-logistics-cust-name">{item.customerName}</div>
                          <div style={{ fontSize: 10, color: "#64748B" }}>Client Foodi</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "3px 9px", borderRadius: 9999, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                        +{item.earned}.00 MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="driver-logistics-detail-col"
              style={{ display: trackingMobileView === "list" && window.innerWidth < 1024 ? "none" : undefined }}
            >
              {selectedDelivery && (
                <>
                  <div className="driver-logistics-detail-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setTrackingMobileView("list")}
                        className="driver-logistics-back-btn"
                        title="Retour à la liste"
                      >
                        <ArrowLeft size={16} />
                        <span>Retour</span>
                      </button>

                      <span style={{ fontSize: 16, fontWeight: 900, color: "#0B1020" }}>
                        Course #{selectedDelivery.loadNum}
                      </span>
                      <span className={`driver-logistics-badge ${selectedDelivery.status}`}>
                        {selectedDelivery.statusLabel}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "3px 10px", borderRadius: 9999, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                        +{selectedDelivery.earned}.00 MAD
                      </span>
                    </div>

                    <div className="driver-logistics-subtabs">
                      <button
                        type="button"
                        onClick={() => setTrackingSubTab("info")}
                        className={`driver-logistics-subtab-btn ${trackingSubTab === "info" ? "active" : ""}`}
                      >
                        Détails & Étapes
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackingSubTab("docs")}
                        className={`driver-logistics-subtab-btn ${trackingSubTab === "docs" ? "active" : ""}`}
                      >
                        Reçu officiel
                      </button>
                    </div>
                  </div>

                  <div className="driver-logistics-content-no-map">
                    {trackingSubTab === "docs" ? (
                      <div className="driver-logistics-receipt-card">
                        <div className="driver-receipt-badge-header">
                          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#ECFDF5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: "#0B1020" }}>Reçu de livraison certifié</div>
                            <div style={{ fontSize: 12, color: "#7A8194" }}>Course #{selectedDelivery.loadNum} • Traité et validé</div>
                          </div>
                        </div>

                        <div className="driver-receipt-breakdown">
                          <div className="driver-receipt-line">
                            <span>Prise en charge ({selectedDelivery.restaurantName})</span>
                            <strong>15.00 MAD</strong>
                          </div>
                          <div className="driver-receipt-line">
                            <span>Frais de distance ({selectedDelivery.distance})</span>
                            <strong>{selectedDelivery.earned - 17}.00 MAD</strong>
                          </div>
                          <div className="driver-receipt-line">
                            <span>Pourboire reversé 100%</span>
                            <strong>2.00 MAD</strong>
                          </div>
                          <div className="driver-receipt-total-line">
                            <span>Total crédité coursier</span>
                            <strong style={{ color: "#047857", fontSize: 18 }}>+{selectedDelivery.earned}.00 MAD</strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="driver-logistics-details-wrapper">
                        <div className="driver-logistics-timeline-box">
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#0B1020", marginBottom: 12 }}>
                            Chronologie de la livraison
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            {selectedDelivery.steps.map((step, idx) => (
                              <div key={idx} className="driver-logistics-timeline-item">
                                <div className="driver-logistics-timeline-indicator">
                                  <div className={`driver-logistics-timeline-circle ${step.status}`} />
                                  {idx < selectedDelivery.steps.length - 1 && (
                                    <div className="driver-logistics-timeline-stem" />
                                  )}
                                </div>
                                <div className="driver-logistics-timeline-content">
                                  <div className="driver-logistics-step-title">{step.title}</div>
                                  <div className="driver-logistics-step-loc">{step.location}</div>
                                  <div className="driver-logistics-step-time">{step.time}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="driver-logistics-summary-card">
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#0B1020", marginBottom: 12 }}>
                            Récapitulatif de la course
                          </div>

                          <div className="driver-summary-specs-grid">
                            <div className="driver-summary-spec-item">
                              <span className="driver-spec-label">Restaurant</span>
                              <strong className="driver-spec-val">{selectedDelivery.restaurantName}</strong>
                              <span className="driver-spec-sub">{selectedDelivery.restaurantAddress}</span>
                            </div>

                            <div className="driver-summary-spec-item">
                              <span className="driver-spec-label">Client</span>
                              <strong className="driver-spec-val">{selectedDelivery.customerName}</strong>
                              <span className="driver-spec-sub">{selectedDelivery.customerAddress}</span>
                            </div>

                            <div className="driver-summary-spec-item">
                              <span className="driver-spec-label">Distance & Durée</span>
                              <strong className="driver-spec-val">{selectedDelivery.distance} ({selectedDelivery.duration})</strong>
                              <span className="driver-spec-sub">Heure : {selectedDelivery.time}</span>
                            </div>

                            <div className="driver-summary-spec-item highlight">
                              <span className="driver-spec-label">Rémunération totale</span>
                              <strong className="driver-spec-val" style={{ color: "#047857", fontSize: 16 }}>+{selectedDelivery.earned}.00 MAD</strong>
                              <span className="driver-spec-sub" style={{ color: "#047857" }}>Gain garanti crédité</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="driver-home-wrapper">
            {emailSuccessToast && (
              <div className="driver-toast-banner">
                <CheckCircle2 size={20} color="#10B981" />
                <span>{emailSuccessToast}</span>
              </div>
            )}

            {passwordSuccessToast && (
              <div className="driver-toast-banner">
                <CheckCircle2 size={20} color="#10B981" />
                <span>{passwordSuccessToast}</span>
              </div>
            )}

            <div className="driver-control-card" style={{ textAlign: "left", alignItems: "stretch", gap: 24 }}>
              <div className="driver-profile-header-row">
                <div className="driver-profile-user-info">
                  <div className="driver-profile-large-avatar">
                    {driverFirstName.slice(0, 1).toUpperCase()}{driverLastName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="driver-profile-title-line">
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0B1020" }}>{driverFirstName} {driverLastName}</h3>
                      <span className="driver-verified-chip">
                        Coursier Vérifié Foodi
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#7A8194", marginTop: 2 }}>{driverPhone} • {vehBrand} {vehModel}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartOverProfile}
                  className="driver-simulate-btn driver-profile-startover-btn"
                  title="Recommencer le formulaire d'onboarding complet"
                >
                  <RotateCcw size={16} />
                  <span>Recommencer / Compléter le profil</span>
                </button>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginBottom: 12 }}>
                  Coordonnées & Sécurité du compte
                </h4>
                <div className="driver-profile-grid-security">
                  <div style={{ backgroundColor: "#FFFFFF", padding: 18, borderRadius: 18, border: "1px solid rgba(11, 16, 32, 0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FFF2EB", color: "#FF5A00", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Mail size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Adresse e-mail</span>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#0B1020", marginTop: 2, wordBreak: "break-all" }}>{driverEmail}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="driver-btn-edit-sm"
                        style={{ flexShrink: 0 }}
                      >
                        <Edit3 size={14} />
                        <span>Modifier</span>
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={13} />
                      <span>Protégé par vérification par code OTP</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#FFFFFF", padding: 18, borderRadius: 18, border: "1px solid rgba(11, 16, 32, 0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F1F5F9", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Lock size={18} />
                        </div>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Mot de passe</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0B1020", marginTop: 2 }}>••••••••••••</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setIsPasswordModalOpen(true); setPasswordError(""); }}
                        className="driver-btn-edit-sm"
                        style={{ flexShrink: 0 }}
                      >
                        <KeyRound size={14} />
                        <span>Changer</span>
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      Modifié récemment • Recommandé tous les 90 jours
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginBottom: 12 }}>
                  Véhicule & Documents réglementaires
                </h4>
                <div className="driver-profile-grid-docs">
                  <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Deux-roues de service</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>{vehBrand} {vehModel} ({vehEngine})</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "#64748B", marginTop: 2 }}>Plaque : {vehPlate}</div>
                  </div>

                  <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Pièces d'identité & Permis</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>CNIE : {cinNumber}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Permis Cat. A/B : {licenseNumber}</div>
                  </div>

                  <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Secteur de distribution</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>Grand Agadir</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Talborjt • Founty • Marina • Dakhla</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

         
      </main>
      </div>



      {isMobileSidebarOpen && !isOrderActive && (
        <>
          <div
            className="driver-mobile-drawer-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="driver-mobile-drawer">
            <div>
              <div className="driver-drawer-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FF5A00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontStyle: "italic" }}>F</div>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF" }}>Foodi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="driver-drawer-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ backgroundColor: "#222632", borderRadius: 16, padding: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 9999, backgroundColor: "#FF5A00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>
                  {driverFirstName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#FFFFFF" }}>{driverFirstName} {driverLastName}</div>
                  <div style={{ fontSize: 11, color: "#10B981", fontWeight: 800 }}>Coursier Vérifié • 4.95 ★</div>
                </div>
              </div>

              <nav className="driver-sidebar-menu">
                <button
                  type="button"
                  disabled={isOrderActive}
                  onClick={() => {
                    if (isOrderActive) return;
                    setActiveTab("home");
                    setIsMobileSidebarOpen(false);
                    if (driverState === "delivered") setDriverState("online_searching");
                  }}
                  className={`driver-sidebar-link ${activeTab === "home" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
                >
                  <Bike size={18} />
                  <span>{isOrderActive ? "Course en cours" : driverState === "online_searching" ? "En attente d'une commande" : "Accueil"}</span>
                </button>

                <button
                  type="button"
                  disabled={isOrderActive}
                  onClick={() => {
                    if (isOrderActive) return;
                    setActiveTab("deliveries");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`driver-sidebar-link ${activeTab === "deliveries" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
                >
                  <PackageCheck size={18} />
                  <span>Mes livraisons</span>
                </button>

                <button
                  type="button"
                  disabled={isOrderActive}
                  onClick={() => {
                    if (isOrderActive) return;
                    setActiveTab("profile");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`driver-sidebar-link ${activeTab === "profile" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
                >
                  <User size={18} />
                  <span>Mon profil</span>
                </button>

                

             
              </nav>
            </div>

            <div className="driver-sidebar-bottom">
              <div className="driver-sidebar-online-card">
                <div className="driver-sidebar-online-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`driver-status-dot ${isOrderActive || driverState !== "offline" ? "online" : "offline"}`} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: driverState !== "offline" ? "#FFFFFF" : "#94A3B8" }}>
                      {isOrderActive ? "Course active" : driverState !== "offline" ? "En ligne" : "Hors ligne"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isOrderActive}
                    onClick={() => {
                      if (isOrderActive) return;
                      if (driverState === "offline") {
                        handleGoOnline();
                      } else {
                        handleGoOffline();
                      }
                    }}
                    className={`driver-switch-toggle ${driverState !== "offline" ? "active" : ""} ${isOrderActive ? "locked" : ""}`}
                  >
                    <span className="driver-switch-handle" />
                  </button>
                </div>
                <span style={{ fontSize: 11, color: isOrderActive ? "#FF7A1A" : "#94A3B8" }}>
                  {isOrderActive ? "Verrouillé : course en cours" : driverState !== "offline" ? "Vous recevez les commandes" : "Vous êtes hors ligne"}
                </span>
              </div>

              <button
                type="button"
                disabled={isOrderActive}
                onClick={() => {
                  if (isOrderActive) return;
                  setIsMobileSidebarOpen(false);
                  navigate("/login");
                }}
                className={`driver-sidebar-logout-btn ${isOrderActive ? "locked" : ""}`}
              >
                <LogOut size={16} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </>
      )}



      {driverState === "offer_received" && incomingOffers.length > 0 && (
        <div className="driver-alerts-overlay">
          <div className="driver-alerts-stack">
            <div className="driver-alerts-stack-header">
              <div className="driver-alerts-stack-badge">
                <span className="driver-pulse-dot" />
                <span>
                  {incomingOffers.length} {incomingOffers.length > 1 ? "nouvelles courses disponibles" : "nouvelle course disponible"}
                </span>
              </div>
            </div>

            {incomingOffers.map((offer) => (
              <div key={offer.id} className="driver-alert-wide-card">
                <div className="driver-offer-timer-bar">
                  <div
                    className="driver-offer-timer-fill"
                    style={{ width: `${(offer.remainingSeconds / 15) * 100}%` }}
                  />
                </div>

                <div className="driver-alert-wide-body">
                  <div className="driver-alert-desktop-content">
                    <div className="driver-offer-sparkle-bell">
                      <Bell size={24} />
                      <Sparkles size={14} style={{ position: "absolute", top: -4, right: -4, color: "#FF5A00" }} />
                    </div>

                    <div className="driver-alert-info-block">
                      <div className="driver-alert-title-row">
                        <span className="driver-offer-main-title">Nouvelle commande !</span>
                        <span className="driver-chip-sep" style={{ color: "#94A3B8" }}>•</span>
                        <span className="driver-offer-restaurant-sub">Restaurant : {offer.restaurantName}</span>
                      </div>

                      <div className="driver-offer-meta-chips">
                        <span className="driver-chip-item">
                          <MapPin size={13} color="#FF5A00" />
                          <span>2.8 km</span>
                        </span>
                        <span className="driver-chip-sep">|</span>
                        <span className="driver-chip-item">
                          <Clock size={13} color="#FF5A00" />
                          <span>≈ 12 min</span>
                        </span>
                        <span className="driver-chip-sep">|</span>
                        <span className="driver-chip-item">
                          <Navigation size={13} color="#64748B" />
                          <span>Vers {offer.neighborhood}</span>
                        </span>
                        <span className="driver-chip-sep">|</span>
                        <span className="driver-price-tag-green">
                          +{offer.deliveryFee || 25}.00 MAD garantis
                        </span>
                      </div>
                    </div>

                    <img
                      src={offer.mealImage || offer.restaurantLogo || "/images/meals/1791902884_mcdo2.png"}
                      alt={offer.restaurantName}
                      className="driver-alert-meal-thumb"
                    />

                    <div className="driver-alert-actions-block">
                      <span className="driver-alert-countdown-chip">
                        <Clock size={13} />
                        <span>{offer.remainingSeconds}s</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeclineSingleOffer(offer.id)}
                        className="driver-btn-refuse-v2"
                      >
                        Refuser
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptSingleOffer(offer)}
                        className="driver-btn-accept-v2"
                      >
                        <span>Accepter</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="driver-alert-phone-content">
                    <div className="driver-alert-phone-top">
                      <img
                        src={offer.restaurantLogo || "/images/restaurants/McDonalds.png"}
                        alt={offer.restaurantName}
                        className="driver-alert-phone-logo"
                      />
                      <div className="driver-alert-phone-info">
                        <div className="driver-alert-phone-name-row">
                          <h4 className="driver-alert-phone-name">{offer.restaurantName}</h4>
                          <span className="driver-alert-phone-price">
                            {offer.deliveryFee || 25} DH
                          </span>
                        </div>

                        <div className="driver-alert-phone-meta">
                          <span className="driver-alert-phone-meta-item">
                            <MapPin size={12} color="#FF5A00" />
                            <span>1.8 km</span>
                          </span>
                          <span className="driver-chip-sep">•</span>
                          <span className="driver-alert-phone-meta-item">
                            <Clock size={12} color="#FF5A00" />
                            <span>≈ 6 min</span>
                          </span>
                          <span className="driver-chip-sep">•</span>
                          <span className="driver-alert-phone-meta-item">
                            <Building2 size={12} color="#64748B" />
                            <span>{offer.shopNeighborhood || "Talborjt"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="driver-alert-phone-actions">
                      <span className="driver-alert-countdown-chip">
                        <Clock size={12} />
                        <span>{offer.remainingSeconds}s</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeclineSingleOffer(offer.id)}
                        className="driver-btn-refuse-v2"
                      >
                        Refuser
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptSingleOffer(offer)}
                        className="driver-btn-accept-v2"
                      >
                        <span>Accepter</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOrderDetailsOpen && activeOrder && (
        <div className="driver-modal-overlay">
          <div className="driver-order-details-card" style={{ maxWidth: 480 }}>
            <div className="driver-order-details-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="driver-order-id-badge">#{activeOrder.id}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "3px 8px", borderRadius: 9999 }}>
                  En cours
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderDetailsOpen(false)}
                className="driver-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div className="driver-modal-tabs">
              <button
                type="button"
                onClick={() => setOrderDetailsTab("order")}
                className={`driver-modal-tab-btn ${orderDetailsTab === "order" ? "active" : ""}`}
              >
                <FileText size={15} />
                <span>Détails commande</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderDetailsTab("customer")}
                className={`driver-modal-tab-btn ${orderDetailsTab === "customer" ? "active" : ""}`}
              >
                <User size={15} />
                <span>Détails client</span>
              </button>
            </div>

            {orderDetailsTab === "order" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img
                    src={activeOrder.restaurantLogo || "/images/restaurants/McDonalds.png"}
                    alt={activeOrder.restaurantName}
                    style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", border: "1px solid rgba(11, 16, 32, 0.08)", padding: 2, backgroundColor: "#FFFFFF" }}
                  />
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 900, color: "#0B1020" }}>{activeOrder.restaurantName}</h4>
                    <p style={{ fontSize: 11, color: "#7A8194" }}>Statut : Prête pour le retrait au comptoir</p>
                  </div>
                </div>

                <div className="driver-qr-container">
                  <div className="driver-qr-box">
                    <svg width="110" height="110" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="#FFFFFF" />
                      <rect x="10" y="10" width="25" height="25" fill="#0B1020" />
                      <rect x="15" y="15" width="15" height="15" fill="#FFFFFF" />
                      <rect x="18" y="18" width="9" height="9" fill="#0B1020" />
                      <rect x="65" y="10" width="25" height="25" fill="#0B1020" />
                      <rect x="70" y="15" width="15" height="15" fill="#FFFFFF" />
                      <rect x="73" y="18" width="9" height="9" fill="#0B1020" />
                      <rect x="10" y="65" width="25" height="25" fill="#0B1020" />
                      <rect x="15" y="70" width="15" height="15" fill="#FFFFFF" />
                      <rect x="18" y="73" width="9" height="9" fill="#0B1020" />
                      <rect x="45" y="12" width="10" height="10" fill="#0B1020" />
                      <rect x="42" y="35" width="16" height="10" fill="#0B1020" />
                      <rect x="65" y="45" width="25" height="12" fill="#0B1020" />
                      <rect x="45" y="65" width="15" height="25" fill="#0B1020" />
                      <rect x="70" y="70" width="20" height="20" fill="#0B1020" />
                    </svg>
                  </div>
                  <span className="driver-qr-text">
                    Code de retrait : <strong>{activeOrder.id.slice(-4) || "4921"}</strong>
                  </span>
                </div>

                <div style={{ backgroundColor: "#FAF8F5", padding: 14, borderRadius: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#7A8194" }}>
                    Articles commandés ({activeOrder.items?.length || 2})
                  </span>
                  {activeOrder.items?.map((it, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#0B1020" }}>
                      <span>{it.quantity}x {it.name}</span>
                      <span style={{ fontWeight: 900 }}>{it.price} MAD</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#ECFDF5", borderRadius: 14, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>Rémunération coursier</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#047857" }}>25.00 MAD</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
                <div className="driver-customer-card">
                  <div className="driver-customer-header-row">
                    <div className="driver-customer-info-left">
                      <div className="driver-customer-avatar">
                        {(activeOrder.customerName || "Youssef Bennani").slice(0, 1)}
                      </div>
                      <div>
                        <div className="driver-customer-name">{activeOrder.customerName || "Youssef Bennani"}</div>
                        <div className="driver-customer-phone">{activeOrder.customerPhone || "+212 6 71 82 93 04"}</div>
                      </div>
                    </div>

                    <a
                      href={`tel:${activeOrder.customerPhone || "+212671829304"}`}
                      className="driver-btn-call"
                    >
                      <PhoneCall size={16} />
                      <span>Appeler</span>
                    </a>
                  </div>
                </div>

                <div className="driver-customer-addr-card">
                  <span className="driver-customer-addr-title">
                    <MapPin size={14} color="#FF5A00" />
                    <span>Adresse de livraison client</span>
                  </span>
                  <div className="driver-customer-addr-text">
                    {activeOrder.street || "Avenue Hassan II"}, {activeOrder.buildingNameNumber || "Résidence Najah, Bât B"}
                  </div>
                  <div className="driver-customer-addr-sub">
                    {activeOrder.neighborhood || "Talborjt, Agadir"} • {activeOrder.floorNumber || "2ème étage"} • {activeOrder.doorNumber || "Appt 8"}
                  </div>
                </div>

                {activeOrder.instructions && (
                  <div className="driver-customer-instructions-box">
                    <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Consigne client : {activeOrder.instructions}</span>
                  </div>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.lat || 30.4278},${activeOrder.lng || -9.5981}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(11, 16, 32, 0.12)",
                    borderRadius: 14,
                    padding: "10px 16px",
                    color: "#0B1020",
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)"
                  }}
                >
                  <Navigation size={16} color="#FF5A00" />
                  <span>Itinéraire direct vers le client</span>
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsOrderDetailsOpen(false)}
              style={{
                width: "100%",
                backgroundColor: "#0B1020",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 800,
                padding: 12,
                borderRadius: 14,
                cursor: "pointer",
                marginTop: 8
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="driver-modal-overlay">
          <div className="driver-order-details-card" style={{ maxWidth: 440 }}>
            <div className="driver-order-details-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={18} color="#FF5A00" />
                <span className="driver-order-id-badge">Modifier le mot de passe</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="driver-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 6 }}>
                  Mot de passe actuel
                </label>
                <div className="driver-input-wrap">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="driver-input-box"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="driver-input-toggle-btn"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 6 }}>
                  Nouveau mot de passe
                </label>
                <div className="driver-input-wrap">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="driver-input-box"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="driver-input-toggle-btn"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#0B1020", display: "block", marginBottom: 6 }}>
                  Confirmer le nouveau mot de passe
                </label>
                <div className="driver-input-wrap">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le nouveau mot de passe"
                    className="driver-input-box"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="driver-input-toggle-btn"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div style={{ color: "#DC2626", fontSize: 12, fontWeight: 700, backgroundColor: "#FEF2F2", padding: "8px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={14} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    border: "none",
                    padding: 12,
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    backgroundColor: "#FF5A00",
                    color: "#FFFFFF",
                    border: "none",
                    padding: 12,
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(255, 90, 0, 0.3)"
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EmailChangeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={driverEmail}
        onSuccess={(newEmail) => {
          setDriverEmail(newEmail);
          setIsEmailModalOpen(false);
          setEmailSuccessToast(`Votre adresse e-mail a été mise à jour avec succès : ${newEmail}`);
          playChime();
          setTimeout(() => setEmailSuccessToast(""), 5000);
        }}
      />

      {isAccepting && (
        <div className="driver-modal-overlay">
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: 28, padding: 32, maxWidth: 360, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: "#FFF2EB", color: "#FF5A00", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bike size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#0B1020" }}>Course acceptée !</h3>
              <p style={{ fontSize: 12, color: "#7A8194", marginTop: 4 }}>
                Calcul du meilleur itinéraire routier vers {activeOrder?.restaurantName}...
              </p>
            </div>
            <div style={{ width: "100%", height: 4, backgroundColor: "rgba(255, 90, 0, 0.15)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", backgroundColor: "#FF5A00" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;
