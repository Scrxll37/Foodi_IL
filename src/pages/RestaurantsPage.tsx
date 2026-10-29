import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, Clock, MapPin, SlidersHorizontal } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import restaurantsData from "../data/restaurants.json";
import { Restaurant } from "../types";

const neighborhoods = ["Tous les quartiers", "Talborjt", "Dakhla", "Founty", "Bensergao", "Marina", "Al Massira"];

export const RestaurantsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("Tous les quartiers");
  const [sortBy, setSortBy] = useState<"rating" | "time" | "fee">("rating");

  const restaurants: Restaurant[] = restaurantsData as Restaurant[];

  const filtered = restaurants
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesNeighborhood =
        selectedNeighborhood === "Tous les quartiers" || r.neighborhood === selectedNeighborhood;

      return matchesSearch && matchesNeighborhood;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "fee") return a.deliveryFee - b.deliveryFee;
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader showBackButton />

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-4 space-y-6">
        <div className="bg-white p-5 md:p-6 rounded-3xl border border-[#0B1020]/8 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#0B1020]">Restaurants à Agadir</h1>
              <p className="text-xs text-[#7A8194]">
                Découvrez la sélection des meilleures adresses culinaires de la ville
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 text-[#7A8194] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher burger, tacos, pizza..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs md:text-sm font-medium focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-[#FAF8F5] p-1 rounded-xl border border-[#0B1020]/10 text-xs font-bold text-[#3B4256]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5A00] ml-1.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "rating" | "time" | "fee")}
                  aria-label="Trier les restaurants"
                  className="bg-transparent border-none text-xs font-bold text-[#0B1020] focus:outline-none pr-2 cursor-pointer"
                >
                  <option value="rating">Mieux notés</option>
                  <option value="fee">Frais réduits</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-[#0B1020]/6">
            {neighborhoods.map((n) => {
              const active = selectedNeighborhood === n;
              return (
                <button
                  key={n}
                  onClick={() => setSelectedNeighborhood(n)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#0B1020] text-white"
                      : "bg-[#FAF8F5] text-[#7A8194] hover:text-[#0B1020] hover:bg-[#0B1020]/5"
                  }`}
                >
                  {n === "Tous les quartiers" ? "🏙️ Tous les quartiers" : `📍 ${n}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-[#7A8194] px-1">
          <span>{filtered.length} restaurants trouvés à Agadir</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((res) => (
            <Link
              key={res.id}
              to={`/restaurants/${res.slug}`}
              className="foodi-card overflow-hidden group flex flex-col cursor-pointer"
            >
              <div className="relative h-44 w-full bg-[#0B1020]/5 overflow-hidden">
                <img
                  src={res.cover}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=85";
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
                <div className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-[#0B1020]/5">
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
                    {res.deliveryFee === 0 ? "Livraison gratuite" : `${res.deliveryFee} MAD`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
