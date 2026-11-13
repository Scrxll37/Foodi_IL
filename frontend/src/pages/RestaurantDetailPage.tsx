import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Clock,
  Bike,
  Heart,
  Plus,
  X,
  Flame,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Info,
  ThumbsUp
} from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { DishModal } from "../components/DishModal";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import restaurantsData from "../data/restaurants.json";
import { Restaurant, Dish } from "../types";
import { useApp } from "../context/AppContext";

 

const getDishFallbackDescription = (dishName: string, categoryName: string): string => {
  const d = dishName.toLowerCase();
  const c = categoryName.toLowerCase();
  if (c.includes("menu") || d.includes("menu") || d.includes("best of")) {
    return "Servi avec frites dorées croustillantes et une boisson rafraîchissante au choix.";
  }
  if (d.includes("burger") || c.includes("burger")) {
    return "Steak savoureux, salade fraîche, cornichons croquants et sauce spéciale dans un pain moelleux.";
  }
  if (d.includes("chicken") || d.includes("poulet") || d.includes("crispy")) {
    return "Filet de poulet croustillant, salade iceberg et sauce onctueuse dans un pain toasté.";
  }
  if (d.includes("tasty")) {
    return "Viande tendre, fromage fondu emmental et sauce grillée fumée signature.";
  }
  if (d.includes("tacos") || c.includes("tacos")) {
    return "Garni de viande marinée, frites croustillantes et sauce fromagère crémeuse.";
  }
  if (d.includes("pizza") || c.includes("pizza")) {
    return "Garniture généreuse, sauce tomate assaisonnée et fromage mozzarella gratiné.";
  }
  if (c.includes("boisson") || d.includes("coca") || d.includes("sprite") || d.includes("fanta")) {
    return "Boisson rafraîchissante servie bien fraîche.";
  }
  if (c.includes("dessert") || d.includes("mcflurry") || d.includes("sundae") || d.includes("glace")) {
    return "Douceur onctueuse et gourmande à déguster bien fraîche.";
  }
  if (c.includes("side") || d.includes("frite") || d.includes("nuggets")) {
    return "Croustillant et doré à point, parfait pour accompagner votre repas.";
  }
  return "Préparé avec des ingrédients frais de qualité supérieure.";
};

