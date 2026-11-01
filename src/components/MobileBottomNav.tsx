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
    <div className="mobile-bottom-nav">
      <Link
        to="/"
        className={`bottom-nav-link ${isHome ? "active" : ""}`}
      >
        <Home size={20} />
        <span>Accueil</span>
      </Link>

      <Link
        to={user.isLoggedIn ? "/restaurants" : "/login?redirect=/restaurants"}
        className={`bottom-nav-link ${isRestaurants ? "active" : ""}`}
      >
        <Compass size={20} />
        <span>Restaurants</span>
      </Link>

      <button
        type="button"
        onClick={() => {
          if (!user.isLoggedIn) {
            window.location.href = "/login";
            return;
          }
          setIsCartOpen(true);
        }}
        className="bottom-nav-cart-btn"
      >
        <div className="bottom-nav-cart-bubble">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="bottom-nav-cart-badge">
              {cartCount}
            </span>
          )}
        </div>
        <span>Panier</span>
      </button>

      <Link
        to={user.isLoggedIn ? "/dashboard" : "/login?redirect=/dashboard"}
        className={`bottom-nav-link ${isDashboard ? "active" : ""}`}
      >
        <Clock size={20} />
        <span>Commandes</span>
      </Link>

      <Link
        to={user.isLoggedIn ? "/dashboard" : "/login"}
        className="bottom-nav-link"
      >
        <User size={20} />
        <span>{user.isLoggedIn ? "Profil" : "Connexion"}</span>
      </Link>
    </div>
  );
};
