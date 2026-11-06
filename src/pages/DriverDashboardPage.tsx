import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/driver.css";
import {
  Bike,
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
  AlertCircle
} from "lucide-react";
import { OrderRecord, OrderStatus } from "../types";
import { fetchRoadRoute, buildRouteGeometry, LatLng } from "../utils/routing";

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

  const [driverState, setDriverState] = useState<DriverState>("offline");
  const [activeTab, setActiveTab] = useState<"home" | "deliveries" | "profile" | "help">("home");

  const [driverName, setDriverName] = useState<string>("Amine Tazi");
  const [driverPhone, setDriverPhone] = useState<string>("+212 6 62 10 20 30");
  const [vehicleModel, setVehicleModel] = useState<string>("Yamaha NMAX 155");
  const [vehiclePlate, setVehiclePlate] = useState<string>("48291-A-33");

  const [todayEarnings, setTodayEarnings] = useState<number>(184);
  const [todayDeliveriesCount, setTodayDeliveriesCount] = useState<number>(7);
  const [onlineMinutes, setOnlineMinutes] = useState<number>(225);

  const [driverLocation, setDriverLocation] = useState<LatLng>([30.4215, -9.5982]);
  const [isDemoLocation, setIsDemoLocation] = useState<boolean>(true);

  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [offerTimer, setOfferTimer] = useState<number>(30);
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

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

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

  const createDriverIcon = () => {
    return L.divIcon({
      className: "foodi-map-marker-pin",
      html: `
        <div class="foodi-marker-bubble driver">Livreur Foodi</div>
        <div class="foodi-marker-icon-box driver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
        </div>
      `,
      iconSize: [80, 56],
      iconAnchor: [40, 56]
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

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(driverLocation, 15, { animate: true });
  };

  const handleGoOnline = () => {
    setDriverState("online_searching");
  };

  const handleGoOffline = () => {
    setDriverState("offline");
    setActiveOrder(null);
  };

  const handleTriggerSimulatedOffer = () => {
    if (driverState !== "online_searching") return;

    const demo: OrderRecord = {
      id: `CMD-AGD-${Math.floor(1000 + Math.random() * 9000)}`,
      token: `trk_demo_${Date.now()}`,
      restaurantName: "McDonald's Agadir",
      restaurantLogo: "/images/restaurants/McDonalds.png",
      neighborhood: "Talborjt, Agadir",
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
      shopLat: 30.412495,
      shopLng: -9.595213,
      lat: 30.3991101,
      lng: -9.5744385
    };       
    setActiveOrder(demo);
    setDriverState("offer_received");
    setOfferTimer(30);
    playChime();
  };

  useEffect(() => {
    if (driverState !== "offer_received") return;
    const interval = setInterval(() => {
      setOfferTimer((prev) => {
        if (prev <= 1) {
          setDriverState("online_searching");
          setActiveOrder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [driverState]);

  const handleAcceptDelivery = () => {
    if (!activeOrder) return;
    setIsAccepting(true);
    playChime();

    setTimeout(() => {
      setIsAccepting(false);
      setDriverState("heading_to_restaurant");
      setPickupCodeInput("");
      setPickupCodeError("");
    }, 700);
  };

  const handleDeclineDelivery = () => {
    setActiveOrder(null);
    setDriverState("online_searching");
  };

  const handleArrivedAtRestaurant = () => {
    setDriverState("arrived_at_restaurant");
  };

  const handleOrderPickedUp = () => {
    setDriverState("picked_up");
    setTimeout(() => {
      setDriverState("heading_to_customer");
    }, 450);
  };

  const handleArrivedAtCustomer = () => {
    setDriverState("arrived_at_customer");
  };

  const handleCompleteDelivery = () => {
    if (!activeOrder) return;
    const earned = 25;

    setTodayEarnings((prev) => prev + earned);
    setTodayDeliveriesCount((prev) => prev + 1);

    setCompletedList((prev) => [
      {
        id: activeOrder.id,
        restaurantName: activeOrder.restaurantName,
        neighborhood: activeOrder.neighborhood,
        earned,
        time: "À l'instant",
        distance: "5.2 km"
      },
      ...prev
    ]);

    setDriverState("delivered");
  };

  const handleBackToHome = () => {
    setActiveOrder(null);
    setDriverState("online_searching");
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

  return (
    <div className="driver-app">
      <header className="driver-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/" className="driver-header-brand">
            <img src="/images/logohor.png" alt="Foodi" className="driver-header-logo" />
            <span className="driver-badge-driver">Driver</span>
          </Link>

          <nav className="driver-header-nav">
            <button
              type="button"
              onClick={() => { setActiveTab("home"); if (driverState === "delivered") setDriverState("online_searching"); }}
              className={`driver-nav-tab ${activeTab === "home" ? "active" : ""}`}
            >
              <Bike size={16} />
              <span>Accueil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deliveries")}
              className={`driver-nav-tab ${activeTab === "deliveries" ? "active" : ""}`}
            >
              <PackageCheck size={16} />
              <span>Mes courses</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`driver-nav-tab ${activeTab === "profile" ? "active" : ""}`}
            >
              <User size={16} />
              <span>Mon profil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("help")}
              className={`driver-nav-tab ${activeTab === "help" ? "active" : ""}`}
            >
              <HelpCircle size={16} />
              <span>Support</span>
            </button>
          </nav>
        </div>

        <div className="driver-header-right">
          <div className="driver-earnings-pill">
            <span className="driver-earnings-label">Gains du jour</span>
            <span className="driver-earnings-val">{todayEarnings}.00 MAD</span>
          </div>

          <div className="driver-header-profile">
            <div className="driver-avatar-circle">
              {driverName.slice(0, 2).toUpperCase()}
            </div>
            <div className="driver-profile-meta">
              <span className="driver-profile-name">{driverName}</span>
              <span className={`driver-status-chip ${driverState !== "offline" ? "online" : "offline"}`}>
                <span className={`driver-status-dot ${driverState !== "offline" ? "online" : "offline"}`} />
                <span>{driverState !== "offline" ? "En ligne" : "Hors ligne"}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="driver-main">
        {activeTab === "home" && !isNavigating && driverState !== "delivered" && (
          <div className="driver-home-wrapper">
            <div className={`driver-control-card ${driverState === "online_searching" ? "online" : ""}`}>
              {driverState === "offline" ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 520 }}>
                  <div style={{ width: 68, height: 68, borderRadius: 9999, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                    <Power size={32} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: "#0B1020" }}>Vous êtes hors ligne</h2>
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
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <div className="driver-radar-searching-stage">
                    <div className="driver-radar-ring r1" />
                    <div className="driver-radar-ring r2" />
                    <div className="driver-radar-ring r3" />
                    <div className="driver-scooter-center">
                      <Bike size={36} />
                    </div>
                  </div>

                  <h3 className="driver-searching-title">Recherche de commandes à proximité...</h3>
                  <p className="driver-searching-desc">
                    Restez connecté, notre algorithme intelligent recherche la meilleure course adaptée à votre secteur à Agadir.
                  </p>

                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={handleTriggerSimulatedOffer}
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(255, 90, 0, 0.3)",
                        color: "#FF5A00",
                        fontSize: 13,
                        fontWeight: 800,
                        padding: "10px 20px",
                        borderRadius: 9999,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 8px rgba(255, 90, 0, 0.15)"
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Simuler une nouvelle commande</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoOffline}
                      className="driver-toggle-offline-btn"
                      style={{ margin: 0 }}
                    >
                      <Power size={16} />
                      <span>Passer hors ligne</span>
                    </button>
                  </div>
                </div>
              )}
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
        )}

        {activeTab === "home" && isNavigating && (
          <div className="driver-nav-screen">
            <div ref={mapContainerRef} className="driver-nav-map-container" />

            <div className="driver-nav-top-banner">
              <span className="driver-nav-top-step">
                {isHeadingToRestaurant ? "Étape 1/2 : Vers le restaurant" : "Étape 2/2 : Vers le client"}
              </span>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span className="driver-nav-top-dest">{targetLabel}</span>
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
              <div className="driver-panel-row-top">
                <div className="driver-panel-eta-badge">
                  <Clock size={16} />
                  <span>{routeDuration} ({routeDistance})</span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: "#10B981" }}>
                  Gain course : 25.00 MAD
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
          <div className="driver-home-wrapper">
            <div className="driver-control-card" style={{ textAlign: "left", alignItems: "stretch" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(11, 16, 32, 0.08)", paddingBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0B1020" }}>Historique des livraisons</h3>
                  <p style={{ fontSize: 12, color: "#7A8194", marginTop: 2 }}>
                    Toutes vos courses enregistrées dans le Grand Agadir
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "6px 14px", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  Total gains : {todayEarnings}.00 MAD
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {completedList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderRadius: 16,
                      backgroundColor: "#FAF8F5",
                      border: "1px solid rgba(11, 16, 32, 0.06)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: "#0B1020" }}>{item.restaurantName}</div>
                        <div style={{ fontSize: 11, color: "#7A8194" }}>
                          Vers {item.neighborhood} • {item.distance} • {item.time}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#10B981" }}>
                      +{item.earned}.00 MAD
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="driver-home-wrapper">
            <div className="driver-control-card" style={{ textAlign: "left", alignItems: "stretch", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid rgba(11, 16, 32, 0.08)", paddingBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#FFF2EB", color: "#FF5A00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900 }}>
                  AT
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0B1020" }}>{driverName}</h3>
                    <span style={{ fontSize: 10, fontWeight: 900, color: "#047857", backgroundColor: "#ECFDF5", padding: "2px 8px", borderRadius: 9999, border: "1px solid rgba(16, 185, 129, 0.3)", textTransform: "uppercase" }}>
                      Coursier Certifié
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#7A8194", marginTop: 2 }}>{driverPhone} • {vehicleModel}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Véhicule enregistré</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>{vehicleModel}</div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#64748B", marginTop: 2 }}>Plaque : {vehiclePlate}</div>
                </div>

                <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Zone logistique</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0B1020", marginTop: 2 }}>Grand Agadir</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Talborjt, Marina, Founty, Dakhla</div>
                </div>

                <div style={{ backgroundColor: "#FAF8F5", padding: 16, borderRadius: 16, border: "1px solid rgba(11, 16, 32, 0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#7A8194", textTransform: "uppercase" }}>Conformité permis & assurance</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#10B981", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <ShieldCheck size={18} />
                    <span>Dossier approuvé</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Valide jusqu'en déc. 2027</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "help" && (
          <div className="driver-home-wrapper">
            <div className="driver-control-card" style={{ textAlign: "left", alignItems: "stretch", gap: 20 }}>
              <div style={{ borderBottom: "1px solid rgba(11, 16, 32, 0.08)", paddingBottom: 12 }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#0B1020" }}>Assistance & Support Coursier</h3>
                <p style={{ fontSize: 12, color: "#7A8194", marginTop: 2 }}>
                  Une équipe dédiée vous accompagne 7j/7 lors de vos livraisons
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                <div style={{ backgroundColor: "#FFF2EB", border: "1px solid rgba(255, 90, 0, 0.2)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#FF5A00", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Phone size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0B1020" }}>Ligne d'Urgence Dispatch</h4>
                    <p style={{ fontSize: 12, color: "#7A8194", marginTop: 2 }}>En cas de problème d'accès, d'accident ou de commande endommagée :</p>
                  </div>
                  <a
                    href="tel:+212662102030"
                    style={{ fontSize: 15, fontWeight: 900, color: "#FF5A00", textDecoration: "none" }}
                  >
                    +212 6 62 10 20 30
                  </a>
                </div>

                <div style={{ backgroundColor: "#FAF8F5", border: "1px solid rgba(11, 16, 32, 0.08)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#0B1020", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0B1020" }}>Hub Coursiers Agadir</h4>
                    <p style={{ fontSize: 12, color: "#7A8194", marginTop: 2 }}>Avenue Hassan II, Centre-ville, Agadir</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>Ouvert tous les jours de 09:00 à 02:00</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {driverState === "offer_received" && activeOrder && (
        <div className="driver-modal-overlay">
          <div className="driver-offer-card">
            <div className="driver-offer-timer-bar">
              <div
                className="driver-offer-timer-fill"
                style={{ width: `${(offerTimer / 30) * 100}%` }}
              />
            </div>

            <div className="driver-offer-body">
              <div className="driver-offer-earnings-badge">
                <span className="driver-offer-earnings-text">Gain garanti course</span>
                <span className="driver-offer-earnings-amount">25.00 MAD</span>
              </div>

              <div className="driver-offer-restaurant-row">
                <img
                  src={activeOrder.restaurantLogo || "/images/restaurants/McDonalds.png"}
                  alt={activeOrder.restaurantName}
                  className="driver-offer-restaurant-logo"
                />
                <div>
                  <div className="driver-offer-restaurant-name">{activeOrder.restaurantName}</div>
                  <div className="driver-offer-restaurant-loc">{activeOrder.street || "Avenue Hassan II, Agadir"}</div>
                </div>
              </div>

              <div className="driver-offer-trip-breakdown">
                <div className="driver-trip-leg">
                  <span className="driver-trip-leg-label">Livreur → Restaurant</span>
                  <span className="driver-trip-leg-val">1.8 km (≈ 6 min)</span>
                </div>
                <div className="driver-trip-leg">
                  <span className="driver-trip-leg-label">Restaurant → Client</span>
                  <span className="driver-trip-leg-val">3.4 km (≈ 14 min)</span>
                </div>
                <div className="driver-trip-leg">
                  <span className="driver-trip-leg-label">Distance totale</span>
                  <span className="driver-trip-leg-val">5.2 km</span>
                </div>
                <div className="driver-trip-leg">
                  <span className="driver-trip-leg-label">Durée estimée</span>
                  <span className="driver-trip-leg-val">25 minutes</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#7A8194" }}>
                <span>Destination : <strong>{activeOrder.neighborhood}</strong></span>
                <span style={{ fontWeight: 800, color: "#EF4444" }}>Temps restant : {offerTimer}s</span>
              </div>

              <div className="driver-offer-actions">
                <button
                  type="button"
                  onClick={handleDeclineDelivery}
                  className="driver-btn-decline"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={handleAcceptDelivery}
                  className="driver-btn-accept"
                >
                  <span>Accepter la livraison</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOrderDetailsOpen && activeOrder && (
        <div className="driver-modal-overlay">
          <div className="driver-order-details-card">
            <div className="driver-order-details-header">
              <span className="driver-order-id-badge">#{activeOrder.id}</span>
              <button
                type="button"
                onClick={() => setIsOrderDetailsOpen(false)}
                className="driver-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={activeOrder.restaurantLogo || "/images/restaurants/McDonalds.png"}
                alt={activeOrder.restaurantName}
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: "contain", border: "1px solid rgba(11, 16, 32, 0.08)" }}
              />
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 900, color: "#0B1020" }}>{activeOrder.restaurantName}</h4>
                <p style={{ fontSize: 11, color: "#7A8194" }}>Statut : Prête pour le retrait au comptoir</p>
              </div>
            </div>

            <div className="driver-qr-container">
              <div className="driver-qr-box">
                <svg width="120" height="120" viewBox="0 0 100 100">
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
                Token vérification : <strong>{activeOrder.id}-VERIFY</strong>
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
                cursor: "pointer"
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
