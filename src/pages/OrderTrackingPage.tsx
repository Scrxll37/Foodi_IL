import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Clock,
  MapPin,
  ChefHat,
  Bike,
  CheckCircle2,
  Phone,
  MessageSquare,
  ShieldAlert,
  Copy,
  Check,
  Navigation,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  Home,
  ArrowRight
} from "lucide-react";
import ordersData from "../data/orders.json";
import { OrderRecord, OrderStatus } from "../types";
import {
  fetchRoadRoute,
  buildRouteGeometry,
  getPositionAtDistance,
  RouteGeometry,
  LatLng
} from "../utils/routing";

interface StepConfig {
  number: number;
  label: string;
  shortLabel: string;
}

const STEPS: StepConfig[] = [
  { number: 1, label: "Commande envoyée", shortLabel: "Envoyée" },
  { number: 2, label: "En attente de confirmation", shortLabel: "Attente" },
  { number: 3, label: "Restaurant prépare votre commande", shortLabel: "Cuisine" },
  { number: 4, label: "Recherche d'un livreur", shortLabel: "Livreur" },
  { number: 5, label: "Livreur en route vers le restaurant", shortLabel: "Prise en charge" },
  { number: 6, label: "Commande en livraison", shortLabel: "En route" },
  { number: 7, label: "Commande livrée", shortLabel: "Livrée" }
];

