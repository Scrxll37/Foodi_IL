import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, ArrowRight, Star, MapPin, Bike, Sparkles } from "lucide-react";
import restaurantsData from "../data/restaurants.json";
import { fetchRestaurants } from "../services/api";
import { Restaurant } from "../types";
import { useApp } from "../context/AppContext";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_POPULAR = [
  "McDonald's",
  "KFC",
  "Pizza Hut",
  "Burger King",
  "Mister Cook",
  "Tacos",
  "Sushi",
  "Big Mac"
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("foodi_recent_searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const cached = localStorage.getItem("foodi_cache_restaurants_all");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data?.length > 0) return parsed.data;
      }
    } catch {}
    return restaurantsData as Restaurant[];
  });

  useEffect(() => {
    if (isOpen) {
      fetchRestaurants().then((data) => {
        if (data && data.length > 0) setRestaurants(data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const saveSearchTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const filtered = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
    setRecentSearches(filtered);
    try {
      localStorage.setItem("foodi_recent_searches", JSON.stringify(filtered));
    } catch {
    }
  };

  const removeSearchTerm = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = recentSearches.filter((s) => s !== term);
    setRecentSearches(filtered);
    try {
      localStorage.setItem("foodi_recent_searches", JSON.stringify(filtered));
    } catch {
    }
  };

  const clearAllSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("foodi_recent_searches");
    } catch {
    }
  };

  const handleSelectRestaurant = (slug: string) => {
    if (query.trim()) {
      saveSearchTerm(query);
    }
    onClose();
    if (!user.isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/restaurants/${slug}`)}`);
      return;
    }
    navigate(`/restaurants/${slug}`);
  };

  const handleApplyTerm = (term: string) => {
    setQuery(term);
    saveSearchTerm(term);
  };

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const results = normalizedQuery
    ? restaurants.filter((r) => {
        const matchesName = r.name.toLowerCase().includes(normalizedQuery);
        const matchesCuisine = r.cuisine.toLowerCase().includes(normalizedQuery);
        const matchesNeighborhood = r.neighborhood.toLowerCase().includes(normalizedQuery);
        const matchesDishes = r.categories.some((cat) =>
          cat.dishes.some((d) => d.name.toLowerCase().includes(normalizedQuery))
        );
        return matchesName || matchesCuisine || matchesNeighborhood || matchesDishes;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] flex flex-col overflow-hidden animate-in fade-in duration-200">
      <div className="w-full bg-white border-b border-[#0B1020]/8 px-4 py-3 md:px-8 md:py-4 shadow-xs shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3">
          <div className="relative flex-1 flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-4 py-2.5 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
            <Search className="w-5 h-5 text-[#FF5A00] shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  saveSearchTerm(query);
                }
              }}
              placeholder="Rechercher un restaurant, plat ou burger à Agadir..."
              className="w-full bg-transparent text-base font-bold text-[#0B1020] placeholder-[#7A8194] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer"
                className="w-7 h-7 rounded-full bg-[#0B1020]/5 hover:bg-[#0B1020]/10 text-[#3B4256] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-11 px-4 md:px-5 rounded-2xl bg-white border border-[#0B1020]/10 hover:bg-[#FFF3EA] hover:border-[#FF5A00]/40 text-[#0B1020] hover:text-[#FF5A00] text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Fermer</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {!normalizedQuery && (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#0B1020]/8 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#0B1020]/6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0B1020] tracking-wider">
                      <Clock className="w-4 h-4 text-[#FF5A00]" />
                      <span>Recherches récentes</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearAllSearches}
                      className="text-xs font-bold text-[#7A8194] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Effacer tout
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => handleApplyTerm(term)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#FFF3EA] border border-[#0B1020]/8 hover:border-[#FF5A00]/40 text-xs font-bold text-[#0B1020] hover:text-[#FF5A00] transition-all cursor-pointer group"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#7A8194] group-hover:text-[#FF5A00]" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeSearchTerm(term, e)}
                          aria-label="Supprimer"
                          className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center text-[#7A8194] hover:text-[#0B1020]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#0B1020]/8 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#0B1020] tracking-wider pb-2 border-b border-[#0B1020]/6">
                  <Sparkles className="w-4 h-4 text-[#FF5A00]" />
                  <span>Suggestions populaires à Agadir</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_POPULAR.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleApplyTerm(item)}
                      className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#FFF3EA] border border-[#0B1020]/8 hover:border-[#FF5A00]/40 text-xs font-bold text-[#3B4256] hover:text-[#FF5A00] transition-all cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#0B1020] uppercase tracking-wider">
                    Tous les restaurants disponibles
                  </h3>
                  <span className="text-xs font-bold text-[#7A8194]">
                    Top 10 à Agadir
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.slice(0, 10).map((res, idx) => (
                    <div
                      key={res.id}
                      onClick={() => handleSelectRestaurant(res.slug)}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="filter-card-animate p-3.5 rounded-2xl bg-white border border-[#0B1020]/8 hover:border-[#FF5A00]/40 hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#0B1020]/5 shrink-0 p-1">
                        <img
                          src={res.logo}
                          alt={res.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-extrabold text-[#0B1020] group-hover:text-[#FF5A00] transition-colors truncate">
                            {res.name}
                          </h4>
                          <div className="flex items-center gap-0.5 text-xs font-black text-[#FF5A00]">
                            <Star className="w-3 h-3 fill-[#FF5A00]" />
                            <span>{res.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-[#7A8194] truncate">{res.cuisine}</p>
                        <p className="text-[11px] text-[#3B4256] font-semibold mt-0.5">
                          📍 {res.neighborhood}, Agadir
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A8194] group-hover:text-[#FF5A00] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {normalizedQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#0B1020]">
                  Résultats pour « {query} »
                </h3>
                <span className="text-xs font-bold text-[#7A8194] bg-white px-3 py-1 rounded-full border border-[#0B1020]/8">
                  {results.length} {results.length > 1 ? "restaurants trouvés" : "restaurant trouvé"}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[#0B1020]/8 max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto">
                    <Search className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-[#0B1020]">
                    Aucun restaurant trouvé pour « {query} »
                  </h4>
                  <p className="text-xs text-[#7A8194]">
                    Essayez de rechercher un autre plat, une marque ou un quartier d'Agadir (ex: McDonald's, Pizza, Talborjt).
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="foodi-btn-secondary text-xs font-bold py-2 px-4 mt-2"
                  >
                    Réinitialiser la recherche
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((res, idx) => (
                    <div
                      key={res.id}
                      onClick={() => handleSelectRestaurant(res.slug)}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="filter-card-animate foodi-card overflow-hidden group flex flex-col cursor-pointer bg-white"
                    >
                      <div className="relative h-44 w-full bg-[#0B1020]/5 overflow-hidden">
                        <img
                          src={res.cover}
                          alt={res.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        {res.badge && (
                          <span className="absolute top-3 left-3 bg-[#0B1020]/85 backdrop-blur-sm text-white text-[11px] font-black px-2.5 py-1 rounded-lg">
                            {res.badge}
                          </span>
                        )}
                        <div className="absolute top-3 right-3 w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md border border-[#0B1020]/5">
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
                            <h4 className="font-extrabold text-base text-[#0B1020] group-hover:text-[#FF5A00] transition-colors truncate">
                              {res.name}
                            </h4>
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
                            <Bike className="w-3.5 h-3.5 text-[#7A8194]" />
                            <span>{res.deliveryTime}</span>
                          </div>
                          <div className="font-extrabold text-[#12A150]">
                            {res.deliveryFee === 0 ? "Livraison gratuite" : `${res.deliveryFee} DH`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
