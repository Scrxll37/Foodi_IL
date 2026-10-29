import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, MapPin, Plus, Flame, Sparkles } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { DishModal } from "../components/DishModal";
import restaurantsData from "../data/restaurants.json";
import { Restaurant, Dish } from "../types";
import { useApp } from "../context/AppContext";

export const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useApp();

  const restaurants: Restaurant[] = restaurantsData as Restaurant[];
  const restaurant = restaurants.find((r) => r.slug === slug) || restaurants[0];

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    restaurant.categories[0]?.id || ""
  );
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const handleDishClick = (dish: Dish) => {
    if (dish.hasOptions) {
      setSelectedDish(dish);
    } else {
      addToCart({
        dishId: dish.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        quantity: 1
      });
    }
  };

  const scrollToCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const element = document.getElementById(catId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader showBackButton />

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-2 space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-white border border-[#0B1020]/8 shadow-xs">
          <div className="relative h-48 md:h-64 w-full bg-[#0B1020]/10 overflow-hidden">
            <img
              src={restaurant.cover}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-white/20 shrink-0">
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-xl md:text-3xl font-black drop-shadow-sm">{restaurant.name}</h1>
                  <p className="text-xs md:text-sm text-white/90 font-medium drop-shadow-xs">
                    {restaurant.cuisine} • {restaurant.neighborhood}, Agadir
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-white text-[#0B1020] px-3 py-1.5 rounded-xl text-xs font-black shadow-md">
                <Star className="w-4 h-4 fill-[#FF5A00] text-[#FF5A00]" />
                <span>{restaurant.rating}</span>
                <span className="text-[#7A8194]">({restaurant.reviewCount})</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[#3B4256] border-t border-[#0B1020]/5 bg-[#FAF8F5]/50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF5A00]" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#12A150] font-black">
                  {restaurant.deliveryFee === 0 ? "Livraison gratuite" : `${restaurant.deliveryFee} MAD frais`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7A8194]" />
                <span className="truncate max-w-[200px] md:max-w-none">{restaurant.address}</span>
              </div>
            </div>

            {restaurant.promoLabel && (
              <span className="inline-flex items-center gap-1 bg-[#FFF3EA] text-[#FF5A00] px-3 py-1 rounded-lg text-xs font-extrabold">
                <Flame className="w-3.5 h-3.5" />
                <span>{restaurant.promoLabel}</span>
              </span>
            )}
          </div>
        </section>

        <div className="sticky top-[76px] z-30 lg:hidden -mx-4 px-4 py-2 bg-[#FAF8F5]/90 backdrop-blur-md border-y border-[#0B1020]/8 flex gap-2 overflow-x-auto no-scrollbar">
          {restaurant.categories.map((cat) => {
            const active = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF5A00] text-white shadow-xs"
                    : "bg-white text-[#3B4256] border border-[#0B1020]/8"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <aside className="hidden lg:block lg:col-span-1 sticky top-24 space-y-2">
            <div className="p-4 rounded-3xl bg-white border border-[#0B1020]/8 shadow-xs space-y-1">
              <div className="px-3 py-2 text-xs font-black uppercase text-[#7A8194] tracking-wider">
                Menu du Restaurant
              </div>

              {restaurant.categories.map((cat) => {
                const active = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold text-left flex items-center justify-between transition-all cursor-pointer ${
                      active
                        ? "bg-[#FFF3EA] text-[#FF5A00] border border-[#FF5A00]/30 shadow-2xs"
                        : "text-[#3B4256] hover:bg-[#FAF8F5] border border-transparent"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                        active
                          ? "bg-[#FF5A00] text-white"
                          : "bg-[#0B1020]/5 text-[#7A8194]"
                      }`}
                    >
                      {cat.dishes.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {restaurant.categories.map((category) => (
              <section key={category.id} id={category.id} className="space-y-4 scroll-mt-24">
                <div className="flex items-center justify-between pb-2 border-b border-[#0B1020]/8">
                  <h2 className="text-xl font-black text-[#0B1020] flex items-center gap-2">
                    <span>{category.name}</span>
                    <span className="text-xs font-bold text-[#7A8194] bg-white px-2.5 py-0.5 rounded-full border border-[#0B1020]/10">
                      {category.dishes.length}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {category.dishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => handleDishClick(dish)}
                      className="p-4 rounded-2xl bg-white border border-[#0B1020]/8 hover:border-[#FF5A00]/40 hover:shadow-md transition-all flex gap-4 cursor-pointer group"
                    >
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-[#0B1020] group-hover:text-[#FF5A00] transition-colors">
                              {dish.name}
                            </h3>
                            {dish.isPopular && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-[#FF5A00] bg-[#FFF3EA] px-1.5 py-0.5 rounded">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Star</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#7A8194] mt-1 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2">
                          <span className="text-sm font-black text-[#0B1020]">
                            {dish.price} MAD
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDishClick(dish);
                            }}
                            className="w-8 h-8 rounded-xl bg-[#FFF3EA] text-[#FF5A00] hover:bg-[#FF5A00] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#0B1020]/5">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <DishModal
        dish={selectedDish}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        onClose={() => setSelectedDish(null)}
      />

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
