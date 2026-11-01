import React, { useState, useEffect, useMemo } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import restaurantsData from "../data/restaurants.json";
import { Restaurant } from "../types";

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, clearCart, cartTotal, address, user } = useApp();
  const navigate = useNavigate();

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isCartOpen);

  useEffect(() => {
    if (isCartOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isCartOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsCartOpen(false);
      setShouldRender(false);
    }, 280);
  };

  const currentRestaurant = useMemo(() => {
    if (cart.length === 0) return null;
    const first = cart[0];
    return (restaurantsData as Restaurant[]).find(
      (r) => r.id === first.restaurantId || r.name.toLowerCase() === first.restaurantName.toLowerCase()
    );
  }, [cart]);

  const deliveryFee = cart.length > 0
    ? (currentRestaurant ? Number(currentRestaurant.deliveryFee ?? 0) : 12)
    : 0;

  const grandTotal = cartTotal + deliveryFee;

  if (!shouldRender && !isCartOpen) return null;

  const handleCheckout = () => {
    handleClose();
    if (!user.isLoggedIn) {
      navigate("/login?redirect=/dashboard");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={handleClose}
        className={`cart-drawer-backdrop ${
          isClosing ? "drawer-fade-out" : "drawer-fade-in"
        }`}
      />

      <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 md:max-w-full flex md:pl-10 pointer-events-none">
        <div
          className={`cart-drawer-panel pointer-events-auto ${
            isClosing ? "drawer-slide-out" : "drawer-slide-in"
          }`}
        >
          <div className="cart-drawer-header">
            <div className="cart-drawer-brand">
              <div className="cart-drawer-icon-box">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="cart-drawer-title">Mon Panier</h2>
                <p className="cart-drawer-subtitle">
                  {cart.length > 0 && cart[0]?.restaurantName ? `${cart[0].restaurantName} • ` : ""}
                  {cart.length} {cart.length > 1 ? "articles ajoutés" : "article ajouté"}
                </p>
              </div>
            </div>

            <div className="cart-drawer-actions">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  aria-label="Vider le panier"
                  className="cart-drawer-clear-btn"
                >
                  Vider
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fermer"
                className="cart-drawer-close-btn"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="cart-drawer-body">
            {cart.length === 0 ? (
              <div className="cart-empty-state">
                <div className="cart-empty-icon">
                  <ShoppingBag size={38} strokeWidth={1.6} />
                </div>
                <h3 className="cart-empty-title">Votre panier est vide</h3>
                <p className="cart-empty-desc">
                  Explorez les meilleurs restaurants d'Agadir et ajoutez vos plats préférés en un clic.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate("/restaurants");
                  }}
                  className="cart-checkout-btn"
                  style={{ maxWidth: "280px" }}
                >
                  Découvrir les restaurants
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="cart-item-card"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
                    }}
                  />

                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <span className="cart-item-price">{item.price} DH</span>

                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="cart-item-options">
                        {Object.values(item.selectedOptions).filter(Boolean).join(", ")}
                      </div>
                    )}

                    <div className="cart-item-controls">
                      <div className="cart-item-qty-selector">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Diminuer"
                          className="cart-item-qty-btn"
                        >
                          {item.quantity === 1 ? <Trash2 size={13} color="#EF4444" /> : <Minus size={13} />}
                        </button>
                        <span className="cart-item-qty-val">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Augmenter"
                          className="cart-item-qty-btn"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="cart-item-line-total">
                        {item.price * item.quantity} DH
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-address-box">
                <span>Adresse de livraison :</span>
                <span className="cart-address-val">
                  {address.neighborhood}, Agadir
                </span>
              </div>

              <div className="cart-summary-lines">
                <div className="cart-summary-row">
                  <span>Sous-total</span>
                  <span className="cart-summary-val">{cartTotal} DH</span>
                </div>
                <div className="cart-summary-row">
                  <span>Frais de livraison ({currentRestaurant ? currentRestaurant.name : "Agadir"})</span>
                  {deliveryFee === 0 ? (
                    <span className="cart-summary-free font-black text-[#12A150]">Gratuit</span>
                  ) : (
                    <span className="cart-summary-val font-black">{deliveryFee} DH</span>
                  )}
                </div>
                <div className="cart-summary-total">
                  <span>Total</span>
                  <span className="cart-total-price">{grandTotal} DH</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="cart-checkout-btn"
              >
                <span>Passer la commande</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
