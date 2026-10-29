import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, clearCart, cartTotal, address, user } = useApp();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const deliveryFee = cart.length > 0 ? 12 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!user.isLoggedIn) {
      navigate("/login?redirect=/dashboard");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-[#0B1020]/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0B1020]">Mon Panier</h2>
                <p className="text-xs text-[#7A8194]">
                  {cart.length} {cart.length > 1 ? "articles ajoutés" : "article ajouté"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  aria-label="Vider le panier"
                  className="text-xs font-semibold text-[#7A8194] hover:text-red-500 px-2 py-1 rounded-md transition-colors"
                >
                  Vider
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full bg-[#0B1020]/5 text-[#3B4256] hover:bg-[#0B1020]/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-[#FFF3EA] flex items-center justify-center mb-4 text-[#FF5A00]">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#0B1020] mb-1">Votre panier est vide</h3>
                <p className="text-sm text-[#7A8194] max-w-xs mb-6">
                  Explorez les meilleurs restaurants d'Agadir et ajoutez vos plats préférés en un clic.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate("/restaurants");
                  }}
                  className="foodi-btn-primary w-full max-w-xs"
                >
                  Découvrir les restaurants
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-[#0B1020]/8 bg-[#FAF8F5]/50 flex gap-3.5 items-center justify-between"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#0B1020]/5 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0B1020] truncate">{item.name}</h4>
                    <span className="text-xs text-[#FF5A00] font-bold block">{item.price} MAD</span>

                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="text-[11px] text-[#7A8194] mt-0.5 truncate">
                        {Object.values(item.selectedOptions).filter(Boolean).join(", ")}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white border border-[#0B1020]/10 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Diminuer"
                          className="w-6 h-6 flex items-center justify-center text-[#3B4256] hover:bg-[#FAF8F5] rounded-md transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#0B1020]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Augmenter"
                          className="w-6 h-6 flex items-center justify-center text-[#3B4256] hover:bg-[#FAF8F5] rounded-md transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-[#0B1020] ml-auto">
                        {item.price * item.quantity} MAD
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-5 border-t border-[#0B1020]/8 bg-white space-y-3.5">
              <div className="bg-[#FAF8F5] p-3 rounded-xl flex items-center justify-between text-xs text-[#3B4256]">
                <span className="font-medium">Adresse de livraison :</span>
                <span className="font-extrabold text-[#0B1020] max-w-[180px] truncate">
                  {address.neighborhood}, Agadir
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7A8194]">
                  <span>Sous-total</span>
                  <span className="font-bold text-[#0B1020]">{cartTotal} MAD</span>
                </div>
                <div className="flex justify-between text-[#7A8194]">
                  <span>Frais de livraison (Agadir)</span>
                  <span className="font-bold text-[#12A150]">{deliveryFee} MAD</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#0B1020] pt-2 border-t border-[#0B1020]/8">
                  <span>Total</span>
                  <span className="text-[#FF5A00]">{grandTotal} MAD</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="foodi-btn-primary w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FF5A00]/25"
              >
                <span>Passer la commande</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
