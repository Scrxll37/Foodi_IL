import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Search,
  ShoppingBag,
  Bell,
  User as UserIcon,
  ArrowLeft,
  Package,
  MoreVertical
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { SearchOverlay } from "./SearchOverlay";

interface HomeHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ showBackButton = false, title }) => {
  const { cartCount, setIsCartOpen, setIsNotifOpen, user, address, notifications } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const isHomePage = location.pathname === "/";

  const truncateText = (text: string, max: number = 10) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  const getAutoTitle = () => {
    if (title) return title;
    const p = location.pathname;
    if (p.startsWith("/track")) return "Location Tracking";
    if (p.startsWith("/orders") || p.startsWith("/my-orders")) return "Mes commandes";
    if (p.startsWith("/order-confirmation")) return "Confirmation";
    if (p.startsWith("/restaurants/")) return "Restaurant";
    if (p.startsWith("/restaurants")) return "Restaurants";
    if (p.startsWith("/dashboard")) return "Mon compte";
    if (p.startsWith("/myaddress")) return "Mon adresse";
    return "Foodi";
  };

  const handleAddressClick = () => {
    if (user.isLoggedIn) {
      navigate("/myaddress");
    } else {
      navigate("/login?redirect=/myaddress");
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <header className="foodi-header-sticky">
        {!isHomePage && (
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-[#0B1020]/8 sticky top-0 z-40">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Retour"
              className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] flex items-center justify-center transition-colors border border-[#0B1020]/10 shrink-0 cursor-pointer shadow-xs"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="text-sm font-black text-[#0B1020] truncate max-w-[200px] text-center tracking-tight">
              {getAutoTitle()}
            </h1>

            <button
              type="button"
              onClick={() => navigate(user.isLoggedIn ? "/orders" : "/login")}
              aria-label="Options"
              className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] flex items-center justify-center transition-colors border border-[#0B1020]/10 shrink-0 cursor-pointer shadow-xs"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        )}

        <div className={!isHomePage ? "hidden md:block foodi-header-desktop-only" : ""}>
        <div className="foodi-header-bar">
          <div className="foodi-header-left">
            {showBackButton && isHomePage ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Retour"
                className="foodi-header-back-btn"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}

            <Link to="/" className="foodi-header-logo-link">
              <img
                src="/images/logo.png"
                alt="Foodi"
                className="foodi-header-logo-mobile"
              />
              <img
                src="/images/logohor.png"
                alt="Foodi Agadir"
                className="foodi-header-logo-desktop"
              />
            </Link>

            <button
              onClick={handleAddressClick}
              type="button"
              className="foodi-header-address-btn"
            >
              <div className="foodi-header-address-icon-box">
                <MapPin size={18} />
              </div>
              <div className="foodi-header-address-info">
                <div className="foodi-header-address-tag">
                  <span className="pulse-dot"></span>
                  <span>Livraison à Agadir</span>
                </div>
                <span className="foodi-header-address-text">
                  {user.isLoggedIn
                    ? (address ? `${truncateText(address.neighborhood, 10)}, Agadir` : "Choisir l'adresse")
                    : "Connexion requise"}
                </span>
              </div>
            </button>
          </div>

          <div
            onClick={() => setIsSearchOpen(true)}
            className="foodi-header-search-bar"
          >
            <Search className="foodi-header-search-icon" />
            <span className="foodi-header-search-text">
              <span className="md:hidden">Rechercher un plat, restaurant...</span>
              <span className="hidden md:inline">Rechercher burgers, tacos, pizzas à Agadir...</span>
            </span>
          </div>

          <div className="foodi-header-actions">
            {user.isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(true)}
                  aria-label="Notifications"
                  className="foodi-header-btn"
                >
                  <Bell size={18} />
                  {unreadNotificationsCount > 0 && (
                    <span className="foodi-header-btn-badge">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                <Link
                  to="/orders"
                  aria-label="Mes Commandes"
                  className="hidden md:flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[#0B1020]/10 bg-white hover:bg-[#FFF3EA] hover:text-[#FF5A00] text-xs font-black text-[#0B1020] transition-colors"
                >
                  <Package size={15} className="text-[#FF5A00]" />
                  <span>Commandes</span>
                </Link>

                <Link
                  to="/dashboard"
                  aria-label="Mon Compte"
                  className="foodi-header-user-link"
                >
                  <UserIcon size={16} color="#FF5A00" />
                  <span className="max-w-[90px] truncate">{user.name.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="foodi-header-login-link"
              >
                <UserIcon size={16} />
                <span>Connexion</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                if (!user.isLoggedIn) {
                  navigate("/login");
                  return;
                }
                setIsCartOpen(true);
              }}
              aria-label="Panier"
              className="foodi-header-btn"
            >
              <ShoppingBag size={20} color="#FF5A00" />
              {cartCount > 0 && (
                <span className="foodi-header-btn-badge">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
