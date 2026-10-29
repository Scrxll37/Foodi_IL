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

  return (
    <>
      <header className="sticky top-0 z-40 w-full px-3 pt-2.5 pb-1 pointer-events-none md:px-6 md:pt-3.5">
        <div className="pointer-events-auto max-w-[1380px] mx-auto h-[60px] md:h-[70px] flex items-center justify-between gap-2.5 md:gap-4 px-3 md:px-5 foodi-header-bar rounded-2xl md:rounded-[24px]">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {showBackButton ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Retour"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#0B1020] hover:bg-[#FFF3EA] hover:text-[#FF5A00] transition-colors md:hidden shadow-xs cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
            ) : null}

            <Link to="/" className="flex items-center shrink-0">
              <img
                src="/images/logo.png"
                alt="Foodi"
                className="w-8 h-8 md:hidden object-contain rounded-lg"
              />
              <img
                src="/images/logohor.png"
                alt="Foodi Agadir"
                className="hidden md:block h-9 w-auto object-contain"
              />
            </Link>

            <button
              onClick={handleAddressClick}
              type="button"
              className="hidden md:flex items-center gap-2.5 py-1.5 px-3 rounded-xl hover:bg-[#0B1020]/5 transition-colors text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#12A150]">
                  <span className="pulse-dot"></span>
                  <span>Livraison à Agadir</span>
                </div>
                <span className="text-[14px] font-extrabold text-[#0B1020] max-w-[200px] truncate">
                  {user.isLoggedIn ? (address ? `${address.neighborhood}, Agadir` : "Choisir l'adresse") : "Connexion requise"}
                </span>
              </div>
            </button>
          </div>

          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex-1 md:max-w-md h-10 md:h-11 px-3.5 md:px-4 flex items-center gap-2.5 md:gap-3 bg-[#FAF8F5] md:bg-[#0B1020]/5 border border-[#0B1020]/8 md:border-transparent hover:border-[#FF5A00]/40 hover:bg-white rounded-xl md:rounded-2xl transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <Search className="w-4 h-4 text-[#FF5A00] md:text-[#7A8194] shrink-0" />
            <span className="text-xs md:text-[13.5px] font-medium text-[#7A8194] truncate">
              <span className="md:hidden">Rechercher un plat, restaurant...</span>
              <span className="hidden md:inline">Rechercher burgers, tacos, pizzas à Agadir...</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 md:gap-3 shrink-0">
            {user.isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(true)}
                  aria-label="Notifications"
                  className="relative w-10 h-10 rounded-xl bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#3B4256] hover:text-[#FF5A00] hover:border-[#FF5A00]/40 transition-colors cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#FF5A00] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                <Link
                  to="/dashboard"
                  aria-label="Mon Compte"
                  className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-white border border-[#0B1020]/10 text-[13.5px] font-bold text-[#0B1020] hover:border-[#FF5A00]/40 hover:text-[#FF5A00] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#FF5A00]" />
                  <span className="max-w-[90px] truncate">{user.name.split(" ")[0]}</span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="h-10 px-4 rounded-xl bg-white border border-[#0B1020]/10 text-[13.5px] font-bold text-[#0B1020] hover:bg-[#FFF3EA] hover:border-[#FF5A00]/40 hover:text-[#FF5A00] transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Connexion</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Panier"
              className="relative w-10 h-10 rounded-xl bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#FF5A00] hover:bg-[#FFF3EA] hover:border-[#FF5A00]/40 transition-colors cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#FF5A00] text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
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
