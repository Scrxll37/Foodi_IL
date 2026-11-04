import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Package,
  Bike,
  CheckCircle2,
  LogOut,
  Settings,
  Bell,
  Mail,
  Phone,
  ShieldCheck,
  Check,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Loader } from "../components/Loader";
import { useApp } from "../context/AppContext";
import ordersData from "../data/orders.json";
import { OrderRecord } from "../types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, address, saveAddress, updateProfile } = useApp();
  const [pageLoading, setPageLoading] = useState(true);

  const [name, setName] = useState(user.name || "Client Foodi");
  const [email, setEmail] = useState(user.email || "client@foodi.ma");
  const [phone, setPhone] = useState(user.phone || "+212 6 12 34 56 78");

  const [street, setStreet] = useState(address?.street || "Avenue Hassan II");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood || "Talborjt");
  const [building, setBuilding] = useState(address?.buildingNameNumber || "");
  const [floor, setFloor] = useState(address?.floorNumber || "");
  const [door, setDoor] = useState(address?.doorNumber || "");
  const [instructions, setInstructions] = useState(address?.instructions || "");

  const [notifyTracking, setNotifyTracking] = useState(user.notifyTracking ?? true);
  const [notifyPromos, setNotifyPromos] = useState(user.notifyPromos ?? false);
  const [notifyEmail, setNotifyEmail] = useState(user.notifyEmail ?? true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const [orders, setOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const remoteList: OrderRecord[] = await res.json();
          if (Array.isArray(remoteList) && remoteList.length > 0) {
            setOrders(remoteList);
            return;
          }
        }
      } catch {}

      try {
        const raw = localStorage.getItem("foodi_orders");
        const list = raw ? JSON.parse(raw) : ordersData;
        setOrders(list);
      } catch {
        setOrders(ordersData as OrderRecord[]);
      }
    }

    fetchOrders();
  }, []);

  useEffect(() => {
    setName(user.name || "Client Foodi");
    setEmail(user.email || "client@foodi.ma");
    setPhone(user.phone || "+212 6 12 34 56 78");
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile({
      name,
      email,
      phone,
      notifyTracking,
      notifyPromos,
      notifyEmail
    });

    if (address) {
      saveAddress({
        ...address,
        street,
        neighborhood,
        buildingNameNumber: building,
        floorNumber: floor,
        doorNumber: door,
        instructions
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  if (pageLoading) {
    return <Loader fullScreen message="Chargement de votre compte..." />;
  }

  const activeOrders = orders.filter((o) => o.status !== "delivered");

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader showBackButton />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 space-y-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center text-xl font-black shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#0B1020]">{user.name || "Client Foodi"}</h1>
                <span className="text-[10px] font-black uppercase text-[#12A150] bg-emerald-50 px-2 py-0.5 rounded-md">
                  Vérifié Agadir
                </span>
              </div>
              <p className="text-xs text-[#7A8194] mt-0.5 font-medium">
                {user.phone || "+212 6 12 34 56 78"} • {user.email || "client@foodi.ma"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/myaddress"
              className="foodi-btn-secondary py-2.5 px-4 text-xs font-extrabold"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
              <span>{address?.neighborhood || "Agadir"}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-10 px-3.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-[#0B1020]/8 pb-2">
          <Link
            to="/orders"
            className="px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer bg-white text-[#7A8194] hover:text-[#FF5A00] border border-[#0B1020]/6 hover:border-[#FF5A00]/30 shadow-xs"
          >
            <Package className="w-3.5 h-3.5 text-[#FF5A00]" />
            <span>Mes commandes</span>
            {activeOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FF5A00] text-white text-[10px] flex items-center justify-center font-black">
                {activeOrders.length}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-[#7A8194]" />
          </Link>

          <div className="px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/15">
            <Settings className="w-3.5 h-3.5" />
            <span>Paramètres utilisateur</span>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="bg-gradient-to-br from-[#0B1020] via-[#131A2E] to-[#1E293B] text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#12A150] animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-[#12A150]">
                  Commande en cours ({activeOrders.length})
                </span>
              </div>
              <span className="text-xs font-mono text-white/70">
                {activeOrders[0].id}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h3 className="text-lg font-black">{activeOrders[0].restaurantName}</h3>
                <p className="text-xs text-white/70">
                  Arrivée estimée : <strong className="text-white">~{activeOrders[0].arrivalTime || "20 min"}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeOrders[0].token && (
                  <Link
                    to={`/track/${activeOrders[0].token}`}
                    className="foodi-btn-primary py-2.5 px-4 text-xs font-black shadow-lg shadow-[#FF5A00]/30 flex items-center gap-1.5"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Suivre en direct</span>
                  </Link>
                )}
                <Link
                  to="/orders"
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Page commandes
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0B1020]">Suivi & Historique des commandes</h3>
              <p className="text-xs text-[#7A8194]">Consultez vos commandes en cours et vos récapitulatifs complets</p>
            </div>
          </div>
          <Link
            to="/orders"
            className="foodi-btn-primary py-2.5 px-5 text-xs font-black shadow-md shadow-[#FF5A00]/25 flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <span>Accéder aux commandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-[#12A150] shrink-0" />
                <span>Vos paramètres ont été mis à jour et enregistrés avec succès.</span>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#0B1020]/8">
                <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B1020]">Informations personnelles</h3>
                  <p className="text-[11px] text-[#7A8194]">Modifiez votre nom, email et téléphone</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="Votre nom"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Adresse e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="email@foodi.ma"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="+212 6..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0B1020]/8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0B1020]">Adresse de livraison principale</h3>
                    <p className="text-[11px] text-[#7A8194]">Agadir et quartiers environnants</p>
                  </div>
                </div>

                <Link
                  to="/myaddress"
                  className="text-xs font-black text-[#FF5A00] hover:underline flex items-center gap-1"
                >
                  <span>Éditeur sur carte</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Quartier à Agadir</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="Ex: Talborjt, Dakhla, Sonaba..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Rue / Boulevard</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="Nom de la rue"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Nom ou Numéro Bâtiment</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="Ex: Résidence Fleurie B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Étage</label>
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                      placeholder="Ex: 3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-[#0B1020] block">Porte / N°</label>
                    <input
                      type="text"
                      value={door}
                      onChange={(e) => setDoor(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                      placeholder="Ex: 12"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="font-extrabold text-[#0B1020] block">Instructions pour le livreur</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] outline-none font-semibold text-[#0B1020]"
                    placeholder="Sonner à l'interphone, code portail, etc."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#0B1020]/8">
                <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B1020]">Préférences de notifications</h3>
                  <p className="text-[11px] text-[#7A8194]">Choisissez les alertes que vous souhaitez recevoir</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/4 cursor-pointer hover:bg-[#FAF8F5]/80">
                  <div className="space-y-0.5">
                    <span className="font-black text-[#0B1020] block">Suivi de commande par SMS & Push</span>
                    <span className="text-[11px] text-[#7A8194]">Alertes en direct lors des étapes de cuisson et d'arrivée du coursier</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyTracking}
                    onChange={(e) => setNotifyTracking(e.target.checked)}
                    className="w-4 h-4 text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/4 cursor-pointer hover:bg-[#FAF8F5]/80">
                  <div className="space-y-0.5">
                    <span className="font-black text-[#0B1020] block">Promotions et codes promo partenaires</span>
                    <span className="text-[11px] text-[#7A8194]">Bons d'achat et réductions exclusives des restaurants d'Agadir</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyPromos}
                    onChange={(e) => setNotifyPromos(e.target.checked)}
                    className="w-4 h-4 text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/4 cursor-pointer hover:bg-[#FAF8F5]/80">
                  <div className="space-y-0.5">
                    <span className="font-black text-[#0B1020] block">Reçus et factures par e-mail</span>
                    <span className="text-[11px] text-[#7A8194]">Confirmation détaillée de chaque commande terminée</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="foodi-btn-primary py-3 px-8 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/25 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </form>
      </main>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};