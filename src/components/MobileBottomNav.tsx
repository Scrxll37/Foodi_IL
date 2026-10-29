import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, ShoppingBag, Clock, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cartCount, setIsCartOpen, user } = useApp();

  const isHome = location.pathname === "/";
  const isRestaurants = location.pathname.startsWith("/restaurants");
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#0B1020]/8 px-4 py-2 flex items-center justify-around md:hidden shadow-lg">
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
          isHome ? "text-[#FF5A00]" : "text-[#7A8194] hover:text-[#0B1020]"
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Accueil</span>
      </Link>

      <Link
        to="/restaurants"
        className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
          isRestaurants ? "text-[#FF5A00]" : "text-[#7A8194] hover:text-[#0B1020]"
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Restaurants</span>
      </Link>

      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center gap-1 text-[11px] font-bold text-[#FF5A00] cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-[#FF5A00] text-white flex items-center justify-center -mt-5 shadow-lg shadow-[#FF5A00]/35 ring-4 ring-white">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#0B1020] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[#FF5A00] font-extrabold">Panier</span>
      </button>

      <Link
        to={user.isLoggedIn ? "/dashboard" : "/login"}
        className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
          isDashboard ? "text-[#FF5A00]" : "text-[#7A8194] hover:text-[#0B1020]"
        }`}
      >
        <Clock className="w-5 h-5" />
        <span>Commandes</span>
      </Link>

      <Link
        to={user.isLoggedIn ? "/dashboard" : "/login"}
        className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#7A8194] hover:text-[#0B1020] transition-colors"
      >
        <User className="w-5 h-5" />
        <span>{user.isLoggedIn ? "Profil" : "Connexion"}</span>
      </Link>
    </div>
  );
};
