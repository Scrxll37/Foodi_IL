import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Star, Clock, MapPin } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Footer } from "../components/Footer";
import restaurantsData from "../data/restaurants.json";
import cuisinesData from "../data/cuisines.json";
import { Restaurant } from "../types";

export const RestaurantsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const restaurants: Restaurant[] = restaurantsData as Restaurant[];

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
  };

  const filtered = restaurants
    .filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q);

      const currentCategoryObj = cuisinesData.find((c) => c.slug === selectedCategory);
      const matchesCategory =
        selectedCategory === "all" ||
        (currentCategoryObj && r.cuisine.toLowerCase().includes(currentCategoryObj.name.toLowerCase())) ||
        r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.rating - a.rating);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedCategory]);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setVisibleCount((prev) => Math.min(prev + 10, filtered.length));
            }
          },
          { rootMargin: "300px", threshold: 0.05 }
        );
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [filtered.length]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const displayedRestaurants = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <div>
        <HomeHeader showBackButton />

        <main className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-4 space-y-6 pb-20 md:pb-16">
          <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#0B1020]/8 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#0B1020]">Restaurants à Agadir</h1>
                <p className="text-xs text-[#7A8194]">
                  Découvrez la sélection des meilleures adresses culinaires de la ville classées par note
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#FF5A00] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher burger, tacos, pizza..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-base md:text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#0B1020]/6 pb-1">
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCategory === "all"
                    ? "bg-[#FF5A00] text-white shadow-sm"
                    : "bg-[#FAF8F5] text-[#3B4256] hover:text-[#0B1020] hover:bg-[#FFF3EA]"
                }`}
              >
                <span>🍽️</span>
                <span>Tous</span>
              </button>

              {cuisinesData.map((c) => {
                const active = selectedCategory === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.slug)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                      active
                        ? "bg-[#0B1020] text-white border-[#0B1020] shadow-sm"
                        : "bg-white text-[#3B4256] border-[#0B1020]/8 hover:border-[#FF5A00]/40 hover:text-[#FF5A00] hover:bg-[#FFF3EA]"
                    }`}
                  >
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span>{c.icon}</span>
                    )}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-[#7A8194] px-1">
            <span>
              Affichage de {displayedRestaurants.length} sur {filtered.length} restaurants
            </span>
            <span className="text-[#FF5A00] font-black">
              ★ Triés par note d'excellence
            </span>
          </div>

          {displayedRestaurants.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#0B1020]/8 max-w-md mx-auto space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-base font-black text-[#0B1020]">Aucun restaurant trouvé</h3>
              <p className="text-xs text-[#7A8194]">
                Aucun établissement ne correspond à vos critères de recherche.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 rounded-xl bg-[#FF5A00] text-white text-xs font-bold cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedRestaurants.map((res, idx) => (
                <Link
                  key={res.id}
                  to={`/restaurants/${res.slug}`}
                  style={{ animationDelay: `${(idx % 10) * 40}ms` }}
                  className="filter-card-animate foodi-card overflow-hidden group flex flex-col cursor-pointer bg-white"
                >
                  <div className="relative h-44 w-full bg-[#0B1020]/5 overflow-hidden">
                    <img
                      src={res.cover}
                      alt={res.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
                      }}
                    />

                    {res.badge && (
                      <span className="absolute top-3 left-3 bg-[#0B1020]/85 backdrop-blur-sm text-white text-[11px] font-black px-2.5 py-1 rounded-lg">
                        {res.badge}
                      </span>
                    )}

                    {res.isPromo && (
                      <span className="absolute bottom-3 left-3 bg-[#FF5A00] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                        {res.promoLabel || "Offre Spéciale"}
                      </span>
                    )}

                    <div className="absolute top-3 right-3 w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md border border-[#0B1020]/5">
                      <img
                        src={res.logo}
                        alt={res.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-base text-[#0B1020] group-hover:text-[#FF5A00] transition-colors truncate">
                          {res.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-[#FFF3EA] text-[#FF5A00] px-2 py-0.5 rounded-md text-xs font-black shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#FF5A00]" />
                          <span>{res.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#7A8194] mt-1 font-medium">{res.cuisine}</p>

                      <p className="text-[11px] text-[#3B4256] mt-0.5 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FF5A00]" />
                        <span>{res.neighborhood}, Agadir</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#0B1020]/6 flex items-center justify-between text-xs text-[#3B4256]">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#7A8194]" />
                        <span>{res.deliveryTime}</span>
                      </div>

                      <div className="font-extrabold text-[#12A150]">
                        {res.deliveryFee === 0 ? "Livraison gratuite" : `${res.deliveryFee} DH`}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {visibleCount < filtered.length && (
            <div
              key={`sentinel-${visibleCount}`}
              ref={sentinelCallback}
              className="infinite-scroll-sentinel"
            >
              <div className="infinite-scroll-loading">
                <span className="infinite-scroll-dot" />
                <span className="infinite-scroll-dot" />
                <span className="infinite-scroll-dot" />
                <span>Chargement de restaurants supplémentaires...</span>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};