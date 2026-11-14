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
import "../styles/restaurant.css";
import { OrderRecord, OrderStatus } from "../types";
import { useApp } from "../context/AppContext";
import { HomeHeader } from "../components/HomeHeader";
import { trackOrder, updateOrderStatus } from "../services/api";
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
  const { user } = useApp();

  const truncateText = (text?: string, max: number = 10) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const [courierPos, setCourierPos] = useState<LatLng | null>(null);
  const [courierBearing, setCourierBearing] = useState<number>(0);
  const [courierAssigned, setCourierAssigned] = useState<boolean>(false);
  const [dispatchText, setDispatchText] = useState("");
  const dispatchAttemptRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());

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

    // 1. Fetch live order tracking directly by token from Laravel MySQL
    try {
      const serverOrder = await trackOrder(token);
      if (serverOrder && (serverOrder.token === token || serverOrder.id === token)) {
        setOrder(serverOrder);
        setIsValidToken(true);
        const isAssigned =
          serverOrder.status === "heading_to_restaurant" ||
          serverOrder.status === "in_delivery" ||
          serverOrder.status === "delivered";
        setCourierAssigned(isAssigned);
        setLoading(false);
        setNetworkError(false);
        return;
      }
    } catch {
      setNetworkError(true);
    }

    // 2. Fallback to localStorage orders cache
    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        const localList: OrderRecord[] = JSON.parse(raw);
        const found = localList.find((o) => o.token === token || o.id === token);
        if (found) {
          setOrder(found);
          setIsValidToken(true);
          const isAssigned =
            found.status === "heading_to_restaurant" ||
            found.status === "in_delivery" ||
            found.status === "delivered";
          setCourierAssigned(isAssigned);
          setLoading(false);
          return;
        }
      }
    } catch {}

    setOrder(null);
    setIsValidToken(false);

    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadOrder();
    const pollInterval = setInterval(() => {
      loadOrder();
    }, 4000);

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
      await updateOrderStatus({
        token: order.token,
        id: order.id,
        status: newStatus,
        notes: label,
      });
    } catch (e) {
      console.warn("Could not sync status to server:", e);
    }

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

    const startLat = order.courierLat || (shopLat - 0.0055);
    const startLng = order.courierLng || (shopLng + 0.0045);

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
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "foodi_orders") {
        try {
          const raw = localStorage.getItem("foodi_orders");
          if (raw) {
            const list = JSON.parse(raw);
            const found = list.find((o: any) => o.id === order?.id || (token && o.token === token));
            if (found) {
              setOrder(found);
              if (found.courierName && found.status !== "searching_driver") {
                setCourierAssigned(true);
              }
            }
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [order?.id, token]);

  useEffect(() => {
    if (!order) return;
    if (courierAssigned || (order.courierName && order.status !== "searching_driver")) return;
    if (order.status === "delivered" || order.status === "cancelled" || order.status === "rejected") return;

    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("foodi_orders");
        if (!raw) return;
        const list = JSON.parse(raw);
        const currentInStorage = list.find((o: any) => o.id === order.id || o.token === order.token);
        if (!currentInStorage) return;

        if (currentInStorage.courierName && currentInStorage.status !== "searching_driver") {
          setOrder((prev) => (prev ? ({ ...prev, ...currentInStorage } as OrderRecord) : null));
          setCourierAssigned(true);
          setDispatchText(`${currentInStorage.courierName} a accepté la livraison !`);
          clearInterval(interval);
          return;
        }

        const rawCouriers = localStorage.getItem("foodi_admin_couriers_v2");
        const allCouriers = rawCouriers ? JSON.parse(rawCouriers) : [];
        const onlineCouriers = Array.isArray(allCouriers)
          ? allCouriers.filter((d: any) => d.status === "active" && Boolean(d.isOnline))
          : [];

        const declinedIds: string[] = Array.isArray(currentInStorage.declinedCourierIds)
          ? currentInStorage.declinedCourierIds
          : [];

        const availableOnline = onlineCouriers.filter((d: any) => !declinedIds.includes(d.id));

        if (availableOnline.length === 0) {
          setDispatchText("Recherche radar active à Agadir...");
          return;
        }

        const shopLat = coords?.shop[0] || order.shopLat || 30.4215;
        const shopLng = coords?.shop[1] || order.shopLng || -9.589;

        const sorted = [...availableOnline].sort((a: any, b: any) => {
          const dA = (a.lat - shopLat) ** 2 + (a.lng - shopLng) ** 2;
          const dB = (b.lat - shopLat) ** 2 + (b.lng - shopLng) ** 2;
          return dA - dB;
        });

        const targetId = currentInStorage.targetCourierId;
        const offerAge = currentInStorage.offerCreatedAt ? Date.now() - currentInStorage.offerCreatedAt : 0;

        if (targetId && offerAge > 25000) {
          const updatedDeclined = [...declinedIds, targetId];
          const remaining = sorted.filter((d: any) => d.id !== targetId);
          const nextTarget = remaining[0];

          const patch = {
            declinedCourierIds: updatedDeclined,
            targetCourierId: nextTarget ? nextTarget.id : undefined,
            targetCourierName: nextTarget ? nextTarget.fullName : undefined,
            offerCreatedAt: nextTarget ? Date.now() : undefined
          };

          const updatedList = list.map((o: any) =>
            o.id === order.id || o.token === order.token ? { ...o, ...patch } : o
          );
          localStorage.setItem("foodi_orders", JSON.stringify(updatedList));
          window.dispatchEvent(new Event("storage"));

          if (nextTarget) {
            setDispatchText(`Demande transmise à ${nextTarget.fullName}...`);
          } else {
            setDispatchText("Recherche radar active à Agadir...");
          }
          return;
        }

        if (!targetId && sorted.length > 0) {
          const firstTarget = sorted[0];
          const patch = {
            targetCourierId: firstTarget.id,
            targetCourierName: firstTarget.fullName,
            offerCreatedAt: Date.now()
          };

          const updatedList = list.map((o: any) =>
            o.id === order.id || o.token === order.token ? { ...o, ...patch } : o
          );
          localStorage.setItem("foodi_orders", JSON.stringify(updatedList));
          window.dispatchEvent(new Event("storage"));
          setDispatchText(`Demande transmise à ${firstTarget.fullName}...`);
        } else if (targetId) {
          setDispatchText(`Demande transmise à ${currentInStorage.targetCourierName || "un coursier"}...`);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [order, coords, courierAssigned]);

  useEffect(() => {
    if (!order) return;
    if (order.status !== "heading_to_restaurant" && order.status !== "in_delivery") return;

    lastFrameTimeRef.current = performance.now();

    function animateMovement(now: number) {
      if (!order) return;

      const deltaSeconds = Math.min(0.1, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      if (order.status === "heading_to_restaurant") {
        const r1 = routeToShopRef.current;
        if (r1 && r1.totalDistance > 0) {
          currentDistanceRef.current += 32 * deltaSeconds;

          if (currentDistanceRef.current >= r1.totalDistance - 5) {
            currentDistanceRef.current = 0;
            handleUpdateStatus("in_delivery", "Commande récupérée, en route vers votre adresse");
          } else {
            const sample = getPositionAtDistance(r1, currentDistanceRef.current);
            setCourierPos(sample.position);
            setCourierBearing(sample.bearing);
            if (courierMarkerRef.current) {
              courierMarkerRef.current.setLatLng(sample.position);
            }
            updateMapRouteView("heading_to_restaurant", currentDistanceRef.current);
          }
        }
      } else if (order.status === "in_delivery") {
        const r2 = routeToUserRef.current;
        if (r2 && r2.totalDistance > 0) {
          currentDistanceRef.current += 30 * deltaSeconds;

          if (currentDistanceRef.current >= r2.totalDistance - 10) {
            handleUpdateStatus("delivered", "Commande livrée à votre porte. Bon appétit !");
          } else {
            const sample = getPositionAtDistance(r2, currentDistanceRef.current);
            setCourierPos(sample.position);
            setCourierBearing(sample.bearing);
            if (courierMarkerRef.current) {
              courierMarkerRef.current.setLatLng(sample.position);
            }
            updateMapRouteView("in_delivery", currentDistanceRef.current);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animateMovement);
    }

    animationFrameRef.current = requestAnimationFrame(animateMovement);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [order, updateMapRouteView, handleUpdateStatus]);

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
        className: "foodi-pin-wrapper",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-white border-2 border-[#1E293B] shadow-md flex items-center justify-center p-1 overflow-hidden">
              <img src="${order?.restaurantLogo || '/images/restaurants/McDonalds.png'}" class="w-full h-full object-contain" alt="Restaurant" />
            </div>
            <div class="absolute -bottom-1 w-2 h-2 bg-[#1E293B] rotate-45"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const housePin = L.divIcon({
        className: "foodi-dest-pin",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-[#FF5A00]/30 animate-ping"></div>
            <div class="w-7 h-7 rounded-full bg-[#FF5A00] border-3 border-white shadow-xl flex items-center justify-center">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const courierPin = L.divIcon({
        className: "foodi-courier-pin",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute w-12 h-12 rounded-full bg-[#18181B]/20 animate-ping"></div>
            <div id="foodi-live-courier-icon" class="w-10 h-10 rounded-full bg-[#18181B] border-2 border-white shadow-xl flex items-center justify-center text-white transition-transform duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      L.marker(coords.shop, { icon: restaurantPin }).addTo(map);
      L.marker(coords.dest, { icon: housePin }).addTo(map);

      const marker = L.marker(coords.start, { icon: courierPin });
      if (courierAssigned) {
        marker.addTo(map);
      }
      courierMarkerRef.current = marker;

      const roadLine = L.polyline([], {
        color: "#1E293B",
        weight: 4.5,
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
              to="/orders"
              className="foodi-btn-primary w-full py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center"
            >
              Commandes
            </Link>
            <Link
              to="/restaurants"
              className="w-full py-3 px-6 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors flex items-center justify-center"
            >
              Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderReceiptModal = () => {
    if (!showReceiptModal || !order) return null;
    return (
      <div
        className="foodi-modal-backdrop"
        onClick={() => setShowReceiptModal(false)}
      >
        <div
          className="foodi-modal-container"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 540 }}
        >
          <div className="foodi-modal-header">
            <h3 className="foodi-modal-title">Ticket de caisse</h3>
            <button
              className="foodi-modal-close-btn"
              onClick={() => setShowReceiptModal(false)}
            >
              ✕
            </button>
          </div>

          <div className="foodi-modal-body">
            <div className="foodi-receipt-voucher">
              <div className="foodi-receipt-header">
                <div className="foodi-receipt-name">{order.restaurantName}</div>
                <div className="foodi-receipt-sub">
                  {order.neighborhood || "Agadir, Maroc"}
                  <br />
                  Tél : +212 5 28 84 92 10
                </div>
              </div>

              <div className="foodi-receipt-pickup-box">
                <div style={{ fontSize: 10, color: "#64748B" }}>CODE COURSIER :</div>
                <div className="foodi-receipt-pickup-val">
                  #{order.id.slice(-4)}
                </div>
              </div>

              <div className="foodi-receipt-row" style={{ paddingBottom: 6, borderBottom: "1px dashed #CBD5E1", marginBottom: 6 }}>
                <span>N° COMMANDE :</span>
                <strong style={{ fontSize: 13, color: "#0D0D0F", letterSpacing: 0.5 }}>
                  {order.id}
                </strong>
              </div>

              <div className="foodi-receipt-row">
                <span>Point de vente :</span>
                <strong>{order.neighborhood || "Agadir"}</strong>
              </div>

              <div className="foodi-receipt-row">
                <span>Date :</span>
                <span>{order.date || "Aujourd'hui"}</span>
              </div>

              <div className="foodi-receipt-row">
                <span>Client :</span>
                <strong>{order.customerName || "Client Foodi"}</strong>
              </div>

              <div className="foodi-receipt-row">
                <span>Téléphone :</span>
                <span>{order.customerPhone || "+212 6 71 82 93 04"}</span>
              </div>

              <div className="foodi-receipt-row">
                <span>Adresse livraison :</span>
                <span style={{ textAlign: "right", maxWidth: "60%" }}>
                  {order.address || order.neighborhood || "Agadir"}
                </span>
              </div>

              {order.instructions && (
                <div className="foodi-receipt-row" style={{ marginTop: 4, fontStyle: "italic", color: "#64748B" }}>
                  <span>Note client :</span>
                  <span style={{ textAlign: "right", maxWidth: "65%" }}>
                    {order.instructions}
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
                  {order.items?.map((item, i) => (
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
                  <strong>{order.subtotal || order.total} DH</strong>
                </div>
                <div className="foodi-receipt-row">
                  <span>Frais livraison (coursier) :</span>
                  <span>{order.deliveryFee || 0} DH</span>
                </div>
                <div className="foodi-receipt-row" style={{ borderTop: "1px dashed #94A3B8", paddingTop: 4, marginTop: 4 }}>
                  <span>Total payé par client :</span>
                  <span>{order.total} DH</span>
                </div>
                <div className="foodi-receipt-grand-total">
                  <span>Total :</span>
                  <span>{order.total} DH</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="foodi-btn foodi-btn-outline"
                onClick={() => setShowReceiptModal(false)}
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
    );
  };

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
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center justify-center transition-colors border border-[#0B1020]/10"
          >
            Accueil
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
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="foodi-btn-primary flex-1 py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center"
            >
              Reçu
            </button>
            <Link
              to="/orders"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors text-center flex items-center justify-center"
            >
              Commandes
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors text-center flex items-center justify-center"
            >
              Accueil
            </Link>
          </div>
        </div>
        {renderReceiptModal()}
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
            className="h-9 px-3.5 rounded-full bg-white hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] text-xs font-bold flex items-center justify-center transition-colors border border-[#0B1020]/10"
          >
            Accueil
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
              className="foodi-btn-primary flex-1 py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center"
            >
              Restaurants
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-[#FAF8F5] text-[#0B1020] text-xs font-bold hover:bg-[#eaeaea] transition-colors text-center flex items-center justify-center"
            >
              Accueil
            </Link>
          </div>
        </div>
        {renderReceiptModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-[#0B1020]">
      <HomeHeader title="Location Tracking" showBackButton />

      {networkError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Synchronisation réseau en cours...</span>
        </div>
      )}

      <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 flex-1 flex flex-col lg:flex-row gap-5 items-stretch">
        <div className="w-full lg:flex-1 h-[360px] sm:h-[480px] lg:h-[660px] rounded-3xl overflow-hidden bg-white border border-[#0B1020]/8 shadow-sm relative flex flex-col">
          <div ref={mapContainerRef} className="w-full h-full z-0 flex-1" />

          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-sm border border-[#0B1020]/8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF5A00] animate-ping" />
            <span className="text-xs font-black text-[#0B1020]">
              {order.statusLabel || "En direct"}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2">
            <button
              onClick={handleRecenter}
              title="Centrer la carte"
              className="bg-white/95 hover:bg-white text-[#0B1020] px-3.5 py-1.5 rounded-xl shadow-sm border border-[#0B1020]/8 text-xs font-bold transition-all cursor-pointer"
            >
              Centrer
            </button>
            <button
              onClick={() => setShowReceiptModal(true)}
              className="foodi-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black shadow-md cursor-pointer"
            >
              Reçu
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[440px] xl:w-[470px]">
          <div className="bg-[#18181B] text-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block text-[#FF5A00] bg-white/10 border border-white/10">
                    Arrivée estimée
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="px-3 py-1 rounded-full bg-[#FF5A00] hover:bg-[#E64F00] text-white text-[11px] font-black shadow-sm transition-all cursor-pointer"
                  >
                    Reçu
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {order.arrivalTime ? `~${order.arrivalTime}` : `~${order.totalTime || 25} min`}
                </h2>
              </div>

              <div className="w-13 h-13 rounded-2xl bg-white/10 text-[#FF5A00] flex items-center justify-center shrink-0 border border-white/10">
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
              <h3 className="text-base sm:text-lg font-black text-white leading-snug">
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
              <p className="text-xs text-white/70 leading-relaxed">
                {order.status === "pending_confirmation"
                  ? "Votre commande a bien été transmise à l'établissement."
                  : order.status === "preparing"
                  ? "Les chefs cuisinent vos plats avec des ingrédients frais."
                  : order.status === "searching_driver"
                  ? "Attribution du coursier partenaire le plus proche."
                  : order.status === "heading_to_restaurant"
                  ? `Le coursier récupère votre paquet chez ${order.restaurantName}.`
                  : `Le livreur approche de ${truncateText(order.neighborhood || order.address, 10)}.`}
              </p>
            </div>

            {order.status === "pending_confirmation" && (
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center shrink-0 border border-white/10">
                  <Clock className="w-4 h-4 animate-pulse-gentle" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white block">En attente de confirmation</span>
                  <span className="text-white/60 text-[11px]">
                    Envoyée à {order.date?.split("à")[1] || "l'instant"} • Réf {order.id}
                  </span>
                </div>
              </div>
            )}

            {order.status === "preparing" && (
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3.5">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute top-1 left-2.5 w-1 h-2.5 rounded-full bg-[#FF5A00] animate-steam-1" />
                  <div className="absolute top-0.5 left-4.5 w-1 h-3 rounded-full bg-[#FF5A00] animate-steam-2" />
                  <div className="absolute top-1 left-6.5 w-1 h-2.5 rounded-full bg-[#FF5A00] animate-steam-3" />
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-[#FF5A00] flex items-center justify-center border border-white/10">
                    <ChefHat className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-black text-white block">Cuisine en action</span>
                  <span className="text-white/60 text-[11px]">
                    Temps de préparation estimé : ~{order.cookingTime || 15} minutes
                  </span>
                </div>
              </div>
            )}

            {order.status === "searching_driver" && (
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center gap-3.5">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full bg-[#FF5A00]/25 animate-radar-1" />
                  <div className="absolute w-8 h-8 rounded-full bg-[#FF5A00]/25 animate-radar-2" />
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-[#FF5A00] flex items-center justify-center border border-white/10 z-10">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-black text-white block">Recherche radar active</span>
                  <span className="text-white/60 text-[11px]">
                    {dispatchText || "Détection des coursiers disponibles à proximité"}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <div className="flex items-center justify-between text-center relative">
                <div className="absolute top-3.5 left-4 right-4 h-1 bg-white/10 -z-0">
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
                            ? "bg-[#FF5A00] text-white ring-4 ring-[#FF5A00]/30 scale-105"
                            : isPassed
                            ? "bg-[#FF5A00] text-white"
                            : "bg-white/10 text-white/40 border border-white/10"
                        }`}
                      >
                        {isPassed ? "✓" : step.number}
                      </div>
                      <span
                        className={`text-[10px] hidden sm:block ${
                          isCurrent
                            ? "font-black text-white"
                            : isPassed
                            ? "font-bold text-white/80"
                            : "font-semibold text-white/40"
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {courierAssigned && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#FF5A00] text-white flex items-center justify-center font-black text-lg shadow-xs">
                      <Bike className="w-6 h-6 text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#12A150] border-2 border-[#18181B]" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">
                      {order.courierName || "Amine Tazi"}
                    </h4>
                    <p className="text-xs text-white/60">
                      Coursier Foodi • Scooter
                    </p>
                    <span className="text-[10px] font-extrabold text-[#FF5A00] bg-white/10 px-2 py-0.5 rounded-md inline-block mt-1">
                      ★ 4.9 (420+ courses)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${order.courierPhone || "+212662102030"}`}
                    className="w-10 h-10 rounded-full bg-[#FF5A00] hover:bg-[#e04f00] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer"
                    title="Appeler le coursier"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={`sms:${order.courierPhone || "+212662102030"}`}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-transform hover:scale-105 border border-white/10 cursor-pointer"
                    title="Envoyer un SMS"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-white">
                <MapPin className="w-4 h-4 text-[#FF5A00]" />
                <span>Adresse de livraison</span>
              </div>
              <p className="text-sm font-black text-white" title={order.address}>
                {truncateText(order.neighborhood || order.address, 10)}
              </p>
              {order.instructions && (
                <div className="text-[11px] text-white/70 bg-white/5 p-2 rounded-xl border border-white/10 mt-1">
                  <span className="font-bold text-white">Consigne : </span>
                  {order.instructions}
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
              <button
                onClick={() => setShowReceiptDetails(!showReceiptDetails)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                    <img
                      src={order.restaurantLogo}
                      alt={order.restaurantName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">
                      {order.restaurantName}
                    </h4>
                    <p className="text-[10px] text-white/60">
                      Menu commandé • Total : {order.total} DH
                    </p>
                  </div>
                </div>
                {showReceiptDetails ? (
                  <ChevronUp className="w-4 h-4 text-white/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/60" />
                )}
              </button>

              {showReceiptDetails && (
                <div className="pt-2 border-t border-white/10 space-y-2 text-xs divide-y divide-white/10">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex justify-between gap-2">
                      <span className="text-white/80">
                        <strong className="text-white">{it.quantity}x</strong> {it.name}
                        {it.options && (
                          <span className="block text-[10px] text-white/60">
                            {it.options}
                          </span>
                        )}
                      </span>
                      <span className="font-black text-white shrink-0">
                        {it.price * it.quantity} DH
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between text-xs font-bold text-white/60">
                    <span>Frais de livraison</span>
                    <span>{order.deliveryFee === 0 ? "Gratuit" : `${order.deliveryFee} DH`}</span>
                  </div>
                  <div className="pt-2 flex justify-between text-sm font-black text-white">
                    <span>Total</span>
                    <span className="text-[#FF5A00]">
                      {order.total} DH ({order.paymentLabel || "Espèces"})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {renderReceiptModal()}
    </div>
  );
};

export default OrderTrackingPage;
