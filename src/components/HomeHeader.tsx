import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Search, ShoppingBag, Bell, User as UserIcon, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { SearchOverlay } from "./SearchOverlay";

interface HomeHeaderProps {
  showBackButton?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ showBackButton = false }) => {
  const { cartCount, setIsCartOpen, setIsNotifOpen, user, address, notifications } = useApp();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

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
        <div className="foodi-header-bar">
          <div className="foodi-header-left">
            {showBackButton ? (
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
                  {user.isLoggedIn ? (address ? `${address.neighborhood}, Agadir` : "Choisir l'adresse") : "Connexion requise"}
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
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
