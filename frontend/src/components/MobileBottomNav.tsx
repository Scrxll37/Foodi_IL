import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, ShoppingBag, Clock, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { cartCount, isCartAnimating, setIsCartOpen, user } = useApp();

  const isHome = location.pathname === "/";
  const isRestaurants = location.pathname.startsWith("/restaurants");
  const isOrders = location.pathname.startsWith("/orders") || location.pathname.startsWith("/my-orders");
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
        id="bottom-cart-btn"
        className={`bottom-nav-cart-btn ${isCartAnimating ? "foodi-cart-bounce" : ""}`}
      >
        <div className="bottom-nav-cart-bubble">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className={`bottom-nav-cart-badge ${isCartAnimating ? "foodi-badge-pop" : ""}`}>
              {cartCount}
            </span>
          )}
        </div>
        <span>Panier</span>
      </button>

      <Link
        to={user.isLoggedIn ? "/orders" : "/login?redirect=/orders"}
        className={`bottom-nav-link ${isOrders ? "active" : ""}`}
      >
        <Clock size={20} />
        <span>Commandes</span>
      </Link>

      <Link
        to={user.isLoggedIn ? "/dashboard" : "/login"}
        className={`bottom-nav-link ${isDashboard ? "active" : ""}`}
      >
        <User size={20} />
        <span>{user.isLoggedIn ? "Profil" : "Connexion"}</span>
      </Link>
    </div>
  );
};
