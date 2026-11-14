import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Bike,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  X,
  CreditCard,
  History,
  Copy,
  Check,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Loader } from "../components/Loader";
import { OrderRecord, Restaurant } from "../types";
import { fetchOrders as loadOrdersFromApi, fetchRestaurants, getStoredRestaurants } from "../services/api";

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const cached = localStorage.getItem("foodi_cache_restaurants_all");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data?.length > 0) return parsed.data;
      }
    } catch {}
    return getStoredRestaurants();
  });
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const refreshOrders = async () => {
    try {
      const list = await loadOrdersFromApi();
      if (list && list.length > 0) {
        setOrders(list);
      }
    } catch (err) {
      console.warn("Could not refresh orders from API:", err);
    }
  };

  useEffect(() => {
    refreshOrders();
    fetchRestaurants().then((list) => {
      if (list && list.length > 0) setRestaurants(list);
    });
    const interval = setInterval(refreshOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const ongoingOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== "delivered" &&
        o.status !== "cancelled" &&
        o.status !== "rejected"
    );
  }, [orders]);

  const pastOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "delivered" ||
        o.status === "cancelled" ||
        o.status === "rejected"
    );
  }, [orders]);

  const getShopCover = (shopName: string, fallbackLogo?: string) => {
    const found = restaurants.find(
      (r) =>
        r.name.toLowerCase() === shopName.toLowerCase() ||
        shopName.toLowerCase().includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(shopName.toLowerCase())
    );
    if (found?.cover) return found.cover;
    return fallbackLogo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
  };

  const getShopSlug = (shopName: string) => {
    const found = restaurants.find(
      (r) =>
        r.name.toLowerCase() === shopName.toLowerCase() ||
        shopName.toLowerCase().includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(shopName.toLowerCase())
    );
    return found?.slug || "mcdonalds";
  };

  const handleCopyId = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return <Loader fullScreen message="Chargement de vos commandes..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16 font-sans text-[#0B1020]">
      <HomeHeader showBackButton />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#0B1020]/8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B1020] tracking-tight">
                Mes commandes
              </h1>
              {ongoingOrders.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-[#12A150] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-[#12A150] animate-ping" />
                  {ongoingOrders.length} en cours
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A8194] mt-0.5 font-medium">
              Suivi en direct de vos livraisons et historique complet
            </p>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto ${
              showHistory
                ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/20"
                : "bg-white text-[#0B1020] hover:bg-[#FFF3EA] hover:text-[#FF5A00] border border-[#0B1020]/8 shadow-xs"
            }`}
          >
            <History className="w-4 h-4 text-[#FF5A00]" />
            <span>Historique des commandes</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF5A00]/10 text-[#FF5A00]">
              {pastOrders.length}
            </span>
          </button>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-[#0B1020] flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF5A00]" />
              <span>Commandes en cours ({ongoingOrders.length})</span>
            </h2>
          </div>

          {ongoingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#0B1020]/8 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto ring-8 ring-[#FFF3EA]/50">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0B1020]">
                  Aucune commande en cours
                </h3>
                <p className="text-xs text-[#7A8194] max-w-sm mx-auto">
                  Toutes vos livraisons précédentes ont été terminées. Envie d'un bon repas ?
                </p>
              </div>
              <Link
                to="/restaurants"
                className="foodi-btn-primary inline-flex py-3 px-6 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 cursor-pointer"
              >
                <span>Découvrir les restaurants</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {ongoingOrders.map((ord) => {
                const coverImg = getShopCover(ord.restaurantName, ord.restaurantLogo);

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-3xl border border-[#0B1020]/8 shadow-sm overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="h-32 sm:h-44 w-full relative overflow-hidden bg-[#0B1020]">
                      <img
                        src={coverImg}
                        alt={ord.restaurantName}
                        className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase text-white bg-[#FF5A00] px-3 py-1 rounded-full shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {ord.statusLabel || "En préparation"}
                        </span>
                      </div>

                      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 text-right">
                        <span className="font-mono text-xs font-black text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 block">
                          {ord.id}
                        </span>
                        <span className="text-[10px] text-white/80 block mt-1">
                          {ord.date}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 right-4 z-10 flex items-end justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white shrink-0">
                            <img
                              src={ord.restaurantLogo}
                              alt={ord.restaurantName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                              }}
                            />
                          </div>
                          <div className="text-white">
                            <h3 className="text-lg sm:text-xl font-black drop-shadow-sm">
                              {ord.restaurantName}
                            </h3>
                            <p className="text-xs text-white/80 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#FF5A00]" />
                              <span>{ord.neighborhood}</span>
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:block text-right bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15">
                          <span className="text-[10px] text-white/80 uppercase font-bold block">
                            Arrivée estimée
                          </span>
                          <span className="text-sm font-black text-white">
                            ~{ord.arrivalTime || "20 min"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-xs font-black uppercase tracking-wider text-[#7A8194]">
                            Menu commandé
                          </span>
                          <span className="sm:hidden text-xs font-bold text-[#FF5A00]">
                            Arrivée : ~{ord.arrivalTime || "20 min"}
                          </span>
                        </div>

                        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                          {ord.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/6 flex items-center gap-3"
                            >
                              <img
                                src={item.image || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80"}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#0B1020]/6"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-xs text-[#0B1020] truncate">
                                  {item.name}
                                </h4>
                                <div className="flex items-center justify-between mt-1 text-[11px]">
                                  <span className="font-bold text-[#FF5A00] bg-white px-1.5 py-0.5 rounded border border-[#0B1020]/6">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-black text-[#0B1020]">
                                    {item.price * item.quantity} DH
                                  </span>
                                </div>
                                {item.options && (
                                  <p className="text-[10px] text-[#7A8194] truncate mt-0.5">
                                    {item.options}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="sm:hidden space-y-2 pt-1 divide-y divide-[#0B1020]/6">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center text-xs">
                              <span className="text-[#0B1020]">
                                <strong className="font-black text-[#FF5A00]">{item.quantity}x</strong> {item.name}
                                {item.options && (
                                  <span className="block text-[10px] text-[#7A8194]">
                                    {item.options}
                                  </span>
                                )}
                              </span>
                              <span className="font-black text-[#0B1020] shrink-0">
                                {item.price * item.quantity} DH
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#0B1020]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-[#7A8194] font-medium">Prix total :</span>
                            <span className="text-xl font-black text-[#FF5A00]">
                              {ord.total} DH
                            </span>
                            <span className="text-[11px] text-[#7A8194]">
                              ({ord.paymentLabel || "Carte bancaire"})
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A8194] truncate max-w-md">
                            Livraison à : <strong className="text-[#0B1020]" title={ord.address}>{ord.address.length > 10 ? ord.address.slice(0, 10) + "..." : ord.address}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {ord.token && (
                            <Link
                              to={`/track/${ord.token}`}
                              className="foodi-btn-primary w-full sm:w-auto py-3 px-5 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                            >
                              <Bike className="w-4 h-4" />
                              <span>Suivre en direct</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {showHistory && (
          <section className="space-y-4 pt-4 border-t border-[#0B1020]/8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0B1020] flex items-center gap-2">
                  <History className="w-5 h-5 text-[#0B1020]" />
                  <span>Historique des commandes ({pastOrders.length})</span>
                </h2>
                <p className="text-xs text-[#7A8194]">
                  Cliquez sur une commande pour afficher son récapitulatif complet
                </p>
              </div>
            </div>

            {pastOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 text-center text-xs text-[#7A8194]">
                Aucune commande passée dans l'historique.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastOrders.map((ord) => {
                  const isDelivered = ord.status === "delivered";

                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs hover:border-[#FF5A00]/40 transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#0B1020]/10 flex items-center justify-center shrink-0 bg-white shadow-xs">
                            <img
                              src={ord.restaurantLogo}
                              alt={ord.restaurantName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#0B1020] group-hover:text-[#FF5A00] transition-colors">
                              {ord.restaurantName}
                            </h4>
                            <p className="text-[11px] text-[#7A8194]">
                              {ord.deliveredAt || ord.date}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isDelivered
                              ? "text-[#12A150] bg-emerald-50 border-emerald-100"
                              : "text-red-600 bg-red-50 border-red-100"
                          }`}
                        >
                          {isDelivered ? "Livrée" : "Annulée"}
                        </span>
                      </div>

                      <div className="text-xs text-[#3B4256] line-clamp-2">
                        {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                      </div>

                      <div className="pt-2 border-t border-[#0B1020]/6 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#7A8194]">
                          {ord.id}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#0B1020]">
                            {ord.total} DH
                          </span>
                          <span className="text-[11px] font-bold text-[#FF5A00] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Détails <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-[#0B1020]/10 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="h-36 sm:h-44 w-full relative overflow-hidden bg-[#0B1020] shrink-0">
              <img
                src={getShopCover(selectedOrder.restaurantName, selectedOrder.restaurantLogo)}
                alt={selectedOrder.restaurantName}
                className="w-full h-full object-cover opacity-90"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Fermer"
                className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 z-10 flex items-end gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white shrink-0">
                  <img
                    src={selectedOrder.restaurantLogo}
                    alt={selectedOrder.restaurantName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/restaurants/McDonalds.png";
                    }}
                  />
                </div>
                <div className="text-white min-w-0">
                  <h3 className="text-lg font-black truncate drop-shadow-sm">
                    {selectedOrder.restaurantName}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {selectedOrder.neighborhood}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#0B1020]/6 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#7A8194] font-bold uppercase block">
                    Statut & Référence
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-black text-[#0B1020]">
                    <span>{selectedOrder.id}</span>
                    <button
                      onClick={() => handleCopyId(selectedOrder.id)}
                      className="p-1 rounded bg-white hover:text-[#FF5A00] transition-colors cursor-pointer border border-[#0B1020]/8"
                      title="Copier la référence"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-[#12A150]" /> : <Copy className="w-3 h-3 text-[#7A8194]" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#7A8194] font-bold uppercase block">
                    Livrée le
                  </span>
                  <span className="font-bold text-[#0B1020]">
                    {selectedOrder.deliveredAt || selectedOrder.date}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7A8194] block">
                  Votre commande
                </span>
                <div className="space-y-2 divide-y divide-[#0B1020]/6">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#0B1020]/8"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=200&q=80";
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#0B1020] truncate">
                            <span className="text-[#FF5A00] font-black mr-1">{item.quantity}x</span>
                            {item.name}
                          </p>
                          {item.options && (
                            <p className="text-[10px] text-[#7A8194] truncate">
                              {item.options}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="font-black text-[#0B1020] shrink-0">
                        {item.price * item.quantity} DH
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#0B1020]/8">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7A8194] block">
                  Récapitulatif & Paiement
                </span>
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#0B1020]/6 space-y-2">
                  <div className="flex justify-between text-[#7A8194]">
                    <span>Sous-total plats</span>
                    <span className="font-bold text-[#0B1020]">{selectedOrder.subtotal} DH</span>
                  </div>
                  <div className="flex justify-between text-[#7A8194]">
                    <span>Frais de livraison</span>
                    <span className="font-bold text-[#0B1020]">
                      {selectedOrder.deliveryFee === 0 ? "Gratuit" : `${selectedOrder.deliveryFee} DH`}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-[#0B1020]/6 flex justify-between items-baseline">
                    <span className="font-extrabold text-[#0B1020]">Total réglé</span>
                    <span className="text-base font-black text-[#FF5A00]">
                      {selectedOrder.total} DH
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] text-[#7A8194] flex items-center justify-between">
                    <span>Mode de règlement :</span>
                    <span className="font-bold text-[#0B1020]">{selectedOrder.paymentLabel || "Carte bancaire"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7A8194] block">
                  Adresse de livraison
                </span>
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#0B1020]/6 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF5A00] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-[#0B1020]">
                      {selectedOrder.neighborhood}
                      {selectedOrder.buildingNameNumber ? `, Bât. ${selectedOrder.buildingNameNumber}` : ""}
                      {selectedOrder.floorNumber ? `, Étage ${selectedOrder.floorNumber}` : ""}
                      {selectedOrder.doorNumber ? `, Porte ${selectedOrder.doorNumber}` : ""}
                    </p>
                    {selectedOrder.street && (
                      <p className="text-[11px] text-[#7A8194]">
                        {selectedOrder.street}
                      </p>
                    )}
                    {selectedOrder.instructions && (
                      <p className="text-[10px] text-[#3B4256] mt-1 bg-white px-2 py-0.5 rounded border border-[#0B1020]/6 inline-block font-semibold">
                        Consigne : {selectedOrder.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#0B1020]/8 bg-white flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-[#FAF8F5] hover:bg-[#eaeaea] text-[#0B1020] text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <Link
                to={`/restaurants/${getShopSlug(selectedOrder.restaurantName)}`}
                className="foodi-btn-primary py-2.5 px-5 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Commander à nouveau</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default OrdersPage;
