import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  MapPin,
  ChefHat,
  Bike,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Banknote,
  ShieldCheck,
  ChevronRight,
  CreditCard,
  Check,
  Copy,
  Home
} from "lucide-react";
import { useApp } from "../context/AppContext";
import restaurantsData from "../data/restaurants.json";
import ordersData from "../data/orders.json";
import { Restaurant } from "../types";
import { HomeHeader } from "../components/HomeHeader";

export const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, address, clearCart, user } = useApp();

  const [pageLoading, setPageLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchPhase, setSearchPhase] = useState<number>(1);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const currentRestaurant = useMemo(() => {
    if (cart.length === 0) return null;
    const first = cart[0];
    return (restaurantsData as Restaurant[]).find(
      (r) => r.id === first.restaurantId || r.name.toLowerCase() === first.restaurantName.toLowerCase()
    );
  }, [cart]);

  const userLat = address?.lat || 30.4278;
  const userLng = address?.lng || -9.5981;

  const haversineDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  };

  const closestBranch = useMemo(() => {
    if (!currentRestaurant) return null;
    if (currentRestaurant.branches && currentRestaurant.branches.length > 0) {
      const sorted = [...currentRestaurant.branches].sort((a, b) => {
        const distA = haversineDist(userLat, userLng, a.lat, a.lng);
        const distB = haversineDist(userLat, userLng, b.lat, b.lng);
        return distA - distB;
      });
      return sorted[0];
    }
    return {
      id: currentRestaurant.id,
      name: currentRestaurant.name,
      neighborhood: currentRestaurant.neighborhood || "Agadir",
      address: currentRestaurant.address || "Agadir",
      lat: currentRestaurant.lat || 30.412495,
      lng: currentRestaurant.lng || -9.595213
    };
  }, [currentRestaurant, userLat, userLng]);

  const deliveryFee =
    cart.length > 0
      ? currentRestaurant
        ? Number(currentRestaurant.deliveryFee ?? 0)
        : 12
      : 0;

  const grandTotal = cartTotal + deliveryFee;

  const { distanceKm, cookingTime, travelTime, totalTime, arrivalTime, maxTime } = useMemo(() => {
    const shopLat = closestBranch?.lat || currentRestaurant?.lat || 30.412495;
    const shopLng = closestBranch?.lng || currentRestaurant?.lng || -9.595213;

    const dist = Math.max(1.1, haversineDist(userLat, userLng, shopLat, shopLng));
    const itemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
    const cook = Math.min(25, 10 + Math.min(itemsCount * 2, 8));
    const travel = Math.max(7, Math.round(dist * 3.2));
    const total = cook + travel;

    const now = new Date();
    now.setMinutes(now.getMinutes() + total);

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const maxNow = new Date(now);
    maxNow.setMinutes(maxNow.getMinutes() + 15);

    const maxHours = String(maxNow.getHours()).padStart(2, "0");
    const maxMinutes = String(maxNow.getMinutes()).padStart(2, "0");

    return {
      distanceKm: dist,
      cookingTime: cook,
      travelTime: travel,
      totalTime: total,
      arrivalTime: `${hours}:${minutes}`,
      maxTime: `${maxHours}:${maxMinutes}`
    };
}, [closestBranch, currentRestaurant, userLat, userLng, cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isPlacingOrder || !closestBranch) return;

    setIsPlacingOrder(true);
    setSearchPhase(1);

    const uniqueToken =
      "trk_" +
      Math.random().toString(36).substring(2, 9) +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 6);

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString("fr-FR", {
      month: "long"
    })} ${now.getFullYear()} à ${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const shopLat = closestBranch.lat;
    const shopLng = closestBranch.lng;
    const startLat = shopLat - 0.0055;
    const startLng = shopLng + 0.0045;

    const newOrder = {
      id: `CMD-AGD-${Math.floor(1000 + Math.random() * 9000)}`,
      token: uniqueToken,
      restaurantName: currentRestaurant?.name || closestBranch.name,
      restaurantLogo: currentRestaurant?.logo || "/images/restaurants/McDonalds.png",
      neighborhood: address?.neighborhood || "Agadir",
      buildingNameNumber: address?.buildingNameNumber || "",
      floorNumber: address?.floorNumber || "",
      doorNumber: address?.doorNumber || "",
      street: address?.street || "",
      date: formattedDate,
      status: "pending_confirmation" as const,
      statusLabel: "Commande envoyée, en attente de confirmation",
      cookingTime: cookingTime,
      travelTime: travelTime,
      totalTime: totalTime,
      arrivalTime: arrivalTime,
      maxTime: maxTime,
      
      courierName: "Amine Tazi",
      courierPhone: "+212 6 62 10 20 30",
      shopLat: shopLat,
      shopLng: shopLng,
      courierLat: startLat,
      courierLng: startLng,
      paymentMethod: paymentMethod,
      paymentLabel: paymentMethod === "card" ? "Mastercard •••• 4289" : "Espèces à la livraison",
      items: cart.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        options: it.selectedOptions ? Object.values(it.selectedOptions).filter(Boolean).join(", ") : "",
        image: it.image
      })),
      subtotal: cartTotal,
      deliveryFee: deliveryFee,
      total: grandTotal,
      address: `${address?.neighborhood || "Talborjt"}, ${address?.street || "Avenue Hassan II"}${
        address?.buildingNameNumber ? `, ${address.buildingNameNumber}` : ""
      }${address?.floorNumber ? `, Étage ${address.floorNumber}` : ""}${
        address?.doorNumber ? `, Porte ${address.doorNumber}` : ""
      }`,
      instructions: address?.instructions || "Sonner à l'interphone",
      lat: userLat,
      lng: userLng,
      createdAt: Date.now()
    };

    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder)
      });
    } catch {}

    try {
      const existingRaw = localStorage.getItem("foodi_orders");
      const existing = existingRaw ? JSON.parse(existingRaw) : ordersData;
      const updated = [newOrder, ...existing.filter((o: any) => o.id !== newOrder.id && o.token !== uniqueToken)];
      localStorage.setItem("foodi_orders", JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setSearchPhase(2);
    }, 2400);

    setTimeout(() => {
      setSearchPhase(3);
    }, 4800);

    setTimeout(() => {
      clearCart();
      setIsPlacingOrder(false);
      setConfirmedOrder(newOrder);
    }, 7000);
  };

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-3 border-[#FF5A00]/20 border-t-[#FF5A00] animate-spin" />
          <div className="absolute w-7 h-7 rounded-full bg-[#FFF3EA] flex items-center justify-center text-[#FF5A00]">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-xs font-black text-[#0B1020] tracking-wider uppercase">
          Chargement de votre commande...
        </p>
      </div>
    );
  }

  if (isPlacingOrder) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center items-center p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#0B1020]/8 shadow-sm text-center space-y-6">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            {searchPhase === 1 && (
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF5A00]/30 shadow-md flex items-center justify-center bg-white">
                  <img
                    src={currentRestaurant?.logo || "/images/restaurants/McDonalds.png"}
                    alt="Restaurant"
                    className="w-full h-full object-cover animate-pulse-gentle"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF5A00] text-white flex items-center justify-center shadow-md">
                  <ChefHat className="w-4 h-4" />
                </div>
              </div>
            )}

            {searchPhase === 2 && (
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-[#FF5A00]/20 animate-radar-1" />
                <div className="absolute w-24 h-24 rounded-full bg-[#FF5A00]/20 animate-radar-2" />
                <div className="w-20 h-20 rounded-full bg-[#FF5A00] text-white flex items-center justify-center shadow-lg z-10">
                  <Bike className="w-9 h-9" />
                </div>
              </div>
            )}

            {searchPhase === 3 && (
              <div className="relative flex items-center justify-center">
                <div className="w-22 h-22 rounded-full bg-emerald-50 border-2 border-emerald-200 text-[#12A150] flex items-center justify-center shadow-md animate-pulse-gentle">
                  <ShieldCheck className="w-11 h-11" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF5A00] bg-[#FFF3EA] px-3 py-1 rounded-full border border-[#FF5A00]/15 inline-block">
              {searchPhase === 1
                ? "Étape 1 sur 3 • Établissement"
                : searchPhase === 2
                ? "Étape 2 sur 3 • Coursier Foodi"
                : "Étape 3 sur 3 • Confirmation"}
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-[#0B1020]">
              {searchPhase === 1
                ? `Transmission à ${currentRestaurant?.name || closestBranch?.name}...`
                : searchPhase === 2
                ? "Recherche d'un livreur à proximité..."
                : "Attribution et sécurisation de la commande..."}
            </h2>

            <p className="text-xs text-[#7A8194] leading-relaxed">
              {searchPhase === 1
                ? "Vérification des disponibilités des plats et transmission directe en cuisine."
                : searchPhase === 2
                ? "Localisation en temps réel du coursier le plus proche pour une livraison express."
                : "Finalisation du paiement sécurisé et validation du créneau de livraison."}
            </p>
          </div>

          <div className="w-full bg-[#0B1020]/6 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF5A00] transition-all duration-700 ease-out rounded-full"
              style={{
                width: searchPhase === 1 ? "35%" : searchPhase === 2 ? "70%" : "100%"
              }}
            />
          </div>

          <div className="pt-2 text-[11px] text-[#7A8194] flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF5A00] animate-ping" />
            <span>Vérification automatique en cours (7s)...</span>
          </div>
        </div>
      </div>
    );
  }

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-center items-center p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#0B1020]/8 shadow-sm text-center space-y-6 animate-entrance-slide-up">
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

          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#12A150] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
              Commande validée avec succès
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1020]">
              Merci pour votre commande !
            </h1>
            <p className="text-xs text-[#7A8194] leading-relaxed">
              Votre commande est confirmée et transmise à l'établissement. Vous pouvez suivre l'avancement en direct.
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#0B1020]/6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#0B1020]/10 flex items-center justify-center shrink-0 shadow-xs bg-white">
                  <img
                    src={confirmedOrder.restaurantLogo}
                    alt={confirmedOrder.restaurantName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                    }}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8194] font-bold block uppercase">Restaurant</span>
                  <span className="font-extrabold text-[#0B1020] text-sm">{confirmedOrder.restaurantName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#7A8194] font-bold block uppercase">Référence</span>
                <div className="flex items-center gap-1.5 font-mono font-black text-[#0B1020]">
                  <span>{confirmedOrder.id}</span>
                
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#FF5A00] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#7A8194] font-bold block uppercase">Arrivée estimée</span>
                  <span className="font-black text-[#0B1020]">
                    {confirmedOrder.arrivalTime} - {confirmedOrder.maxTime}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 text-[#12A150] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-[#7A8194] font-bold block uppercase">Total réglé</span>
                  <span className="font-black text-[#FF5A00] text-sm">
                    {confirmedOrder.total} DH
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-[#0B1020]/6">
              <MapPin className="w-4 h-4 text-[#FF5A00] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#7A8194] font-bold block uppercase">Adresse de livraison</span>
                <p className="text-[#0B1020] font-black text-xs leading-snug" title={confirmedOrder.neighborhood}>
                  {confirmedOrder.neighborhood.length > 10 ? confirmedOrder.neighborhood.slice(0, 10) + "..." : confirmedOrder.neighborhood}
                </p>
               
                
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <Link
              to={`/track/${confirmedOrder.token}`}
              className="foodi-btn-primary w-full py-4 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-[#FF5A00]/30 flex items-center justify-center gap-2 cursor-pointer transition-all animate-cta-glow"
            >
              <Bike className="w-4 h-4" />
              <span>Suivre ma commande en direct</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="w-full py-3 rounded-2xl text-xs font-bold text-[#7A8194] hover:text-[#0B1020] transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-md mx-auto my-auto p-8 text-center space-y-4 bg-white rounded-3xl border border-[#0B1020]/8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto ring-8 ring-[#FFF3EA]/60">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#0B1020]">Votre panier est vide</h1>
          <p className="text-xs text-[#7A8194]">
            Ajoutez d'abord quelques délices depuis nos restaurants partenaires d'Agadir avant de valider votre commande.
          </p>
          <Link
            to="/restaurants"
            className="foodi-btn-primary inline-flex py-3 px-6 rounded-2xl text-xs font-black shadow-md cursor-pointer"
          >
            Découvrir les restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col font-sans">
      <HomeHeader title="Validation" showBackButton />

      <main className="max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-13 h-13 rounded-2xl bg-white border border-[#0B1020]/10 p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={currentRestaurant?.logo || "/images/restaurants/McDonalds.png"}
                      alt={currentRestaurant?.name || "Restaurant"}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#0B1020] truncate">
                        {currentRestaurant?.name || cart[0]?.restaurantName}
                      </h2>
                      <span className="text-[10px] font-black uppercase text-[#12A150] bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                        Partenaire certifié
                      </span>
                    </div>
                    <p className="text-xs text-[#7A8194] truncate">
                      {currentRestaurant?.cuisine || "Cuisine gastronomique & rapide"} • Agadir
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black text-[#FF5A00] bg-[#FFF3EA] px-3 py-1 rounded-xl shrink-0">
                  {cart.length} {cart.length > 1 ? "plats" : "plat"}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-2xl bg-[#FAF8F5]/80 hover:bg-[#FAF8F5] transition-colors border border-[#0B1020]/4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-[#0B1020]/6"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
                        }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-xs sm:text-sm text-[#0B1020] truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-[#7A8194]">
                          <strong className="text-[#FF5A00] font-black">{item.quantity}x</strong> {item.price} DH
                        </p>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-[10px] text-[#3B4256] font-semibold truncate">
                            {Object.values(item.selectedOptions).filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-xs sm:text-sm font-black text-[#0B1020] shrink-0">
                      {item.price * item.quantity} DH
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#0B1020]/8">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B1020]">
                    Adresse de livraison
                  </h3>
                </div>

                <Link
                  to="/myaddress"
                  className="text-xs font-black text-[#FF5A00] hover:underline flex items-center gap-0.5"
                >
                  <span>Modifier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-black text-sm text-[#0B1020]" title={address?.neighborhood || "Agadir"}>
                  {(address?.neighborhood || "Talborjt").length > 10 ? (address?.neighborhood || "Talborjt").slice(0, 10) + "..." : (address?.neighborhood || "Talborjt")}
                </p>
                <p className="text-[#7A8194] font-medium">
                  {address?.buildingNameNumber ? `Bâtiment ${address.buildingNameNumber} • ` : ""}
                  {address?.floorNumber ? `Étage ${address.floorNumber} • ` : ""}
                  {address?.doorNumber ? `Porte ${address.doorNumber}` : ""}
                </p>
                {address?.instructions && (
                  <p className="text-[11px] text-[#3B4256] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#0B1020]/4 mt-1.5">
                    <strong className="text-[#0B1020]">Instructions livreur :</strong> {address.instructions}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#0B1020]/8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A8194] font-bold uppercase tracking-wider block">
                      Livraison estimée
                    </span>
                    <span className="text-lg font-black text-[#FF5A00]">
                      ~{arrivalTime}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-black text-[#12A150] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A150] animate-ping" />
                  {totalTime} min au total
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#0B1020]/4 flex items-center gap-2.5">
                  <ChefHat className="w-4 h-4 text-[#FF5A00] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#7A8194] font-bold block uppercase">
                      Cuisine
                    </span>
                    <span className="font-black text-xs text-[#0B1020]">~{cookingTime} min</span>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#0B1020]/4 flex items-center gap-2.5">
                  <Bike className="w-4 h-4 text-[#12A150] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#7A8194] font-bold block uppercase">
                      Trajet ({distanceKm} km)
                    </span>
                    <span className="font-black text-xs text-[#0B1020]">~{travelTime} min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#0B1020]/8">
                <span className="text-xs font-black uppercase tracking-wider text-[#0B1020]">
                  Mode de règlement
                </span>
                <span className="text-[11px] font-bold text-[#7A8194]">Sélectionnez</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    paymentMethod === "card"
                      ? "bg-[#FFF3EA] border-[#FF5A00] shadow-xs"
                      : "bg-[#FAF8F5] border-[#0B1020]/6 hover:bg-[#FAF8F5]/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <CreditCard className={`w-4 h-4 ${paymentMethod === "card" ? "text-[#FF5A00]" : "text-[#7A8194]"}`} />
                    {paymentMethod === "card" && <Check className="w-3.5 h-3.5 text-[#FF5A00]" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block text-[#0B1020]">Carte bancaire</span>
                    <span className="text-[10px] text-[#7A8194]">Mastercard</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    paymentMethod === "cash"
                      ? "bg-emerald-50 border-[#12A150] shadow-xs"
                      : "bg-[#FAF8F5] border-[#0B1020]/6 hover:bg-[#FAF8F5]/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Banknote className={`w-4 h-4 ${paymentMethod === "cash" ? "text-[#12A150]" : "text-[#7A8194]"}`} />
                    {paymentMethod === "cash" && <Check className="w-3.5 h-3.5 text-[#12A150]" />}
                  </div>
                  <div>
                    <span className="text-xs font-black block text-[#0B1020]">Espèces</span>
                    <span className="text-[10px] text-[#7A8194]">À la livraison</span>
                  </div>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className="p-3.5 rounded-2xl bg-[#0B1020] text-white border border-[#0B1020] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] -ml-2 opacity-90"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider ml-1 text-white/90">
                        mastercard
                      </span>
                    </div>

                    <span className="text-[9px] font-black uppercase tracking-wider text-[#12A150] bg-white/10 px-2 py-0.5 rounded-full">
                      Enregistrée
                    </span>
                  </div>

                  <span className="text-sm font-mono tracking-widest block text-white font-extrabold">
                    •••• •••• •••• 4289
                  </span>

                  <div className="flex items-center justify-between text-[10px] text-white/70 pt-1 border-t border-white/10">
                    <span className="font-bold text-white uppercase">{user?.name || "Client Foodi"}</span>
                    <span className="font-bold text-white">08 / 28</span>
                  </div>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/6 flex items-center gap-2.5 text-xs">
                  <Banknote className="w-4 h-4 text-[#12A150] shrink-0" />
                  <span className="text-[11px] text-[#7A8194]">Réglez directement le livreur lors de la réception.</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#0B1020]/8 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7A8194] font-semibold">
                  <span>Sous-total plats</span>
                  <span className="text-[#0B1020] font-black">{cartTotal} DH</span>
                </div>

                <div className="flex justify-between text-[#7A8194] font-semibold">
                  <span>Frais de livraison</span>
                  {deliveryFee === 0 ? (
                    <span className="text-[#12A150] font-black">Gratuit</span>
                  ) : (
                    <span className="text-[#0B1020] font-black">{deliveryFee} DH</span>
                  )}
                </div>

                <div className="pt-2 border-t border-[#0B1020]/8 flex items-baseline justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#0B1020]">
                    Total net à régler
                  </span>
                  <span className="text-2xl font-black text-[#FF5A00] tracking-tight">
                    {grandTotal} DH
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="foodi-btn-primary w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed"
                >
                  <span>Confirmer et commander</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmationPage;