export const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, user } = useApp();

  const restaurants: Restaurant[] = restaurantsData as Restaurant[];
  const restaurant = restaurants.find((r) => r.slug === slug) || restaurants[0];

  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("foodi_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [restaurant.id]);

  useEffect(() => {
    try {
      localStorage.setItem("foodi_favorites", JSON.stringify(favorites));
    } catch {
    }
  }, [favorites]);

  const toggleFavorite = (resSlug: string) => {
    setFavorites((prev) =>
      prev.includes(resSlug) ? prev.filter((item) => item !== resSlug) : [...prev, resSlug]
    );
  };

  const satisfactionRate = useMemo(() => {
    const score = Math.round((Number(restaurant.rating || 4.5) / 5) * 100);
    return Math.min(99, Math.max(78, score));
  }, [restaurant.rating]);

  const verifiedReviewCount = useMemo(() => {
    return Number(restaurant.reviewCount) || 142;
  }, [restaurant.reviewCount]);

  const allDishes = useMemo(() => {
    const list: Dish[] = [];
    restaurant.categories.forEach((cat) => {
      cat.dishes.forEach((d) => list.push(d));
    });
    return list;
  }, [restaurant]);

  const promoDishes = useMemo(() => {
    return allDishes.filter((d) => (d.promoPrice && d.promoPrice > 0) || d.isPopular);
  }, [allDishes]);

  const handleDishClick = (dish: Dish) => {
    if (!user.isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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
    if (catId === "all" || catId === "promotions") {
      window.scrollTo({ top: 380, behavior: "smooth" });
      return;
    }
    const element = document.getElementById(catId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isFav = favorites.includes(restaurant.slug);

  const displayedCategories = useMemo(() => {
    if (activeCategoryId === "promotions") {
      return [
        {
          id: "promotions",
          name: "Promotions & Vedettes",
          description: "Profitez des offres spéciales et réductions du moment.",
          dishes: promoDishes
        }
      ];
    }

    if (activeCategoryId !== "all") {
      return restaurant.categories.filter((cat) => cat.id === activeCategoryId);
    }

    return restaurant.categories;
  }, [restaurant, activeCategoryId, promoDishes]);

  if (pageLoading) {
    return <Loader fullScreen message={`Chargement du menu ${restaurant.name}...`} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <div>
        <HomeHeader showBackButton />

        <main className="max-w-[1380px] mx-auto px-0 sm:px-6 pt-0 sm:pt-4 space-y-6 pb-20 md:pb-16">
          <div className="relative rounded-none sm:rounded-3xl overflow-hidden shadow-lg border-b sm:border border-[#0B1020]/8 bg-[#0B1020]">
            <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
              <img
                src={restaurant.cover}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 pointer-events-none"
              />
              <img
                src={restaurant.cover}
                alt={restaurant.name}
                className="relative z-10 w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80";
                }}
              />

              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />

              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-full shadow-md border border-white/60 z-30">
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer"
                  title="Informations du restaurant"
                >
                  <Info className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(restaurant.slug)}
                  className={`restaurant-card-fav-btn ${isFav ? "active" : ""}`}
                  title="Favoris"
                  style={{ position: "static", transform: "none", boxShadow: "none" }}
                >
                  <Heart size={16} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#94A3B8"} strokeWidth={2.2} />
                </button>
              </div>

              <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:left-6 sm:right-6 sm:bottom-5 flex items-end justify-between gap-3.5 z-20">
                <div className="flex items-end gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={() => setIsInfoModalOpen(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-2xl border-2 border-white shrink-0 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 cursor-pointer"
                    title="En savoir plus sur le restaurant"
                  >
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-white pb-0.5 min-w-0 flex-1">
                    <div
                      onClick={() => setIsInfoModalOpen(true)}
                      className="flex items-center gap-1.5 group cursor-pointer w-fit hover:opacity-95 transition-opacity"
                      title="Voir les détails et avis vérifiés"
                    >
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-md truncate">
                        {restaurant.name}
                      </h1>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 drop-shadow-md shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white/95 drop-shadow-xs mt-1">
                      <ThumbsUp className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400 shrink-0" />
                      <span className="font-black text-emerald-300">
                        {satisfactionRate}%
                      </span>
                      <span className="text-white/80 font-normal text-[11px] sm:text-xs">
                        ({verifiedReviewCount.toLocaleString()} avis)
                      </span>
                      <span className="text-white/50">•</span>
                      <span className="text-white/90 font-medium truncate text-[11px] sm:text-xs">
                        {restaurant.cuisine} • {restaurant.neighborhood}, Agadir
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-white shadow-lg">
                    <Clock className="w-4 h-4 text-[#FF5A00] shrink-0" />
                    <span className="text-xs font-black tracking-tight">
                      {restaurant.avgPrepMinutes || 20}-{(restaurant.avgPrepMinutes || 20) + 15} min
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-white shadow-lg">
                    <Bike className="w-4 h-4 text-[#FF5A00] shrink-0" />
                    <span className="text-xs font-black tracking-tight">
                      {restaurant.deliveryFee === 0 ? "Livraison gratuite" : `${restaurant.deliveryFee} DH frais`}
                    </span>
                  </div>

                  {restaurant.promoLabel && (
                    <div className="flex items-center gap-1.5 bg-[#FF5A00] px-3.5 py-2 rounded-2xl text-white text-xs font-black shadow-lg">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>{restaurant.promoLabel}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/30 transition-all cursor-pointer shrink-0 shadow-lg"
                    title="Informations & Avis vérifiés"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Infos</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 sm:px-0 lg:hidden">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#0B1020]/8 shadow-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#0B1020]/6 text-[#0F172A]">
                  <Clock className="w-4 h-4 text-[#FF5A00] shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                    {restaurant.avgPrepMinutes || 20}-{(restaurant.avgPrepMinutes || 20) + 15} min
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#0B1020]/6 text-[#0F172A]">
                  <Bike className="w-4 h-4 text-[#FF5A00] shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                    {restaurant.deliveryFee === 0 ? "Livraison gratuite" : `${restaurant.deliveryFee} DH`}
                  </span>
                </div>

                {restaurant.promoLabel && (
                  <div className="flex items-center gap-1.5 bg-[#FFF3EA] text-[#FF5A00] px-3 py-1.5 rounded-xl text-xs font-black">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>{restaurant.promoLabel}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#FF5A00] bg-[#FAF8F5] hover:bg-neutral-100 px-3 py-1.5 rounded-xl border border-[#0B1020]/6 transition-all cursor-pointer shrink-0"
                title="Informations & Avis vérifiés"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="hidden xs:inline sm:inline">Infos & Avis</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="lg:hidden sticky top-[68px] z-30 bg-[#FAF8F5]/95 backdrop-blur-md py-2.5 px-3 sm:px-0 border-y border-[#0B1020]/8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => scrollToCategory("all")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
                  activeCategoryId === "all"
                    ? "bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/30"
                    : "bg-white text-neutral-700 border border-[#0B1020]/10 hover:border-[#FF5A00]/40"
                }`}
              >
                Tous ({allDishes.length})
              </button>

              {promoDishes.length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToCategory("promotions")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
                    activeCategoryId === "promotions"
                      ? "bg-[#DC2626] text-white shadow-md shadow-[#DC2626]/30"
                      : "bg-[#FFF1F2] text-[#DC2626] border border-[#FECDD3]"
                  }`}
                >
                  % Promotions ({promoDishes.length})
                </button>
              )}

              {restaurant.categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all shrink-0 cursor-pointer ${
                    activeCategoryId === cat.id
                      ? "bg-[#FF5A00] text-white shadow-md shadow-[#FF5A00]/30"
                      : "bg-white text-neutral-700 border border-[#0B1020]/10 hover:border-[#FF5A00]/40"
                  }`}
                >
                  {cat.name} ({cat.dishes.length})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start px-3 sm:px-0">
            <aside className="hidden lg:block lg:col-span-1 sticky top-24 space-y-2">
              <div className="p-4 rounded-3xl bg-white border border-[#0B1020]/8 shadow-xs space-y-1.5">
                <div className="px-3 py-1.5 text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  Menu du Restaurant
                </div>

                <button
                  type="button"
                  onClick={() => scrollToCategory("all")}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    activeCategoryId === "all"
                      ? "bg-[#FFF3EA] text-[#FF5A00] border border-[#FF5A00]/30 shadow-2xs"
                      : "text-[#3B4256] hover:bg-[#FAF8F5] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>Tous les plats</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                      activeCategoryId === "all" ? "bg-[#FF5A00] text-white" : "bg-[#0B1020]/5 text-[#7A8194]"
                    }`}>
                      {allDishes.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7A8194] font-medium line-clamp-1">
                    Découvrez l'intégralité de la carte
                  </span>
                </button>

                {promoDishes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToCategory("promotions")}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                      activeCategoryId === "promotions"
                        ? "bg-[#FFF1F2] text-[#DC2626] border border-[#FECDD3]"
                        : "text-[#3B4256] hover:bg-[#FAF8F5] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Promotions</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-[#DC2626] text-white">
                        {promoDishes.length}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#DC2626]/80 font-medium line-clamp-1">
                      Offres spéciales et réductions
                    </span>
                  </button>
                )}

                {restaurant.categories.map((cat) => {
                  const active = activeCategoryId === cat.id;
                   return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => scrollToCategory(cat.id)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        active
                          ? "bg-[#FFF3EA] text-[#FF5A00] border border-[#FF5A00]/30 shadow-2xs"
                          : "text-[#3B4256] hover:bg-[#FAF8F5] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{cat.name}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                            active
                              ? "bg-[#FF5A00] text-white"
                              : "bg-[#0B1020]/5 text-[#7A8194]"
                          }`}
                        >
                          {cat.dishes.length}
                        </span>
                      </div>
                      
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="lg:col-span-3 space-y-8">
              {displayedCategories.map((category) => (
                <section key={category.id} id={category.id} className="space-y-4 scroll-mt-24">
                  <div className="flex flex-col pb-2.5 border-b border-[#0B1020]/8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-[#0B1020] flex items-center gap-2">
                        <span>{category.name}</span>
                        <span className="text-xs font-bold text-[#7A8194] bg-white px-2.5 py-0.5 rounded-full border border-[#0B1020]/10">
                          {category.dishes.length}
                        </span>
                      </h2>
                    </div>
                   
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
                                  <span>Populaire</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#7A8194] mt-1 line-clamp-2 leading-relaxed">
                              {dish.description || getDishFallbackDescription(dish.name, category.name)}
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
                              title="Ajouter au panier"
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
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
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

        <Footer />
      </div>

      {isInfoModalOpen && (
        <div className="conflict-modal-overlay" onClick={() => setIsInfoModalOpen(false)}>
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-neutral-200 shadow-sm shrink-0 flex items-center justify-center">
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-contain" />
              </div>

              <div>
                <h3 className="text-xl font-black text-[#0B1020]">{restaurant.name}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{restaurant.cuisine} • {restaurant.neighborhood}, Agadir</p>
                <div className="flex items-center gap-2 mt-2 text-xs font-bold text-[#0F172A]">
                  <Clock className="w-3.5 h-3.5 text-[#FF5A00]" />
                  <span>{restaurant.avgPrepMinutes || 20}-{(restaurant.avgPrepMinutes || 20) + 15} min</span>
                  <span>•</span>
                  <Bike className="w-3.5 h-3.5 text-[#FF5A00]" />
                  <span>{restaurant.deliveryFee === 0 ? "Livraison gratuite" : `${restaurant.deliveryFee} DH`}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black uppercase text-emerald-900">Avis 100% Vérifiés</h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Seuls les clients ayant commandé et reçu leur repas peuvent noter cet établissement. Les faux avis sont bloqués automatiquement.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#0B1020]/6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#0B1020]">{restaurant.rating}</span>
                  <div>
                    <div className="flex items-center text-[#FF5A00]">
                      <Star className="w-4 h-4 fill-[#FF5A00]" />
                      <Star className="w-4 h-4 fill-[#FF5A00]" />
                      <Star className="w-4 h-4 fill-[#FF5A00]" />
                      <Star className="w-4 h-4 fill-[#FF5A00]" />
                      <Star className="w-4 h-4 fill-[#FF5A00]" />
                    </div>
                    <span className="text-xs text-[#7A8194] mt-0.5 block">{verifiedReviewCount} avis vérifiés</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#0B1020]/10">
                  <ThumbsUp className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span className="text-sm font-black text-[#0B1020]">{satisfactionRate}%</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-[#3B4256]">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Qualité des repas</span>
                    <span className="font-black text-[#0B1020]">97%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B1020]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[97%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Rapidité de livraison</span>
                    <span className="font-black text-[#0B1020]">94%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B1020]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Exactitude de la commande</span>
                    <span className="font-black text-[#0B1020]">98%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0B1020]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#0F172A] text-white font-extrabold text-xs cursor-pointer hover:bg-black transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

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
