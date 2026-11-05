import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Bike,
  LogOut,
  Bell,
  Mail,
  Phone,
  ShieldCheck,
  Check,
  CheckCheck,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Sliders,
  ChevronRight,
  Edit3,
  Lock
} from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Loader } from "../components/Loader";
import { EmailChangeModal } from "../components/EmailChangeModal";
import { useApp } from "../context/AppContext";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, address, updateProfile, notifications, markNotificationRead } = useApp();
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "address" | "preferences">("profile");

  const [name, setName] = useState(user.name || "Client Foodi");
  const [email, setEmail] = useState(user.email || "client@foodi.ma");
  const [phone, setPhone] = useState(user.phone || "+212 6 12 34 56 78");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [notifyTracking, setNotifyTracking] = useState(user.notifyTracking ?? true);
  const [notifyPromos, setNotifyPromos] = useState(user.notifyPromos ?? false);
  const [notifyEmail, setNotifyEmail] = useState(user.notifyEmail ?? true);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 200);
    return () => clearTimeout(timer);
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

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile({
      name,
      phone
    });

    setIsEditingInfo(false);
    setSuccessMessage("Vos informations personnelles ont été mises à jour avec succès.");
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleCancelEdit = () => {
    setName(user.name || "Client Foodi");
    setPhone(user.phone || "+212 6 12 34 56 78");
    setIsEditingInfo(false);
  };

  const handleEmailSuccess = (newEmail: string) => {
    updateProfile({ email: newEmail });
    setEmail(newEmail);
    setSuccessMessage(`Votre adresse e-mail a été modifiée avec succès (${newEmail}).`);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile({
      notifyTracking,
      notifyPromos,
      notifyEmail
    });

    setSuccessMessage("Vos préférences d'alertes ont été enregistrées avec succès.");
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.isRead) markNotificationRead(n.id);
    });
  };

  if (pageLoading) {
    return <Loader fullScreen message="Chargement de votre compte..." />;
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const userInitials = (user.name || "Client Foodi")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16 font-sans text-[#0B1020]">
      <HomeHeader title="Mon compte" showBackButton />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 space-y-6">
        <div className="md:hidden bg-white rounded-3xl p-4 border border-[#0B1020]/8 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center font-black text-sm shrink-0 border border-[#FF5A00]/15">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-[#0B1020] truncate">
                  {user.name || "Client Foodi"}
                </h1>
                <span className="text-[9px] font-black uppercase text-[#12A150] bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                  Agadir
                </span>
              </div>
              <p className="text-[11px] text-[#7A8194] truncate">
                {user.phone || "+212 6 12 34 56 78"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Déconnexion"
            className="w-9 h-9 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-red-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "profile"
                ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/20"
                : "bg-white text-[#7A8194] border border-[#0B1020]/8"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mon Profil</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "notifications"
                ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/20"
                : "bg-white text-[#7A8194] border border-[#0B1020]/8"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF5A00] text-white text-[9px] flex items-center justify-center font-black">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("address")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "address"
                ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/20"
                : "bg-white text-[#7A8194] border border-[#0B1020]/8"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Mon Adresse</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "preferences"
                ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/20"
                : "bg-white text-[#7A8194] border border-[#0B1020]/8"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Préférences</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="hidden md:block lg:col-span-4 xl:col-span-3.5 space-y-4 sticky top-24">
            <div className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs space-y-4">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#0B1020]/8">
                <div className="w-13 h-13 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center text-base font-black shrink-0 border border-[#FF5A00]/20 shadow-xs">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-[#0B1020] truncate">
                      {user.name || "Client Foodi"}
                    </h2>
                    <span className="text-[9px] font-black uppercase text-[#12A150] bg-emerald-50 px-1.5 py-0.5 rounded">
                      Agadir
                    </span>
                  </div>
                  <p className="text-xs text-[#7A8194] truncate mt-0.5">
                    {user.phone || "+212 6 12 34 56 78"}
                  </p>
                </div>
              </div>

              <nav className="space-y-1.5 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/15"
                      : "text-[#7A8194] hover:bg-[#FAF8F5] hover:text-[#0B1020]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#FF5A00]" />
                    <span>Mon Profil</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "profile" ? "text-white" : "text-[#7A8194]"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("address")}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    activeTab === "address"
                      ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/15"
                      : "text-[#7A8194] hover:bg-[#FAF8F5] hover:text-[#0B1020]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#FF5A00]" />
                    <span>Mon Adresse</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "address" ? "text-white" : "text-[#7A8194]"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                    activeTab === "preferences"
                      ? "bg-[#0B1020] text-white shadow-md shadow-[#0B1020]/15"
                      : "text-[#7A8194] hover:bg-[#FAF8F5] hover:text-[#0B1020]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#FF5A00]" />
                    <span>Préférences</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "preferences" ? "text-white" : "text-[#7A8194]"}`} />
                </button>
              </nav>

              <div className="pt-3 border-t border-[#0B1020]/8">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-red-100 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8 xl:col-span-8.5 space-y-5">
            {savedSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-[#12A150] shrink-0" />
                <span>{successMessage || "Vos informations ont été mises à jour avec succès."}</span>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-5">
                <form onSubmit={handleSaveInfo} className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#0B1020]">Informations personnelles</h3>
                        <p className="text-[11px] text-[#7A8194]">Nom et numéro de téléphone pour vos livraisons</p>
                      </div>
                    </div>

                    {!isEditingInfo && (
                      <button
                        type="button"
                        onClick={() => setIsEditingInfo(true)}
                        className="self-start sm:self-auto foodi-btn-secondary py-1.5 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#FF5A00]" />
                        <span>Modifier mes informations</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-[#0B1020] block">Nom complet</label>
                      <input
                        type="text"
                        value={name}
                        disabled={!isEditingInfo}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-semibold transition-all ${
                          isEditingInfo
                            ? "border-[#FF5A00] bg-white ring-2 ring-[#FF5A00]/15 text-[#0B1020]"
                            : "border-[#0B1020]/10 bg-[#FAF8F5] text-[#3B4256] cursor-not-allowed"
                        }`}
                        placeholder="Votre nom"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-extrabold text-[#0B1020] block">Numéro de téléphone</label>
                      <input
                        type="tel"
                        value={phone}
                        disabled={!isEditingInfo}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-semibold transition-all ${
                          isEditingInfo
                            ? "border-[#FF5A00] bg-white ring-2 ring-[#FF5A00]/15 text-[#0B1020]"
                            : "border-[#0B1020]/10 bg-[#FAF8F5] text-[#3B4256] cursor-not-allowed"
                        }`}
                        placeholder="+212 6..."
                      />
                    </div>
                  </div>

                  {isEditingInfo && (
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#0B1020]/6">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="py-2 px-4 rounded-xl border border-[#0B1020]/15 text-xs font-bold text-[#7A8194] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="foodi-btn-primary py-2 px-5 rounded-xl text-xs font-black shadow-md shadow-[#FF5A00]/25 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  )}
                </form>

                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#0B1020]">Adresse e-mail du compte</h3>
                        <p className="text-[11px] text-[#7A8194]">Validation par code de sécurité obligatoire</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(true)}
                      className="self-start sm:self-auto foodi-btn-secondary py-1.5 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#FF5A00]" />
                      <span>Modifier l'adresse e-mail</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#0B1020]/6">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#12A150] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-[#0B1020] truncate">{email}</p>
                          <span className="text-[9px] font-black uppercase text-[#12A150] bg-emerald-100/60 px-1.5 py-0.2 rounded shrink-0">
                            Vérifié
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A8194] truncate">
                          Reçus de paiement et suivi de commande
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(true)}
                      className="text-xs font-extrabold text-[#FF5A00] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <span>Changer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#12A150] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-[#0B1020]">Compte client sécurisé</h4>
                      <p className="text-[11px] text-[#7A8194]">Données protégées et livraisons assurées sur le Grand Agadir</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#0B1020]">Centre de notifications</h3>
                      <p className="text-[11px] text-[#7A8194]">Suivi des livraisons, alertes et promotions</p>
                    </div>
                  </div>

                  {unreadNotificationsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-extrabold text-[#FF5A00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tout marquer lu</span>
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Bell className="w-10 h-10 text-[#7A8194]/40 mx-auto" />
                    <p className="text-xs font-bold text-[#7A8194]">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 divide-y divide-[#0B1020]/6">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.isRead ? "bg-[#FFF3EA]/40 border border-[#FF5A00]/15" : "hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === "order"
                              ? "bg-[#FFF3EA] text-[#FF5A00]"
                              : n.type === "promo"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {n.type === "order" ? (
                            <Bike className="w-4 h-4" />
                          ) : n.type === "promo" ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-[#0B1020] truncate">
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-[#7A8194] shrink-0 font-medium">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#3B4256] mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#FF5A00] shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "address" && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#0B1020]">Adresse de livraison principale</h3>
                        <p className="text-[11px] text-[#7A8194]">Agadir et quartiers environnants</p>
                      </div>
                    </div>

                    
                  </div>

                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 space-y-2 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] uppercase font-bold text-[#7A8194]">Quartier</span>
                      <span className="font-black text-sm text-[#0B1020]">
                        {address?.neighborhood || "Talborjt, Agadir"}
                      </span>
                    </div>

                    {address?.street && (
                      <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[#0B1020]/6">
                        <span className="text-[11px] uppercase font-bold text-[#7A8194]">Rue</span>
                        <span className="font-bold text-[#0B1020]">{address.street}</span>
                      </div>
                    )}

                    {(address?.buildingNameNumber || address?.floorNumber || address?.doorNumber) && (
                      <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[#0B1020]/6">
                        <span className="text-[11px] uppercase font-bold text-[#7A8194]">Bâtiment & Étage</span>
                        <span className="font-semibold text-[#0B1020]">
                          {address.buildingNameNumber ? `Bât. ${address.buildingNameNumber}` : ""}
                          {address.floorNumber ? ` • Étage ${address.floorNumber}` : ""}
                          {address.doorNumber ? ` • N° ${address.doorNumber}` : ""}
                        </span>
                      </div>
                    )}

                    {address?.instructions && (
                      <div className="pt-2 border-t border-[#0B1020]/6">
                        <span className="text-[10px] uppercase font-bold text-[#7A8194] block mb-0.5">
                          Consignes pour le livreur
                        </span>
                        <p className="font-medium text-[#3B4256] bg-white p-2.5 rounded-xl border border-[#0B1020]/6">
                          {address.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#0B1020]/8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-black text-[#0B1020]">Changer de point de livraison ?</h4>
                    <p className="text-[11px] text-[#7A8194]">
                      Vous pouvez déplacer le marqueur GPS ou sélectionner un nouveau quartier dans l'éditeur interactif.
                    </p>
                  </div>
                  <Link
                    to="/myaddress"
                    className="foodi-btn-secondary py-2.5 px-4 text-xs font-black shrink-0 flex items-center gap-1.5"
                  >
                    <span>Ouvrir l'éditeur</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF5A00]" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#0B1020]/8 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[#0B1020]/8">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#0B1020]">Préférences d'alertes</h3>
                      <p className="text-[11px] text-[#7A8194]">Gérez les alertes SMS, Push et emails reçus</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/6 cursor-pointer hover:bg-[#FAF8F5]/80 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#0B1020] block">Suivi en direct par SMS & Push</span>
                        <span className="text-[11px] text-[#7A8194]">Notifications à chaque étape de préparation et livraison</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyTracking}
                        onChange={(e) => setNotifyTracking(e.target.checked)}
                        className="w-4 h-4 text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/6 cursor-pointer hover:bg-[#FAF8F5]/80 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#0B1020] block">Promotions exclusives Agadir</span>
                        <span className="text-[11px] text-[#7A8194]">Réductions partenaires et codes promos Foodi</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyPromos}
                        onChange={(e) => setNotifyPromos(e.target.checked)}
                        className="w-4 h-4 text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/6 cursor-pointer hover:bg-[#FAF8F5]/80 transition-colors">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#0B1020] block">Reçus de paiement par e-mail</span>
                        <span className="text-[11px] text-[#7A8194]">Récapitulatifs détaillés de chaque commande terminée</span>
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
                    className="foodi-btn-primary py-2.5 px-6 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les préférences</span>
                  </button>
                </div>
              </form>
            )}

            <div className="md:hidden pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-red-100 shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion du compte</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      <EmailChangeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={email}
        onSuccess={handleEmailSuccess}
      />

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};

export default DashboardPage;
