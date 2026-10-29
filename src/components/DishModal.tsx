import React, { useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { Dish } from "../types";
import { useApp } from "../context/AppContext";

interface DishModalProps {
  dish: Dish | null;
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish, restaurantId, restaurantName, onClose }) => {
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  if (!dish) return null;

  const handleOptionSelect = (group: string, option: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [group]: option
    }));
  };

  const handleAddToCart = () => {
    addToCart({
      dishId: dish.id,
      restaurantId,
      restaurantName,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      quantity,
      selectedOptions
    });
    onClose();
  };

  const totalPrice = dish.price * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#0B1020] hover:bg-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative h-56 sm:h-64 w-full bg-[#FAF8F5] overflow-hidden">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:hidden" />
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-black text-[#0B1020]">{dish.name}</h3>
                <span className="text-lg font-black text-[#FF5A00] shrink-0">{dish.price} MAD</span>
              </div>
              <p className="text-xs text-[#7A8194] mt-1 font-medium">{restaurantName} • Agadir</p>
              <p className="text-sm text-[#3B4256] mt-3 leading-relaxed">{dish.description}</p>
            </div>

            {dish.options &&
              Object.entries(dish.options).map(([groupName, choices]) => {
                const choiceList = (choices || []) as string[];
                if (choiceList.length === 0) return null;
                const formattedGroup =
                  groupName.charAt(0).toUpperCase() + groupName.slice(1);

                return (
                  <div key={groupName} className="space-y-3 pt-3 border-t border-[#0B1020]/8">
                    <h4 className="text-sm font-extrabold text-[#0B1020]">
                      Choix {formattedGroup}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {choiceList.map((choice: string) => {
                        const isSelected = selectedOptions[groupName] === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleOptionSelect(groupName, choice)}
                            className={`p-3 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#FFF3EA] border-[#FF5A00] text-[#FF5A00] shadow-xs"
                                : "bg-[#FAF8F5] border-[#0B1020]/10 text-[#3B4256] hover:border-[#FF5A00]/40"
                            }`}
                          >
                            <span>{choice}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#FF5A00] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="p-5 border-t border-[#0B1020]/8 bg-white flex items-center justify-between gap-4">
            <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3B4256] hover:bg-white transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-black text-[#0B1020]">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Augmenter"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3B4256] hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="foodi-btn-primary flex-1 py-3.5 rounded-xl font-extrabold text-sm shadow-md shadow-[#FF5A00]/25 cursor-pointer"
            >
              Ajouter au panier • {totalPrice} MAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
