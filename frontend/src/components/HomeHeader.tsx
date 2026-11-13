import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Search,
  ShoppingBag,
  Bell,
  User as UserIcon,
  ArrowLeft,
  Package
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { SearchOverlay } from "./SearchOverlay";

interface HomeHeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ showBackButton = false, title }) => {
  const { cartCount, isCartAnimating, setIsCartOpen, setIsNotifOpen, user, address, notifications } = useApp();
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
    const p = location.pathname;
    if (p.startsWith("/track")) {
      navigate("/orders");
      return;
    }
    if (p.startsWith("/orders") || p.startsWith("/my-orders")) {
      navigate("/");
      return;
    }
    if (p.startsWith("/order-confirmation")) {
      navigate("/");
      return;
    }
    if (p.startsWith("/dashboard")) {
      navigate("/");
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <header className={`foodi-header-sticky ${!isHomePage ? "foodi-header-sticky-subpage" : ""}`}>
        {!isHomePage && (
          <div className="md:hidden foodi-header-mobile-bar pointer-events-auto w-full flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#0B1020]/8 sticky top-0 z-50">
            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/images/logohor.png"
                alt="Foodi"
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo.png";
                }}
              />
            </Link>

            <h1 className="text-xs sm:text-sm font-black text-[#0B1020] truncate text-center px-2 flex-1 tracking-tight">
              {getAutoTitle()}
            </h1>

            <button
              type="button"
              onClick={handleBack}
              aria-label="Retour"
              className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#FFF3EA] text-[#0B1020] hover:text-[#FF5A00] flex items-center justify-center transition-transform active:scale-90 border border-[#0B1020]/10 shrink-0 cursor-pointer shadow-xs pointer-events-auto"
            >
              <ArrowLeft size={16} />
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
              className={`foodi-header-btn ${isCartAnimating ? "foodi-cart-bounce" : ""}`}
            >
              <ShoppingBag size={20} color="#FF5A00" />
              {cartCount > 0 && (
                <span className={`foodi-header-btn-badge ${isCartAnimating ? "foodi-badge-pop" : ""}`}>
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
