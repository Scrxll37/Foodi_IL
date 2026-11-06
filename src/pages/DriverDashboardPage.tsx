import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bike,
  Car,
  Power,
  DollarSign,
  Clock,
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Wallet,
  ChevronRight,
  Star,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  LogOut,
  User,
  Search,
  Filter,
  Layers,
  FileText,
  Upload,
  Camera,
  Check,
  Sliders,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  Truck,
  Compass,
  ArrowLeft,
  KeyRound,
  Eye,
  X,
  ExternalLink,
  PackageCheck,
  Building2,
  FileBadge2,
  Award,
  Zap,
  Info,
  Smartphone,
  CheckCheck
} from "lucide-react";
import { OrderRecord, OrderStatus } from "../types";

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem("foodi_driver_onboarded") === "true";
    } catch {
      return false;
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

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [defaultGps, setDefaultGps] = useState<"google" | "waze" | "apple">("google");
  const [activeTab, setActiveTab] = useState<"waiting" | "deliveries" | "profile" | "settings" | "help">("waiting");

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [incomingOrder, setIncomingOrder] = useState<OrderRecord | null>(null);
  const [incomingTimer, setIncomingTimer] = useState<number>(30);

  const [activeMission, setActiveMission] = useState<OrderRecord | null>(null);
  const [missionPhase, setMissionPhase] = useState<"to_restaurant" | "at_restaurant" | "to_customer" | "delivered">("to_restaurant");
  const [pickupCodeInput, setPickupCodeInput] = useState<string>("");
  const [pickupCodeError, setPickupCodeError] = useState<string>("");
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState<boolean>(false);

  const [todayEarnings, setTodayEarnings] = useState<number>(184);
  const [todayDeliveriesCount, setTodayDeliveriesCount] = useState<number>(7);
  const [completedDeliveries, setCompletedDeliveries] = useState<Array<{
    id: string;
    restaurantName: string;
    neighborhood: string;
    earned: number;
    time: string;
    itemsCount: number;
  }>>([
    {
      id: "CMD-AGD-4921",
      restaurantName: "McDonald's Agadir",
      neighborhood: "Talborjt",
      earned: 24,
      time: "18:30",
      itemsCount: 2
    },
    {
      id: "CMD-AGD-3810",
      restaurantName: "KFC Hassan II",
      neighborhood: "Haut Founty",
      earned: 28,
      time: "17:15",
      itemsCount: 3
    },
    {
      id: "CMD-AGD-2104",
      restaurantName: "Tacos de Lyon",
      neighborhood: "Dakhla",
      earned: 22,
      time: "16:00",
      itemsCount: 1
    }
  ]);

  const playChime = useCallback(() => {
    if (!soundEnabled) return;
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
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data: OrderRecord[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        setOrders(JSON.parse(raw));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!isOnline || incomingOrder || activeMission) return;

    const available = orders.find(
      (o) =>
        o.status === "searching_driver" || o.status === "preparing" || o.status === "pending_confirmation"
    );

    if (available) {
      setIncomingOrder(available);
      setIncomingTimer(30);
      playChime();
    }
  }, [orders, isOnline, incomingOrder, activeMission, playChime]);

  useEffect(() => {
    if (!incomingOrder) return;
    const timer = setInterval(() => {
      setIncomingTimer((prev) => {
        if (prev <= 1) {
          setIncomingOrder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingOrder]);

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
    setStepLoadingText("Contrôle sécurisé des pièces d'identité et permis...");
    setTimeout(() => {
      setStepLoading(false);
      setOnboardStep(3);
    }, 700);
  };

  const handleFinishOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem("foodi_driver_onboarded", "true");
    setIsOnline(true);
    setActiveTab("waiting");
  };

  const handleSimulateOffer = () => {
    const demoOrder: OrderRecord = {
      id: `CMD-AGD-${Math.floor(1000 + Math.random() * 9000)}`,
      token: `trk_demo_${Date.now()}`,
      restaurantName: "McDonald's",
      restaurantLogo: "/images/restaurants/McDonalds.png",
      neighborhood: "Talborjt, Agadir",
      street: "Avenue Hassan II",
      buildingNameNumber: "Résidence Najah, Bât B",
      floorNumber: "2ème",
      doorNumber: "Appt 8",
      date: "Aujourd'hui",
      status: "searching_driver",
      statusLabel: "Recherche d'un livreur à proximité",
      total: 94,
      subtotal: 94,
      deliveryFee: 0,
      address: "Talborjt, Avenue Hassan II, Agadir",
      items: [
        { name: "Menu Maxi Best Of Big Mac", quantity: 1, price: 74 },
        { name: "McFlurry Oreo", quantity: 1, price: 20 }
      ],
      instructions: "Sonner à l'interphone et monter au 2ème étage.",
      shopLat: 30.4167,
      shopLng: -9.6,
      lat: 30.4278,
      lng: -9.5981
    };

    setIncomingOrder(demoOrder);
    setIncomingTimer(30);
    playChime();
  };

  const handleAcceptOrder = () => {
    if (!incomingOrder) return;
    const accepted = incomingOrder;
    setIncomingOrder(null);
    setActiveMission(accepted);
    setMissionPhase("to_restaurant");
    setPickupCodeInput("");
    setPickupCodeError("");

    updateRemoteOrderStatus(
      accepted.id,
      accepted.token,
      "heading_to_restaurant",
      "Livreur assigné, en route vers le restaurant"
    );
  };

  const handleDenyOrder = () => {
    setIncomingOrder(null);
  };

  const handleArrivedAtRestaurant = () => {
    setMissionPhase("at_restaurant");
  };

  const handleVerifyPickupCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMission) return;

    const clean = pickupCodeInput.trim();
    if (clean.length !== 4) {
      setPickupCodeError("Veuillez saisir le code à 4 chiffres.");
      return;
    }

    setMissionPhase("to_customer");
    setPickupCodeError("");

    updateRemoteOrderStatus(
      activeMission.id,
      activeMission.token,
      "in_delivery",
      "Commande récupérée par le livreur, en route vers le client"
    );
  };

  const handleConfirmDelivered = () => {
    if (!activeMission) return;
    const feeEarned = 24;

    updateRemoteOrderStatus(
      activeMission.id,
      activeMission.token,
      "delivered",
      "Commande livrée avec succès"
    );

    setTodayEarnings((prev) => prev + feeEarned);
    setTodayDeliveriesCount((prev) => prev + 1);

    setCompletedDeliveries((prev) => [
      {
        id: activeMission.id,
        restaurantName: activeMission.restaurantName,
        neighborhood: activeMission.neighborhood,
        earned: feeEarned,
        time: "À l'instant",
        itemsCount: activeMission.items?.length || 1
      },
      ...prev
    ]);

    setMissionPhase("delivered");

    setTimeout(() => {
      setActiveMission(null);
      setMissionPhase("to_restaurant");
      setActiveTab("waiting");
    }, 1600);
  };

  const updateRemoteOrderStatus = async (
    orderId: string,
    token: string | undefined,
    status: OrderStatus,
    statusLabel: string
  ) => {
    const patch = {
      id: orderId,
      token,
      status,
      statusLabel,
      courierName: `${driverFirstName} ${driverLastName}`,
      courierPhone: driverPhone,
      courierLat: 30.415,
      courierLng: -9.598
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
    );

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
          o.id === orderId ? { ...o, ...patch } : o
        );
        localStorage.setItem("foodi_orders", JSON.stringify(updated));
      }
    } catch {}
  };

  const openExternalGps = (type: "google" | "waze" | "apple", lat: number, lng: number) => {
    let url = "";
    if (type === "google") {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    } else if (type === "waze") {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else {
      url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    }
    window.open(url, "_blank");
  };

  if (!isOnboarded) {
    return (
      <div className="min-h-screen w-full bg-[#FAF8F5] text-[#0B1020] font-sans flex flex-col justify-between">
        <header className="w-full bg-white border-b border-[#0B1020]/8 px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-block">
              <img src="/images/logohor.png" alt="Foodi" className="h-8 lg:h-9 object-contain" />
            </Link>
            <div className="hidden sm:block h-5 w-px bg-[#0B1020]/15" />
            <span className="hidden sm:inline-block text-xs font-black text-[#0B1020] uppercase tracking-wider">
              Portail Partenaire Coursier
            </span>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-black">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${onboardStep >= 1 ? "bg-[#FF5A00]" : "bg-zinc-300"}`}>
                  1
                </span>
                <span className={`hidden md:inline ${onboardStep === 1 ? "text-[#0B1020]" : "text-[#7A8194]"}`}>
                  Véhicule
                </span>
              </div>

              <div className="w-4 sm:w-8 h-0.5 bg-[#0B1020]/10" />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${onboardStep >= 2 ? "bg-[#FF5A00]" : "bg-zinc-300"}`}>
                  2
                </span>
                <span className={`hidden md:inline ${onboardStep === 2 ? "text-[#0B1020]" : "text-[#7A8194]"}`}>
                  Identité & Permis
                </span>
              </div>

              <div className="w-4 sm:w-8 h-0.5 bg-[#0B1020]/10" />

              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${onboardStep === 3 ? "bg-emerald-500" : "bg-zinc-300"}`}>
                  3
                </span>
                <span className={`hidden md:inline ${onboardStep === 3 ? "text-[#0B1020]" : "text-[#7A8194]"}`}>
                  Validation
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#7A8194]">
              <span>Assistance :</span>
              <a href="tel:+212662102030" className="text-[#FF5A00] font-black hover:underline">
                +212 6 62 10 20 30
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10 flex flex-col lg:flex-row gap-8 items-stretch">
          <div className="hidden lg:flex lg:w-[38%] xl:w-[34%] bg-[#18181B] text-white rounded-3xl p-8 xl:p-10 flex-col justify-between shadow-xl border border-zinc-800 shrink-0">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF5A00]/20 text-[#FF5A00] text-xs font-black border border-[#FF5A00]/30">
                <Bike className="w-4 h-4" />
                <span>Réseau Coursiers Agadir</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl xl:text-3xl font-black text-white leading-tight">
                  Livrez à Agadir en toute liberté.
                </h2>
                <p className="text-xs xl:text-sm text-zinc-300 leading-relaxed font-medium">
                  Remplissez ce formulaire pour valider votre statut coursier. Nos équipes traitent les demandes en moins de 15 minutes.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Tarifs garantis par course</h4>
                    <p className="text-[11px] text-zinc-400">Rémunération transparente et pourboires 100% reversés.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Assurance & Support 7j/7</h4>
                    <p className="text-[11px] text-zinc-400">Vous êtes couvert lors de chaque trajet de livraison.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>Secteur Grand Agadir</span>
              <span className="font-bold text-white">Talborjt • Founty • Marina</span>
            </div>
          </div>

          <div className="flex-1 w-full bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0B1020]/8 shadow-sm flex flex-col justify-between">
            {stepLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 text-center">
                <div className="w-16 h-16 border-4 border-[#FF5A00]/20 border-t-[#FF5A00] rounded-full animate-spin mx-auto" />
                <h3 className="text-lg font-black text-[#0B1020]">
                  {stepLoadingText}
                </h3>
                <p className="text-xs text-[#7A8194]">
                  Enregistrement sur le réseau logistique Foodi Agadir...
                </p>
              </div>
            ) : onboardStep === 1 ? (
              <form onSubmit={handleNextStep1} className="space-y-6">
                <div className="border-b border-[#0B1020]/8 pb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FF5A00] block mb-1">
                    Étape 1 sur 2
                  </span>
                  <h1 className="text-2xl lg:text-3xl font-black text-[#0B1020] tracking-tight">
                    Informations sur votre véhicule de livraison
                  </h1>
                  <p className="text-xs text-[#7A8194] mt-1">
                    Sélectionnez le type d'engin utilisé pour vos courses et complétez les données de la carte grise.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#0B1020] block">Type de moyen de transport</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setVehicleType("motorcycle")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        vehicleType === "motorcycle"
                          ? "border-[#FF5A00] bg-orange-50/20 shadow-xs ring-1 ring-[#FF5A00]/30"
                          : "border-[#0B1020]/10 bg-white hover:border-[#0B1020]/25"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#0B1020]">Moto / Scooter</span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Actif
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A8194]">Idéal pour les livraisons rapides à Agadir</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border-2 border-dashed border-[#0B1020]/15 bg-zinc-50 opacity-60 flex items-center gap-4 cursor-not-allowed">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-200 text-zinc-500 flex items-center justify-center shrink-0">
                        <Car className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-zinc-600">Voiture</span>
                          <span className="text-[10px] font-black text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                            Bientôt
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">Ouverture prochaine des livraisons en auto</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Marque du deux-roues</label>
                    <input
                      type="text"
                      required
                      value={vehBrand}
                      onChange={(e) => setVehBrand(e.target.value)}
                      placeholder="ex: Yamaha, Honda, SYM, Kymco"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Modèle précis</label>
                    <input
                      type="text"
                      required
                      value={vehModel}
                      onChange={(e) => setVehModel(e.target.value)}
                      placeholder="ex: NMAX 155, TMAX, SH 125"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Cylindrée moteur</label>
                    <input
                      type="text"
                      required
                      value={vehEngine}
                      onChange={(e) => setVehEngine(e.target.value)}
                      placeholder="ex: 125 cc, 150 cc"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Couleur</label>
                    <input
                      type="text"
                      required
                      value={vehColor}
                      onChange={(e) => setVehColor(e.target.value)}
                      placeholder="ex: Noir mat, Blanc, Gris"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Immatriculation (Plaque)</label>
                    <input
                      type="text"
                      required
                      value={vehPlate}
                      onChange={(e) => setVehPlate(e.target.value)}
                      placeholder="ex: 48291-A-33"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Année de mise en circulation</label>
                    <input
                      type="text"
                      required
                      value={vehYear}
                      onChange={(e) => setVehYear(e.target.value)}
                      placeholder="ex: 2023"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#0B1020]/8">
                  <div>
                    <h3 className="text-sm font-black text-[#0B1020]">Justificatifs du véhicule</h3>
                    <p className="text-xs text-[#7A8194]">Format JPG, PNG ou PDF (taille max 5 Mo par document)</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      onClick={() => setVehPhotoUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Photo moto complète</span>
                        <span className="text-[10px] text-[#7A8194]">Vue latérale d'ensemble</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {vehPhotoUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setVehBackPhotoUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Vue arrière & plaque</span>
                        <span className="text-[10px] text-[#7A8194]">Plaque nettement lisible</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {vehBackPhotoUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setVehRegUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <FileText className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Carte grise / Certificat</span>
                        <span className="text-[10px] text-[#7A8194]">Document officiel recto</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {vehRegUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="foodi-btn-primary py-4 px-8 rounded-2xl text-sm font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span>Continuer vers les informations personnelles</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : onboardStep === 2 ? (
              <form onSubmit={handleNextStep2} className="space-y-6">
                <div className="border-b border-[#0B1020]/8 pb-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 block mb-1">
                    Étape 2 sur 2
                  </span>
                  <h1 className="text-2xl lg:text-3xl font-black text-[#0B1020] tracking-tight">
                    Identité du coursier & Permis de conduire
                  </h1>
                  <p className="text-xs text-[#7A8194] mt-1">
                    Ces coordonnées sont pré-remplies depuis votre compte Foodi. Vérifiez-les et téléversez vos pièces.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Prénom</label>
                    <input
                      type="text"
                      required
                      value={driverFirstName}
                      onChange={(e) => setDriverFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Nom de famille</label>
                    <input
                      type="text"
                      required
                      value={driverLastName}
                      onChange={(e) => setDriverLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Numéro de téléphone mobile</label>
                    <input
                      type="tel"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Adresse e-mail</label>
                    <input
                      type="email"
                      required
                      value={driverEmail}
                      onChange={(e) => setDriverEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white text-xs font-semibold text-[#0B1020] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#0B1020]/8">
                  <div>
                    <h3 className="text-sm font-black text-[#0B1020]">Pièces administratives requises</h3>
                    <p className="text-xs text-[#7A8194]">Documents officiels garantissant la sécurité de la plateforme</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      onClick={() => setUserPhotoUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <User className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Photo selfie de profil</span>
                        <span className="text-[10px] text-[#7A8194]">Visage découvert et net</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {userPhotoUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setPermitUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Permis de conduire</span>
                        <span className="text-[10px] text-[#7A8194]">Permis catégorie A/A1/B</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {permitUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>

                    <div
                      onClick={() => setCinUploaded(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/20 bg-[#FAF8F5] text-center cursor-pointer hover:border-[#FF5A00] hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <FileBadge2 className="w-6 h-6 text-[#FF5A00]" />
                      <div>
                        <span className="text-xs font-black text-[#0B1020] block">Carte d'Identité (CIN)</span>
                        <span className="text-[10px] text-[#7A8194]">CNIE marocaine valide</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {cinUploaded ? "✓ Document prêt" : "+ Téléverser"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#0B1020]/8">
                  <button
                    type="button"
                    onClick={() => setOnboardStep(1)}
                    className="py-3.5 px-6 rounded-2xl border border-[#0B1020]/15 text-xs font-bold text-[#7A8194] hover:bg-[#FAF8F5] cursor-pointer"
                  >
                    Retour
                  </button>

                  <button
                    type="submit"
                    className="foodi-btn-primary py-4 px-8 rounded-2xl text-sm font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <span>Valider mon inscription et activer mon compte</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-md">
                  <Check className="w-10 h-10" />
                </div>

                <div className="space-y-2 max-w-md">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                    Dossier validé avec succès
                  </span>
                  <h2 className="text-3xl font-black text-[#0B1020]">
                    Bienvenue dans l'équipe, {driverFirstName} !
                  </h2>
                  <p className="text-xs text-[#7A8194] leading-relaxed">
                    Votre scooter <strong>{vehBrand} {vehModel}</strong> et vos pièces administratives sont approuvés. Vous êtes maintenant prêt à vous connecter en direct pour recevoir des livraisons.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="foodi-btn-primary py-4 px-10 rounded-2xl text-sm font-black shadow-xl shadow-[#FF5A00]/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Accéder à mon tableau de bord livreur</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full bg-white border-t border-[#0B1020]/8 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#7A8194]">
          Foodi Courier Agadir • Plateforme Logistique Officielle
        </footer>
      </div>
    );
  }

  if (activeMission) {
    const isToShop = missionPhase === "to_restaurant" || missionPhase === "at_restaurant";
    const targetLat = isToShop ? (activeMission.shopLat || 30.4167) : (activeMission.lat || 30.4278);
    const targetLng = isToShop ? (activeMission.shopLng || -9.6) : (activeMission.lng || -9.5981);
    const targetLabel = isToShop ? activeMission.restaurantName : activeMission.neighborhood;

    return (
      <div className="min-h-screen w-full bg-[#FAF8F5] text-[#0B1020] font-sans flex flex-col justify-between">
        <header className="w-full bg-white border-b border-[#0B1020]/8 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A00] text-white flex items-center justify-center shadow-md">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-[#FF5A00] tracking-wider block">
                {missionPhase === "to_restaurant" && "Étape 1/2 : En route vers le restaurant"}
                {missionPhase === "at_restaurant" && "Étape 1/2 : Retrait de commande & Code 4 chiffres"}
                {missionPhase === "to_customer" && "Étape 2/2 : En route vers le client"}
                {missionPhase === "delivered" && "Mission complétée"}
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#0B1020] truncate max-w-[220px] sm:max-w-md">
                {targetLabel}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gains : +24.00 DH</span>
            </span>

            <button
              type="button"
              onClick={() => setIsOrderDetailOpen(true)}
              className="foodi-btn-secondary py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#FF5A00]" />
              <span>Détails commande</span>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
          <div className="w-full lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#0B1020]/8">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-[#7A8194] tracking-wider">Commande active</span>
                  <h3 className="text-lg font-black text-[#0B1020]">#{activeMission.id}</h3>
                </div>
                <span className="text-xs font-black text-[#FF5A00] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                  {isToShop ? "Point de retrait" : "Point de livraison"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0 border border-orange-100">
                    {isToShop ? <Building2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase text-[#7A8194]">
                      {isToShop ? "Restaurant partenaire" : "Client final"}
                    </span>
                    <h4 className="text-sm font-black text-[#0B1020]">{targetLabel}</h4>
                    <p className="text-xs text-[#7A8194] mt-0.5">
                      {isToShop ? "Avenue Hassan II, Agadir" : `${activeMission.street || activeMission.neighborhood} ${activeMission.buildingNameNumber ? `• ${activeMission.buildingNameNumber}` : ""}`}
                    </p>
                  </div>
                </div>

                {!isToShop && activeMission.instructions && (
                  <div className="text-amber-900 bg-amber-50 p-3.5 rounded-2xl border border-amber-200/60 font-semibold text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-black text-[11px] text-amber-800">Consigne de livraison :</strong>
                      <span>{activeMission.instructions}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={`tel:${isToShop ? "+212528840000" : "+212612345678"}`}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-orange-50 border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] hover:text-[#FF5A00] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-[#FF5A00]" />
                  <span>{isToShop ? "Appeler le restaurant" : "Appeler le client"}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsOrderDetailOpen(true)}
                  className="py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-zinc-100 border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Articles ({activeMission.items?.length || 1})</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-sm space-y-4">
              {missionPhase === "to_restaurant" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-[#0B1020]">Arrivée au restaurant</h4>
                    <p className="text-xs text-[#7A8194] mt-0.5">
                      Suivez le GPS. Dès votre arrivée chez {activeMission.restaurantName}, confirmez ci-dessous.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleArrivedAtRestaurant}
                    className="foodi-btn-primary w-full py-4 rounded-2xl text-sm font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Je suis arrivé chez {activeMission.restaurantName}</span>
                  </button>
                </div>
              )}

              {missionPhase === "at_restaurant" && (
                <form onSubmit={handleVerifyPickupCode} className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A00] bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block">
                      Sécurité commande
                    </span>
                    <h4 className="text-base font-black text-[#0B1020]">
                      Code de validation du colis (4 chiffres)
                    </h4>
                    <p className="text-xs text-[#7A8194]">
                      Demandez le code au restaurant ou lisez-le sur le ticket agrafé au sac :
                    </p>
                  </div>

                  <div className="flex items-center gap-3 max-w-sm mx-auto">
                    <input
                      type="text"
                      maxLength={4}
                      value={pickupCodeInput}
                      onChange={(e) => {
                        setPickupCodeInput(e.target.value.replace(/\D/g, ""));
                        setPickupCodeError("");
                      }}
                      placeholder="4829"
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#0B1020]/20 focus:border-[#FF5A00] text-center font-mono font-black text-2xl text-[#0B1020] tracking-widest outline-none bg-white shadow-2xs"
                    />
                    <button
                      type="submit"
                      className="foodi-btn-primary py-3.5 px-6 rounded-2xl text-xs font-black shrink-0 cursor-pointer shadow-md"
                    >
                      Valider
                    </button>
                  </div>

                  {pickupCodeError && (
                    <p className="text-xs text-rose-600 font-bold text-center">
                      {pickupCodeError}
                    </p>
                  )}

                  <div className="text-center">
                    <span
                      onClick={() => setPickupCodeInput("4829")}
                      className="text-xs text-[#7A8194] underline cursor-pointer hover:text-[#FF5A00]"
                    >
                      Code de test pour valider : <strong>4829</strong>
                    </span>
                  </div>
                </form>
              )}

              {missionPhase === "to_customer" && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                      Commande récupérée
                    </span>
                    <h4 className="text-base font-black text-[#0B1020]">
                      En route vers {activeMission.neighborhood}
                    </h4>
                    <p className="text-xs text-[#7A8194]">
                      Remettez le repas en main propre au client puis validez ci-dessous.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmDelivered}
                    className="w-full py-4 rounded-2xl text-sm font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirmer la livraison au client (+24.00 DH)</span>
                  </button>
                </div>
              )}

              {missionPhase === "delivered" && (
                <div className="py-6 text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="text-lg font-black text-[#0B1020]">
                    Course terminée avec succès !
                  </h4>
                  <p className="text-xs text-[#7A8194]">
                    +24.00 DH ont été crédités dans votre portefeuille. Retour en attente de commande...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0B1020]/8 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#0B1020]/8">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A00]">
                    Lancer la navigation externe
                  </span>
                  <h3 className="text-base font-black text-[#0B1020]">
                    Navigation virage par virage (GPS natif)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#7A8194]">Distance restante :</span>
                  <span className="text-xs font-black text-[#0B1020] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#0B1020]/6">
                    {isToShop ? "1.8 km (6 min)" : "2.8 km (11 min)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => openExternalGps("google", targetLat, targetLng)}
                  className="p-4 rounded-2xl border-2 border-[#0B1020]/10 hover:border-[#FF5A00] bg-[#FAF8F5] hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center gap-2 shadow-2xs active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0B1020] block">Google Maps</span>
                    <span className="text-[10px] text-[#7A8194]">Android & Web</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openExternalGps("waze", targetLat, targetLng)}
                  className="p-4 rounded-2xl border-2 border-[#0B1020]/10 hover:border-[#FF5A00] bg-[#FAF8F5] hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center gap-2 shadow-2xs active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0B1020] block">Waze</span>
                    <span className="text-[10px] text-[#7A8194]">Trafic en temps réel</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openExternalGps("apple", targetLat, targetLng)}
                  className="p-4 rounded-2xl border-2 border-[#0B1020]/10 hover:border-[#FF5A00] bg-[#FAF8F5] hover:bg-white text-center cursor-pointer transition-all flex flex-col items-center gap-2 shadow-2xs active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#0B1020] block">Plans (Apple)</span>
                    <span className="text-[10px] text-[#7A8194]">iPhone / iOS</span>
                  </div>
                </button>
              </div>

              <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-[#E8ECEF] border border-[#0B1020]/10 overflow-hidden shadow-inner flex items-center justify-center">
                <svg viewBox="0 0 600 400" className="w-full h-full object-cover">
                  <rect width="600" height="400" fill="#EAEFF5" />
                  
                  <path d="M0 60 Q200 40 400 90 T600 70" stroke="#FFFFFF" strokeWidth="20" fill="none" />
                  <path d="M50 0 L120 400" stroke="#FFFFFF" strokeWidth="16" fill="none" />
                  <path d="M300 0 L260 400" stroke="#FFFFFF" strokeWidth="22" fill="none" />
                  <path d="M480 0 L520 400" stroke="#FFFFFF" strokeWidth="18" fill="none" />
                  <path d="M0 220 L600 210" stroke="#FFFFFF" strokeWidth="24" fill="none" />
                  <path d="M0 330 Q300 350 600 310" stroke="#FFFFFF" strokeWidth="18" fill="none" />

                  <path d="M120 220 C180 220, 240 180, 280 140 S400 110, 480 90" stroke="#FF5A00" strokeWidth="8" strokeLinecap="round" strokeDasharray="10 8" fill="none" />

                  <g transform="translate(120, 220)">
                    <circle cx="0" cy="0" r="14" fill="#0B1020" />
                    <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
                    <text x="0" y="-18" textAnchor="middle" fill="#0B1020" fontSize="11" fontWeight="900">
                      {isToShop ? "Position Livreur" : "Restaurant"}
                    </text>
                  </g>

                  <g transform="translate(480, 90)">
                    <circle cx="0" cy="0" r="18" fill="#FF5A00" />
                    <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
                    <text x="0" y="-24" textAnchor="middle" fill="#FF5A00" fontSize="12" fontWeight="900">
                      {targetLabel}
                    </text>
                  </g>

                  <g transform="translate(260, 160)">
                    <circle cx="0" cy="0" r="12" fill="#FF5A00" className="animate-ping opacity-60" />
                    <circle cx="0" cy="0" r="10" fill="#FF5A00" />
                    <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
                  </g>
                </svg>

                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-md border border-[#0B1020]/10 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-[#0B1020]">Suivi temps réel Agadir</span>
                </div>

                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl shadow-md border border-[#0B1020]/10 text-right">
                  <span className="text-[10px] text-[#7A8194] uppercase font-bold block">Destination</span>
                  <span className="text-xs font-black text-[#FF5A00]">{targetLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {isOrderDetailOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              onClick={() => setIsOrderDetailOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            />
            <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#0B1020]/10 z-10 animate-in slide-in-from-bottom space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#0B1020]/8">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7A8194]">Fiche complète</span>
                    <h3 className="text-base font-black text-[#0B1020]">#{activeMission.id}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOrderDetailOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7A8194] hover:text-[#0B1020] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-black text-[#FF5A00]">Point de retrait</span>
                    <p className="font-bold text-[#0B1020] text-sm">{activeMission.restaurantName}</p>
                    <p className="text-[#7A8194]">Avenue Hassan II, Agadir</p>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-black text-emerald-600">Point de livraison</span>
                    <p className="font-bold text-[#0B1020] text-sm">{activeMission.neighborhood}</p>
                    <p className="text-[#7A8194]">{activeMission.street} {activeMission.buildingNameNumber}</p>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-black text-[#7A8194]">Articles à livrer</span>
                    <div className="space-y-1">
                      {activeMission.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between font-semibold text-[#0B1020]">
                          <span>{it.quantity}x {it.name}</span>
                          <span className="font-black">{it.price} DH</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOrderDetailOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#0B1020] text-white font-black text-xs hover:bg-[#18181B] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] font-sans text-[#0B1020] flex flex-col lg:flex-row">
      <aside className="hidden lg:flex w-[260px] xl:w-[280px] bg-[#18181B] text-white flex-col justify-between p-6 shrink-0 border-r border-zinc-800 min-h-screen">
        <div className="space-y-8">
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5A00] text-white flex items-center justify-center font-black text-xl shadow-md">
              F
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Foodi</span>
          </Link>

          <nav className="space-y-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("waiting")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === "waiting"
                  ? "bg-[#FF5A00] text-white font-black shadow-lg shadow-[#FF5A00]/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>En attente d'une commande</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("deliveries")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === "deliveries"
                  ? "bg-[#FF5A00] text-white font-black shadow-lg shadow-[#FF5A00]/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Mes livraisons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#FF5A00] text-white font-black shadow-lg shadow-[#FF5A00]/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Mon profil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#FF5A00] text-white font-black shadow-lg shadow-[#FF5A00]/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("help")}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                activeTab === "help"
                  ? "bg-[#FF5A00] text-white font-black shadow-lg shadow-[#FF5A00]/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Aide</span>
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`} />
                <span className="text-xs font-black text-white">
                  {isOnline ? "En ligne" : "Hors ligne"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${isOnline ? "bg-emerald-500" : "bg-zinc-700"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isOnline ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              {isOnline ? "Vous recevez les commandes" : "Passez en ligne pour recevoir"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOnboarded(false);
              localStorage.removeItem("foodi_driver_onboarded");
            }}
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-400 transition-colors cursor-pointer px-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="w-full px-6 lg:px-10 py-4 flex items-center justify-between border-b border-[#0B1020]/8 bg-white">
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5A00] text-white flex items-center justify-center font-black text-sm">
              F
            </div>
            <span className="text-xl font-black text-[#FF5A00]">Foodi</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#7A8194]">
            <span>Secteur de distribution :</span>
            <span className="font-black text-[#0B1020] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#0B1020]/6">
              Grand Agadir (Talborjt • Marina • Founty)
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="lg:hidden flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black text-emerald-700">En ligne</span>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${isOnline ? "bg-emerald-500" : "bg-zinc-300"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOnline ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-full bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#0B1020] shadow-2xs hover:bg-[#FAF8F5] cursor-pointer"
                title={soundEnabled ? "Alerte sonore activée" : "Alerte sonore désactivée"}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              </button>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#0B1020] text-white font-black text-sm flex items-center justify-center shadow-xs">
              {driverFirstName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute bottom-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-[#FF5A00]/10 rounded-tr-full blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-[#FF5A00]/10 rounded-tl-full blur-2xl" />

          {activeTab === "waiting" && (
            <div className="w-full max-w-2xl text-center space-y-8 animate-in fade-in duration-200 relative z-10">
              <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-96 h-48 border-t-2 border-dashed border-[#FF5A00]/40 rounded-t-full" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 relative flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                      <circle cx="100" cy="100" r="88" fill="#FFF3EA" />
                      <path d="M35 145 Q100 135 165 145" stroke="#FF5A00" strokeWidth="4" strokeDasharray="6 6" fill="none" />
                      <circle cx="48" cy="140" r="15" fill="#0B1020" />
                      <circle cx="48" cy="140" r="6" fill="#FFFFFF" />
                      <circle cx="152" cy="140" r="15" fill="#0B1020" />
                      <circle cx="152" cy="140" r="6" fill="#FFFFFF" />
                      <path d="M48 140 L80 140 L105 110 L135 110 L152 140" stroke="#FF5A00" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <path d="M125 110 L140 75 L155 75" stroke="#0B1020" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <circle cx="105" cy="65" r="15" fill="#FF5A00" />
                      <path d="M95 65 Q105 50 115 65" stroke="#FFFFFF" strokeWidth="3" fill="none" />
                      <rect x="75" y="80" width="26" height="30" rx="7" fill="#FF5A00" />
                      <text x="88" y="100" fill="#FFFFFF" fontSize="15" fontWeight="900" textAnchor="middle">F</text>
                    </svg>

                    <div className="absolute top-2 left-6 w-8 h-8 rounded-full bg-[#FF5A00] text-white flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="absolute top-8 right-6 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl font-black text-[#0B1020] tracking-tight">
                  En attente d'une commande...
                </h2>
                <p className="text-sm sm:text-base text-[#7A8194] font-medium">
                  Restez connecté, une commande arrivera bientôt !
                </p>
              </div>

              <div className="w-56 h-2 bg-[#FF5A00]/20 rounded-full mx-auto overflow-hidden">
                <div className="w-1/2 h-full bg-[#FF5A00] rounded-full animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white border border-[#0B1020]/8 shadow-sm text-xs font-bold text-[#3B4256]">
                <Clock className="w-4 h-4 text-[#FF5A00]" />
                <span>Nous vous notifierons dès qu'une commande est disponible</span>
                <Bell className="w-4 h-4 text-amber-500" />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateOffer}
                  className="py-3 px-5 rounded-2xl bg-white hover:bg-orange-50 border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] hover:text-[#FF5A00] shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#FF5A00]" />
                  <span>Tester l'alerte de commande entrante</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "deliveries" && (
            <div className="w-full max-w-5xl bg-white rounded-3xl p-6 lg:p-8 border border-[#0B1020]/8 shadow-sm space-y-6 animate-in fade-in relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#0B1020]/8">
                <div>
                  <h3 className="text-xl font-black text-[#0B1020]">Historique de vos livraisons</h3>
                  <p className="text-xs text-[#7A8194]">Total d'aujourd'hui : {todayEarnings} DH gagnés ({todayDeliveriesCount} courses)</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black">
                  <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Solde disponible : {1340 + todayEarnings} DH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 space-y-1">
                  <span className="text-xs font-bold text-[#7A8194]">Gains du jour</span>
                  <p className="text-2xl font-black text-emerald-600">+{todayEarnings}.00 DH</p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 space-y-1">
                  <span className="text-xs font-bold text-[#7A8194]">Courses terminées</span>
                  <p className="text-2xl font-black text-[#0B1020]">{todayDeliveriesCount}</p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 space-y-1">
                  <span className="text-xs font-bold text-[#7A8194]">Note satisfaction client</span>
                  <p className="text-2xl font-black text-[#FF5A00]">4.95 / 5 ★</p>
                </div>
              </div>

              <div className="divide-y divide-[#0B1020]/6 space-y-3 pt-2">
                {completedDeliveries.map((d) => (
                  <div key={d.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#0B1020] text-sm">{d.restaurantName}</span>
                          <span className="text-[10px] text-[#7A8194] font-mono">#{d.id}</span>
                        </div>
                        <p className="text-[#7A8194] text-xs">Vers {d.neighborhood} • Livré à {d.time} • {d.itemsCount} article(s)</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 text-base shrink-0">+{d.earned}.00 DH</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 lg:p-8 border border-[#0B1020]/8 shadow-sm space-y-6 animate-in fade-in relative z-10">
              <div className="flex items-center gap-4 pb-5 border-b border-[#0B1020]/8">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center font-black text-xl border border-[#FF5A00]/20 shadow-xs">
                  {driverFirstName[0]}{driverLastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#0B1020]">{driverFirstName} {driverLastName}</h3>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Coursier Vérifié
                    </span>
                  </div>
                  <p className="text-xs text-[#7A8194]">{driverPhone} • {vehBrand} {vehModel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl space-y-1">
                  <span className="text-[#7A8194] font-bold">Véhicule de livraison :</span>
                  <p className="font-black text-[#0B1020] text-sm">{vehBrand} {vehModel} ({vehEngine})</p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl space-y-1">
                  <span className="text-[#7A8194] font-bold">Immatriculation (Plaque) :</span>
                  <p className="font-mono font-black text-[#0B1020] text-sm">{vehPlate}</p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl space-y-1">
                  <span className="text-[#7A8194] font-bold">Zone principale :</span>
                  <p className="font-black text-[#0B1020] text-sm">Grand Agadir (Talborjt, Marina, Founty)</p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl space-y-1">
                  <span className="text-[#7A8194] font-bold">Statut permis et assurance :</span>
                  <p className="font-black text-emerald-600 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validé conforme</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 lg:p-8 border border-[#0B1020]/8 shadow-sm space-y-6 animate-in fade-in relative z-10">
              <div className="pb-4 border-b border-[#0B1020]/8">
                <h3 className="text-xl font-black text-[#0B1020]">Paramètres du compte coursier</h3>
                <p className="text-xs text-[#7A8194]">Configurez vos alertes, votre GPS par défaut et votre secteur.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-[#FAF8F5] p-4 rounded-2xl flex items-center justify-between border border-[#0B1020]/6">
                  <div>
                    <h4 className="font-black text-[#0B1020]">Sonnerie d'alerte des courses</h4>
                    <p className="text-[11px] text-[#7A8194]">Émettre un carillon sonore lors d'une nouvelle offre</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${soundEnabled ? "bg-emerald-500" : "bg-zinc-300"}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl space-y-2 border border-[#0B1020]/6">
                  <div>
                    <h4 className="font-black text-[#0B1020]">Application GPS par défaut</h4>
                    <p className="text-[11px] text-[#7A8194]">Choisissez l'application lancée automatiquement pour vos itinéraires</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {(["google", "waze", "apple"] as const).map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setDefaultGps(app)}
                        className={`py-3 px-4 rounded-xl border-2 font-bold text-xs capitalize cursor-pointer transition-all ${
                          defaultGps === app
                            ? "border-[#FF5A00] bg-orange-50 text-[#FF5A00]"
                            : "border-transparent bg-white text-[#0B1020]"
                        }`}
                      >
                        {app === "apple" ? "Apple Plans" : app === "google" ? "Google Maps" : "Waze"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 lg:p-8 border border-[#0B1020]/8 shadow-sm space-y-6 animate-in fade-in relative z-10">
              <div className="pb-4 border-b border-[#0B1020]/8">
                <h3 className="text-xl font-black text-[#0B1020]">Centre d'Assistance Foodi Coursier</h3>
                <p className="text-xs text-[#7A8194]">Équipe support dédiée disponible 7j/7 pour les livreurs en service.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#0B1020]/6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF5A00] flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#0B1020] text-sm">Ligne d'Urgence Coursier</h4>
                    <p className="text-[#7A8194] mt-0.5">En cas d'incident de livraison, panne ou question urgente :</p>
                  </div>
                  <a
                    href="tel:+212662102030"
                    className="inline-flex items-center gap-2 text-sm font-black text-[#FF5A00] hover:underline"
                  >
                    <span>+212 6 62 10 20 30</span>
                  </a>
                </div>

                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#0B1020]/6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-[#0B1020] text-sm">Dispatch & Centre Agadir</h4>
                    <p className="text-[#7A8194] mt-0.5">Bureau local Foodi : Avenue Hassan II, Centre-ville Agadir</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-600 block">Horaires : 10:00 - 02:00</span>
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="lg:hidden bg-white border-t border-[#0B1020]/8 px-6 py-2.5 flex items-center justify-around text-xs font-bold text-[#7A8194] sticky bottom-0 z-20">
          <button
            type="button"
            onClick={() => setActiveTab("waiting")}
            className={`flex flex-col items-center gap-1 py-1 px-4 ${activeTab === "waiting" ? "text-[#FF5A00]" : ""}`}
          >
            <Bike className="w-5 h-5" />
            <span>Accueil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deliveries")}
            className={`flex flex-col items-center gap-1 py-1 px-4 ${activeTab === "deliveries" ? "text-[#FF5A00]" : ""}`}
          >
            <PackageCheck className="w-5 h-5" />
            <span>Mes livraisons</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 py-1 px-4 ${activeTab === "profile" ? "text-[#FF5A00]" : ""}`}
          >
            <User className="w-5 h-5" />
            <span>Profil</span>
          </button>
        </div>
      </div>

      {incomingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in" />
          <div className="flex min-h-full items-end sm:items-center justify-center p-3 sm:p-4">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#0B1020]/10 z-10 animate-in slide-in-from-bottom duration-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-200">
                    <Bell className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0B1020]">Nouvelle commande !</h3>
                    <p className="text-xs text-[#7A8194] font-medium">Restaurant : {incomingOrder.restaurantName}</p>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] p-1 shrink-0 border border-[#0B1020]/10 overflow-hidden flex items-center justify-center">
                  <img
                    src={incomingOrder.restaurantLogo || "/images/restaurants/McDonalds.png"}
                    alt={incomingOrder.restaurantName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#FAF8F5] px-4 py-3 rounded-2xl border border-[#0B1020]/6 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#0B1020]">
                  <MapPin className="w-4 h-4 text-[#FF5A00]" />
                  <span>2.8 km</span>
                </div>
                <div className="h-3.5 w-px bg-[#0B1020]/10" />
                <div className="flex items-center gap-1.5 font-bold text-[#0B1020]">
                  <Clock className="w-4 h-4 text-[#FF5A00]" />
                  <span>≈ 12 min</span>
                </div>
                <div className="h-3.5 w-px bg-[#0B1020]/10" />
                <div className="font-black text-emerald-600 text-sm">
                  +24 DH
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDenyOrder}
                  className="py-3 px-4 rounded-2xl bg-[#F0F4F8] hover:bg-gray-200 text-[#7A8194] hover:text-[#0B1020] font-black text-xs cursor-pointer transition-colors"
                >
                  Refuser
                </button>

                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  className="foodi-btn-primary py-3 px-4 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>Accepter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;