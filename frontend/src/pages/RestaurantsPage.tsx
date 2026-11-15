import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Star, Clock, Heart } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import { useApp } from "../context/AppContext";
import { fetchRestaurants, fetchCuisines, getStoredRestaurants, getStoredCuisines } from "../services/api";
import { Restaurant, CuisineType } from "../types";

const SPECIAL_CATEGORIES = [
  {
    id: "all",
    name: "Tous",
    slug: "all",
    image: "/images/cuisines/all.png",
    emoji: "🍽️"
  },
  {
    id: "promotions",
    name: "Promotions",
    slug: "promotions",
    image: "/images/cuisines/promo.png",
    emoji: "🏷️"
  },
  {
    id: "free-delivery",
    name: "Livraison 0 DH",
    slug: "free-delivery",
    image: "/images/cuisines/delivery.png",
    emoji: "🛵"
  }
];

export const RestaurantsPage: React.FC = () => {
  const { favorites, toggleFavorite } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [visibleCount, setVisibleCount] = useState(10);
  const [pageLoading, setPageLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(getStoredRestaurants);
  const [cuisines, setCuisines] = useState<CuisineType[]>(getStoredCuisines);

  const loadData = useCallback(() => {
    fetchRestaurants().then((data) => {
      if (data && data.length > 0) setRestaurants(data);
    });
    fetchCuisines().then((data) => {
      if (data && data.length > 0) setCuisines(data);
    });
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener("focus", loadData);
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 150);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", loadData);
    };
  }, [loadData]);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleSelectCategory = (slug: string) => {
    const next = selectedCategory === slug ? "all" : slug;
    setSelectedCategory(next);
    if (next === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: next });
    }
  };

  const filtered = restaurants
    .filter((r) => {
      if (selectedCategory === "free-delivery") {
        return r.deliveryFee === 0;
      }

      if (selectedCategory === "promotions") {
        return r.isPromo || r.deliveryFee === 0;
      }

      const currentCategoryObj = cuisines.find((c) => c.slug === selectedCategory);
      const matchesCategory =
        selectedCategory === "all" ||
        (currentCategoryObj && r.cuisine.toLowerCase().includes(currentCategoryObj.name.toLowerCase())) ||
        r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesCategory;
    })
    .sort((a, b) => b.rating - a.rating);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedCategory]);

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

  if (pageLoading) {
    return <Loader fullScreen message="Sélection des restaurants d'Agadir..." />;
  }

  return (
    <div className="home-layout all-restaurants-page min-h-screen flex flex-col justify-between bg-[#FAF8F5]">
      <div>
        <HomeHeader showBackButton />

        <main className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-5 pb-20 md:pb-16 space-y-6">
          <section style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "9999px", background: "#FFF7ED", color: "#FF5A00", fontSize: "11px", fontWeight: "800", marginBottom: "8px" }}>
                  <span>Partenaires vérifiés</span>
                </div>

                <h1 style={{ fontSize: "26px", fontWeight: "900", color: "#0F172A", margin: 0, letterSpacing: "-0.5px" }}>
                  Tous les restaurants
                </h1>

                <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0 0", fontWeight: "500" }}>
                 Livraison rapide à Agadir
                </p>
              </div>
            </div>

            <section className="categories-bar" style={{ marginTop: "14px", marginBottom: "8px" }}>
              {SPECIAL_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.slug)}
                    className={`category-item ${isActive ? "active" : ""}`}
                  >
                    <div className="category-img-box">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="category-img"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = "none";
                          if (img.nextElementSibling) {
                            (img.nextElementSibling as HTMLElement).style.display = "block";
                          }
                        }}
                      />
                      <span className="category-fallback-emoji" style={{ display: "none" }}>
                        {cat.emoji}
                      </span>
                    </div>

                    <span className="category-name">{cat.name}</span>
                    {isActive && <span className="category-active-bar" />}
                  </button>
                );
              })}

              {cuisines.map((c) => {
                const isActive = selectedCategory === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCategory(c.slug)}
                    className={`category-item ${isActive ? "active" : ""}`}
                  >
                    <div className="category-img-box">
                      <img
                        src={c.image || `/images/cuisines/${c.slug}.png`}
                        alt={c.name}
                        className="category-img"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = "none";
                          if (img.nextElementSibling) {
                            (img.nextElementSibling as HTMLElement).style.display = "block";
                          }
                        }}
                      />
                      <span className="category-fallback-emoji" style={{ display: "none" }}>
                        {c.icon || "🍽️"}
                      </span>
                    </div>

                    <span className="category-name">{c.name}</span>
                    {isActive && <span className="category-active-bar" />}
                  </button>
                );
              })}
            </section>
          </section>

          <div className="flex items-center justify-between text-xs font-bold text-[#7A8194] px-1">
          
            <span className="text-[#FF5A00] font-black">
              ★ Triés par note d'excellence
            </span>
          </div>

          {displayedRestaurants.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#0B1020]/8 max-w-md mx-auto space-y-3">
              <div className="text-4xl">🍽️</div>
              <h3 className="text-base font-black text-[#0B1020]">Aucun restaurant trouvé</h3>
              <p className="text-xs text-[#7A8194]">
                Aucun établissement ne correspond actuellement à cette catégorie.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="px-4 py-2 rounded-xl bg-[#FF5A00] text-white text-xs font-bold cursor-pointer"
              >
                Afficher tous les restaurants
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedRestaurants.map((res, idx) => {
                const isFav = favorites.includes(res.slug);
                return (
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(res.slug);
                        }}
                        className={`restaurant-card-fav-btn ${isFav ? "active" : ""}`}
                        title="Favoris"
                      >
                        <Heart size={16} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#94A3B8"} strokeWidth={2.2} />
                      </button>

                      <div className="restaurant-card-logo-carre">
                        <img
                          src={res.logo}
                          alt={res.name}
                          className="restaurant-card-logo-img"
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
                          <Clock className="w-3 h-3 text-[#FF5A00]" />
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
                );
              })}
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

      <MobileBottomNav />
    </div>
  );
};