export const OrderTrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const [courierPos, setCourierPos] = useState<LatLng | null>(null);
  const [courierBearing, setCourierBearing] = useState<number>(0);
  const [courierAssigned, setCourierAssigned] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const routeToShopRef = useRef<RouteGeometry | null>(null);
  const routeToUserRef = useRef<RouteGeometry | null>(null);

  const currentDistanceRef = useRef<number>(0);
  const targetDistanceRef = useRef<number>(0);
  const animStartDistRef = useRef<number>(0);
  const animStartTimeRef = useRef<number>(Date.now());
  const animDurationRef = useRef<number>(8000);
  const animationFrameRef = useRef<number | null>(null);

  const METERS_PER_TICK = 95;

  const currentStepNumber = useMemo<number>(() => {
    if (!order) return 1;
    switch (order.status) {
      case "pending_confirmation":
        return 2;
      case "accepted":
      case "preparing":
      case "in_prep":
        return 3;
      case "searching_driver":
        return 4;
      case "heading_to_restaurant":
        return 5;
      case "in_delivery":
        return 6;
      case "delivered":
        return 7;
      default:
        return 2;
    }
  }, [order]);

  const loadOrder = useCallback(async () => {
    if (!token) {
      setIsValidToken(false);
      setLoading(false);
      return;
    }

    let allOrders: OrderRecord[] = [];

    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        allOrders = await res.json();
        setNetworkError(false);
      }
    } catch {
      setNetworkError(true);
    }

    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        const localList: OrderRecord[] = JSON.parse(raw);
        allOrders = [...localList, ...allOrders.filter((o) => !localList.some((l) => l.id === o.id))];
      }
    } catch {}

    if (allOrders.length === 0) {
      allOrders = ordersData as OrderRecord[];
    }

    const found = allOrders.find((o) => o.token === token || o.id === token);

    if (found) {
      setOrder(found);
      setIsValidToken(true);
      const isAssigned =
        found.status === "heading_to_restaurant" ||
        found.status === "in_delivery" ||
        found.status === "delivered";
      setCourierAssigned(isAssigned);
    } else {
      setOrder(null);
      setIsValidToken(false);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadOrder();
    const pollInterval = setInterval(() => {
      loadOrder();
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [loadOrder]);

  const handleUpdateStatus = async (newStatus: OrderStatus, customLabel?: string) => {
    if (!order) return;

    const label =
      customLabel ||
      (newStatus === "pending_confirmation"
        ? "Commande reçue, en attente du restaurant"
        : newStatus === "preparing"
        ? "En préparation en cuisine"
        : newStatus === "searching_driver"
        ? "Recherche d'un coursier disponible"
        : newStatus === "heading_to_restaurant"
        ? "Coursier assigné, en route vers le restaurant"
        : newStatus === "in_delivery"
        ? "En cours de livraison chez vous"
        : newStatus === "delivered"
        ? "Commande livrée avec succès"
        : newStatus === "cancelled"
        ? "Commande annulée"
        : "Commande refusée par le restaurant");

    const patch: Partial<OrderRecord> = {
      status: newStatus,
      statusLabel: label,
      token: order.token,
      id: order.id
    };

    setOrder((prev) => (prev ? ({ ...prev, ...patch } as OrderRecord) : null));

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
        const list: OrderRecord[] = JSON.parse(raw);
        const updated = list.map((o) =>
          o.id === order.id || o.token === order.token ? { ...o, ...patch } : o
        );
        localStorage.setItem("foodi_orders", JSON.stringify(updated));
      }
    } catch {}
  };

  const coords = useMemo(() => {
    if (!order) return null;
    const destLat = order.lat || 30.4278;
    const destLng = order.lng || -9.5981;
    const shopLat = order.shopLat || 30.4215;
    const shopLng = order.shopLng || -9.5890;

    const startLat = shopLat - 0.0055;
    const startLng = shopLng + 0.0045;

    return {
      start: [startLat, startLng] as LatLng,
      shop: [shopLat, shopLng] as LatLng,
      dest: [destLat, destLng] as LatLng
    };
  }, [order]);

  useEffect(() => {
    if (!coords) return;

    let isMounted = true;

    async function loadRoutes() {
      if (!coords) return;
      const leg1Points = await fetchRoadRoute(coords.start, coords.shop);
      const leg2Points = await fetchRoadRoute(coords.shop, coords.dest);

      if (!isMounted) return;

      routeToShopRef.current = buildRouteGeometry(leg1Points);
      routeToUserRef.current = buildRouteGeometry(leg2Points);

      const initialPos = coords.start;
      setCourierPos(initialPos);
    }

    loadRoutes();

    return () => {
      isMounted = false;
    };
  }, [coords]);

  const updateMapRouteView = useCallback(
    (status: OrderStatus, currentDist: number) => {
      if (!mapInstanceRef.current || !routePolylineRef.current) return;

      const r1 = routeToShopRef.current;
      const r2 = routeToUserRef.current;
      if (!r1 || !r2) return;

      let upcomingPoints: LatLng[] = [];

      if (status === "heading_to_restaurant") {
        const sample = getPositionAtDistance(r1, currentDist);
        const remainingLeg1 = r1.points.slice(sample.segmentIndex + 1);
        upcomingPoints = [sample.position, ...remainingLeg1, ...r2.points];
      } else if (status === "in_delivery") {
        const sample = getPositionAtDistance(r2, currentDist);
        const remainingLeg2 = r2.points.slice(sample.segmentIndex + 1);
        upcomingPoints = [sample.position, ...remainingLeg2];
      } else if (status === "delivered") {
        upcomingPoints = [];
      } else {
        upcomingPoints = [...r2.points];
      }

      routePolylineRef.current.setLatLngs(upcomingPoints);
    },
    []
  );

  useEffect(() => {
    if (!order) return;
    if (order.status !== "heading_to_restaurant" && order.status !== "in_delivery") return;

    const interval = setInterval(() => {
      const now = Date.now();

      if (order.status === "heading_to_restaurant") {
        const r1 = routeToShopRef.current;
        if (!r1) return;

        const nextDist = Math.min(r1.totalDistance, currentDistanceRef.current + METERS_PER_TICK);
        animStartDistRef.current = currentDistanceRef.current;
        targetDistanceRef.current = nextDist;
        animStartTimeRef.current = now;

        if (nextDist >= r1.totalDistance - 5) {
          handleUpdateStatus("in_delivery", "Commande récupérée, en route vers votre adresse");
          currentDistanceRef.current = 0;
          targetDistanceRef.current = 0;
        }
      } else if (order.status === "in_delivery") {
        const r2 = routeToUserRef.current;
        if (!r2) return;

        const nextDist = Math.min(r2.totalDistance, currentDistanceRef.current + METERS_PER_TICK);
        animStartDistRef.current = currentDistanceRef.current;
        targetDistanceRef.current = nextDist;
        animStartTimeRef.current = now;

        if (nextDist >= r2.totalDistance - 10) {
          handleUpdateStatus("delivered", "Commande livrée à votre porte. Bon appétit !");
        }
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [order]);

  useEffect(() => {
    if (!order) return;

    function animateMovement() {
      if (!order) return;
      const now = Date.now();
      const elapsed = now - animStartTimeRef.current;
      const progress = Math.min(1, elapsed / animDurationRef.current);

      const interpolatedDist =
        animStartDistRef.current +
        (targetDistanceRef.current - animStartDistRef.current) * progress;

      currentDistanceRef.current = interpolatedDist;

      if (order.status === "heading_to_restaurant" && routeToShopRef.current) {
        const sample = getPositionAtDistance(routeToShopRef.current, interpolatedDist);
        setCourierPos(sample.position);
        setCourierBearing(sample.bearing);
        if (courierMarkerRef.current) {
          courierMarkerRef.current.setLatLng(sample.position);
        }
        updateMapRouteView("heading_to_restaurant", interpolatedDist);
      } else if (order.status === "in_delivery" && routeToUserRef.current) {
        const sample = getPositionAtDistance(routeToUserRef.current, interpolatedDist);
        setCourierPos(sample.position);
        setCourierBearing(sample.bearing);
        if (courierMarkerRef.current) {
          courierMarkerRef.current.setLatLng(sample.position);
        }
        updateMapRouteView("in_delivery", interpolatedDist);
      } else if (order.status === "delivered" && coords) {
        setCourierPos(coords.dest);
        if (courierMarkerRef.current) {
          courierMarkerRef.current.setLatLng(coords.dest);
        }
        updateMapRouteView("delivered", 0);
      }

      animationFrameRef.current = requestAnimationFrame(animateMovement);
    }

    animationFrameRef.current = requestAnimationFrame(animateMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [order, coords, updateMapRouteView]);

  useEffect(() => {
    if (!coords || !mapContainerRef.current) return;
    if (order?.status === "delivered" || order?.status === "cancelled" || order?.status === "rejected") return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"]
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const restaurantPin = L.divIcon({
        className: "glovo-pin-wrapper",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-white border-2 border-[#0B1020] shadow-md flex items-center justify-center p-1.5 overflow-hidden">
              <img src="${order?.restaurantLogo || '/images/restaurants/McDonalds.png'}" class="w-full h-full object-contain" alt="Restaurant" />
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-[#0B1020] rotate-45"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const housePin = L.divIcon({
        className: "glovo-pin-wrapper",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-10 h-10 rounded-full bg-[#12A150] border-2 border-white shadow-md flex items-center justify-center text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-[#12A150] rotate-45"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const courierPin = L.divIcon({
        className: "glovo-courier-wrapper",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-12 h-12 rounded-full bg-[#FF5A00]/25 animate-ping"></div>
            <div id="foodi-live-courier-icon" class="w-11 h-11 rounded-full bg-[#FF5A00] border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform duration-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      L.marker(coords.shop, { icon: restaurantPin }).addTo(map);
      L.marker(coords.dest, { icon: housePin }).addTo(map);

      const marker = L.marker(coords.start, { icon: courierPin });
      if (courierAssigned) {
        marker.addTo(map);
      }
      courierMarkerRef.current = marker;

      const roadLine = L.polyline([], {
        color: "#FF5A00",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);
      routePolylineRef.current = roadLine;

      const bounds = L.latLngBounds([coords.start, coords.shop, coords.dest]);
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstanceRef.current = map;

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [coords, order, courierAssigned]);

  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;
    if (courierAssigned) {
      if (!mapInstanceRef.current.hasLayer(courierMarkerRef.current)) {
        courierMarkerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(courierMarkerRef.current)) {
        mapInstanceRef.current.removeLayer(courierMarkerRef.current);
      }
    }
  }, [courierAssigned]);

  useEffect(() => {
    const el = document.getElementById("foodi-live-courier-icon");
    if (el) {
      el.style.transform = `rotate(${courierBearing}deg)`;
    }
  }, [courierBearing]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (courierAssigned && courierPos) {
      mapInstanceRef.current.setView(courierPos, 16, { animate: true });
    } else if (coords) {
      const bounds = L.latLngBounds([coords.shop, coords.dest]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-3 border-[#FF5A00]/20 border-t-[#FF5A00] animate-spin" />
        <p className="text-xs font-black text-[#0B1020] tracking-wide">
          Chargement de votre commande en direct...
        </p>
      </div>
    );
  }

  if (!isValidToken || !order) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 text-center space-y-5 bg-white rounded-3xl border border-[#0B1020]/8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-[#0B1020]">
              Commande introuvable ou lien expiré
            </h1>
            <p className="text-xs text-[#7A8194] leading-relaxed">
              Le jeton de suivi sécurisé n'est pas reconnu ou la commande a été archivée.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/dashboard"
              className="foodi-btn-primary w-full py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer"
            >
              Consulter mes commandes
            </Link>
            <Link
              to="/restaurants"
              className="w-full py-3 px-6 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors"
            >
              Commander chez nos restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === "delivered") {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-between p-4 sm:p-8 animate-entrance-slide-up font-sans text-[#0B1020]">
        <header className="max-w-[1400px] w-full mx-auto flex items-center justify-between pb-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logohor.png"
              alt="Foodi"
              className="h-7 w-auto object-contain hidden sm:block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo.png";
              }}
            />
            <img
              src="/images/logo.png"
              alt="Foodi"
              className="h-7 w-7 object-contain sm:hidden"
            />
          </Link>
          <Link
            to="/"
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#0B1020]/10"
          >
            <Home className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Accueil</span>
          </Link>
        </header>

        <div className="w-full max-w-lg mx-auto my-auto p-6 sm:p-8 text-center space-y-6 bg-white rounded-3xl border border-[#0B1020]/8 shadow-sm">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <svg className="w-20 h-20 text-[#12A150]" viewBox="0 0 52 52">
              <circle
                className="animate-checkmark-circle"
                cx="26"
                cy="26"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="animate-checkmark-check"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l8 8 16-16"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#12A150] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
              Commande terminée
            </span>
            <h1 className="text-2xl font-black text-[#0B1020]">
              Cette commande a été livrée
            </h1>
            <p className="text-xs text-[#7A8194] leading-relaxed">
              Votre commande chez <strong className="text-[#0B1020]">{order.restaurantName}</strong> a été livrée avec succès. Le suivi en direct est terminé et n'est plus actif.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#0B1020]/6">
              <span className="text-[#7A8194]">Numéro de référence</span>
              <span className="font-mono font-black text-[#0B1020]">{order.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#0B1020]/6">
              <span className="text-[#7A8194]">Établissement</span>
              <span className="font-bold text-[#0B1020]">{order.restaurantName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#0B1020]/6">
              <span className="text-[#7A8194]">Date de commande</span>
              <span className="font-bold text-[#0B1020]">{order.date || "Récemment"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#0B1020]/6">
              <span className="text-[#7A8194]">Total réglé</span>
              <span className="font-black text-[#FF5A00]">{order.total} DH ({order.paymentLabel || "Payé"})</span>
            </div>
            <div className="flex justify-between items-start pt-0.5">
              <span className="text-[#7A8194]">Lieu de livraison</span>
              <span className="font-semibold text-[#0B1020] text-right max-w-[200px]">{order.neighborhood}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              to="/"
              className="foodi-btn-primary flex-1 py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Retour à l'accueil</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors text-center"
            >
              Mes commandes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === "cancelled" || order.status === "rejected") {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-between p-4 sm:p-8 animate-entrance-slide-up font-sans text-[#0B1020]">
        <header className="max-w-[1400px] w-full mx-auto flex items-center justify-between pb-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logohor.png"
              alt="Foodi"
              className="h-7 w-auto object-contain hidden sm:block"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo.png";
              }}
            />
            <img
              src="/images/logo.png"
              alt="Foodi"
              className="h-7 w-7 object-contain sm:hidden"
            />
          </Link>
          <Link
            to="/"
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#0B1020]/10"
          >
            <Home className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Accueil</span>
          </Link>
        </header>

        <div className="w-full max-w-lg mx-auto my-auto p-6 sm:p-8 text-center space-y-6 bg-white rounded-3xl border border-[#0B1020]/8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 inline-block">
              {order.status === "rejected" ? "Commande refusée" : "Commande annulée"}
            </span>
            <h1 className="text-2xl font-black text-[#0B1020]">
              Suivi en direct non disponible
            </h1>
            <p className="text-xs text-[#7A8194] leading-relaxed">
              {order.status === "rejected"
                ? `L'établissement ${order.restaurantName} n'a pas pu accepter votre commande. Le suivi en direct a été interrompu et le montant n'a pas été prélevé.`
                : "Cette commande a été annulée. Elle ne peut plus faire l'objet d'un suivi en direct."}
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#7A8194]">Numéro de référence</span>
              <span className="font-mono font-black text-[#0B1020]">{order.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#7A8194]">Établissement</span>
              <span className="font-bold text-[#0B1020]">{order.restaurantName}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link
              to="/restaurants"
              className="foodi-btn-primary flex-1 py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Commander ailleurs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col font-sans text-[#0B1020] animate-entrance-slide-up">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#0B1020]/8 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              aria-label="Retour"
              className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] flex items-center justify-center transition-colors cursor-pointer border border-[#0B1020]/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logohor.png"
                alt="Foodi"
                className="h-7 w-auto object-contain hidden sm:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo.png";
                }}
              />
              <img
                src="/images/logo.png"
                alt="Foodi"
                className="h-7 w-7 object-contain sm:hidden"
              />
            </Link>

            <div className="h-5 w-px bg-[#0B1020]/10 mx-1 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-[#0B1020]">
                  {order.id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-[#12A150] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A150] animate-ping" />
                  Direct
                </span>
              </div>
              <p className="text-[11px] text-[#7A8194] truncate max-w-[180px] sm:max-w-none">
                {order.restaurantName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="h-9 px-3 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#0B1020]/10"
              title="Retour à l'accueil"
            >
              <Home className="w-3.5 h-3.5 text-[#FF5A00]" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="h-9 px-3 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#0B1020]/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#12A150]" />
                  <span className="text-[#12A150]">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Partager</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {networkError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Synchronisation réseau ralentie. Nouvelle tentative automatique en cours...</span>
        </div>
      )}

      <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 flex-1 flex flex-col lg:flex-row gap-5 items-stretch">
        <div className="w-full lg:flex-1 h-[420px] sm:h-[520px] lg:h-auto min-h-[420px] rounded-3xl overflow-hidden bg-white border border-[#0B1020]/8 shadow-sm relative flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full z-0 flex-1" />

          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-[#0B1020]/8 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A00] animate-ping" />
            <span className="text-xs font-black text-[#0B1020]">
              {order.status === "pending_confirmation"
                ? "En attente du restaurant"
                : order.status === "preparing"
                ? "Préparation en cuisine"
                : order.status === "searching_driver"
                ? "Recherche d'un livreur"
                : order.status === "heading_to_restaurant"
                ? "Livreur en route vers restaurant"
                : "Livreur en route vers chez vous"}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2">
            <button
              onClick={handleRecenter}
              title="Centrer la carte"
              className="bg-white/95 hover:bg-white text-[#0B1020] px-3.5 py-2 rounded-2xl shadow-sm border border-[#0B1020]/8 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#FF5A00]" />
              <span>Centrer</span>
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[440px] xl:w-[470px] flex flex-col gap-4">
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-1.5 text-[#FF5A00] bg-[#FFF3EA]">
                  Arrivée estimée
                </span>

                <h2 className="text-2xl sm:text-3xl font-black text-[#0B1020] tracking-tight">
                  {order.arrivalTime ? `~${order.arrivalTime}` : `~${order.totalTime || 25} min`}
                </h2>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                {order.status === "preparing" ? (
                  <ChefHat className="w-7 h-7 text-[#FF5A00]" />
                ) : order.status === "searching_driver" ? (
                  <Search className="w-6 h-6 text-[#FF5A00]" />
                ) : (
                  <Bike className="w-7 h-7 text-[#FF5A00]" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#0B1020] leading-snug">
                {order.status === "pending_confirmation"
                  ? "Nous attendons la confirmation du restaurant"
                  : order.status === "preparing"
                  ? `${order.restaurantName} prépare votre commande`
                  : order.status === "searching_driver"
                  ? "Nous recherchons un livreur à proximité"
                  : order.status === "heading_to_restaurant"
                  ? `${order.courierName || "Le livreur"} se rend au restaurant`
                  : "Votre commande est en route !"}
              </h3>
              <p className="text-xs text-[#7A8194] leading-relaxed">
                {order.status === "pending_confirmation"
                  ? "Votre commande a bien été envoyée et transmise à l'établissement. Confirmation sous 1 à 2 min."
                  : order.status === "preparing"
                  ? "Les chefs cuisinent vos plats avec des ingrédients frais. Emballage soigné."
                  : order.status === "searching_driver"
                  ? "Attribution du coursier partenaire le plus proche pour une récupération immédiate."
                  : order.status === "heading_to_restaurant"
                  ? `Le coursier récupère votre paquet chez ${order.restaurantName}.`
                  : `Le livreur approche de votre adresse à ${order.neighborhood}. Préparez-vous à le recevoir.`}
              </p>
            </div>

            {order.status === "pending_confirmation" && (
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#0B1020]/6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 animate-pulse-gentle" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-[#0B1020] block">En attente de confirmation</span>
                  <span className="text-[#7A8194] text-[11px]">
                    Envoyée à {order.date?.split("à")[1] || "l'instant"} • Réf {order.id}
                  </span>
                </div>
              </div>
            )}

            {order.status === "preparing" && (
              <div className="bg-[#FFF3EA] p-3.5 rounded-2xl border border-[#FF5A00]/15 flex items-center gap-3.5">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute top-1 left-2.5 w-1 h-2.5 rounded-full bg-[#FF5A00] animate-steam-1" />
                  <div className="absolute top-0.5 left-4.5 w-1 h-3 rounded-full bg-[#FF5A00] animate-steam-2" />
                  <div className="absolute top-1 left-6.5 w-1 h-2.5 rounded-full bg-[#FF5A00] animate-steam-3" />
                  <div className="w-9 h-9 rounded-xl bg-white text-[#FF5A00] flex items-center justify-center shadow-xs">
                    <ChefHat className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#0B1020] block">Cuisine en action</span>
                  <span className="text-[#7A8194] text-[11px]">
                    Temps de préparation estimé : ~{order.cookingTime || 15} minutes
                  </span>
                </div>
              </div>
            )}

            {order.status === "searching_driver" && (
              <div className="bg-[#FFF3EA] p-3.5 rounded-2xl border border-[#FF5A00]/15 flex items-center gap-3.5">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-[#FF5A00]/25 animate-radar-1" />
                  <div className="absolute w-8 h-8 rounded-full bg-[#FF5A00]/25 animate-radar-2" />
                  <div className="w-9 h-9 rounded-xl bg-white text-[#FF5A00] flex items-center justify-center shadow-xs z-10">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-black text-[#0B1020] block">Recherche radar active</span>
                  <span className="text-[#7A8194] text-[11px]">
                    Détection des coursiers disponibles à proximité immédiate
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <div className="flex items-center justify-between text-center relative">
                <div className="absolute top-3.5 left-4 right-4 h-1 bg-[#0B1020]/5 -z-0">
                  <div
                    className="h-full bg-[#FF5A00] transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((currentStepNumber - 1) / 6) * 100))}%`
                    }}
                  />
                </div>

                {STEPS.map((step) => {
                  const isPassed = currentStepNumber > step.number;
                  const isCurrent = currentStepNumber === step.number;

                  return (
                    <div key={step.number} className="z-10 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shadow-xs ${
                          isCurrent
                            ? "bg-[#FF5A00] text-white ring-4 ring-[#FF5A00]/20 scale-105"
                            : isPassed
                            ? "bg-[#FF5A00] text-white"
                            : "bg-[#0B1020]/10 text-[#0B1020]/40"
                        }`}
                      >
                        {isPassed ? "✓" : step.number}
                      </div>
                      <span
                        className={`text-[10px] hidden sm:block ${
                          isCurrent
                            ? "font-black text-[#0B1020]"
                            : isPassed
                            ? "font-bold text-[#0B1020]/80"
                            : "font-semibold text-[#7A8194]"
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {courierAssigned && (
            <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1020]/8 shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#FF5A00] text-white flex items-center justify-center font-black text-lg shadow-xs">
                    <Bike className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#12A150] border-2 border-white" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-[#0B1020]">
                    {order.courierName || "Amine Tazi"}
                  </h4>
                  <p className="text-xs text-[#7A8194]">
                    Coursier Foodi • Scooter
                  </p>
                  <span className="text-[10px] font-extrabold text-[#FF5A00] bg-[#FFF3EA] px-2 py-0.5 rounded-md inline-block mt-1">
                    ★ 4.9 (420+ courses)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${order.courierPhone || "+212662102030"}`}
                  className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#FF5A00] hover:text-white text-[#0B1020] flex items-center justify-center transition-colors cursor-pointer border border-[#0B1020]/10"
                  title="Appeler le coursier"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`sms:${order.courierPhone || "+212662102030"}`}
                  className="w-10 h-10 rounded-full bg-[#FAF8F5] hover:bg-[#FF5A00] hover:text-white text-[#0B1020] flex items-center justify-center transition-colors cursor-pointer border border-[#0B1020]/10"
                  title="Envoyer un SMS"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </section>
          )}

          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1020]/8 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0B1020]">
              <MapPin className="w-4 h-4 text-[#FF5A00]" />
              <span>Adresse de livraison</span>
            </div>
            <p className="text-sm font-black text-[#0B1020]">
              {order.neighborhood}
              {order.buildingNameNumber ? `, ${order.buildingNameNumber}` : ""}
              {order.floorNumber ? `, Étage ${order.floorNumber}` : ""}
              {order.doorNumber ? `, Porte ${order.doorNumber}` : ""}
            </p>
            {order.street && (
              <p className="text-xs text-[#7A8194] leading-relaxed">
                {order.street}
              </p>
            )}
            {order.instructions && (
              <div className="text-[11px] text-[#7A8194] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#0B1020]/6 mt-1">
                <span className="font-bold text-[#0B1020]">Consigne : </span>
                {order.instructions}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl p-4 sm:p-5 border border-[#0B1020]/8 shadow-xs space-y-3">
            <button
              onClick={() => setShowReceiptDetails(!showReceiptDetails)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#0B1020]/10 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={order.restaurantLogo}
                    alt={order.restaurantName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#0B1020]">
                    {order.restaurantName}
                  </h4>
                  <p className="text-[10px] text-[#7A8194]">
                    {order.items.length} article(s) • Total : {order.total} DH
                  </p>
                </div>
              </div>
              {showReceiptDetails ? (
                <ChevronUp className="w-4 h-4 text-[#7A8194]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7A8194]" />
              )}
            </button>

            {showReceiptDetails && (
              <div className="pt-2 border-t border-[#0B1020]/6 space-y-2 text-xs divide-y divide-[#0B1020]/6">
                {order.items.map((it, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex justify-between gap-2">
                    <span className="text-[#0B1020]">
                      <strong>{it.quantity}x</strong> {it.name}
                      {it.options && (
                        <span className="block text-[10px] text-[#7A8194]">
                          {it.options}
                        </span>
                      )}
                    </span>
                    <span className="font-black text-[#0B1020] shrink-0">
                      {it.price * it.quantity} DH
                    </span>
                  </div>
                ))}
                <div className="pt-2 flex justify-between text-xs font-bold text-[#7A8194]">
                  <span>Frais de livraison</span>
                  <span>{order.deliveryFee === 0 ? "Gratuit" : `${order.deliveryFee} DH`}</span>
                </div>
                <div className="pt-2 flex justify-between text-sm font-black text-[#0B1020]">
                  <span>Total</span>
                  <span className="text-[#FF5A00]">
                    {order.total} DH ({order.paymentLabel || "Espèces"})
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default OrderTrackingPage;
