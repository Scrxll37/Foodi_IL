import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Bike, ShieldCheck, Flame, ChevronRight, ChevronLeft, Award } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import restaurantsData from "../data/restaurants.json";
import cuisinesData from "../data/cuisines.json";
import { Restaurant } from "../types";

const HERO_SLIDES = [
  {
    id: 1,
    title: "McDonald's Agadir",
    tagline: "Vos menus Best Of, burgers signatures et frites croustillantes livrés chauds chez vous.",
    restaurantName: "McDonald's",
    restaurantSlug: "mcdonalds",
    image: "/images/banners/mce.png",
    logo: "/images/restaurants/McDonalds.png",
    badge: "Partenaire Officiel",
    prepTime: "15-20 min",
    deliveryFee: "12.00 MAD",
    rating: "4.8"
  },
  {
    id: 2,
    title: "Pizza Hut • Livraison Offerte",
    tagline: "Frais de livraison 100% offerts sur toutes vos pizzas Pan et Cheezy Crust fondantes.",
    restaurantName: "Pizza Hut",
    restaurantSlug: "pizzahut",
    image: "/images/banners/1791902911_pizzahut.jpg",
    logo: "/images/restaurants/PIZZAHUT.png",
    badge: "Offre Spéciale",
    prepTime: "20-25 min",
    deliveryFee: "GRATUIT",
    rating: "4.8"
  },
  {
    id: 3,
    title: "KFC Mega Buckets & Tenders",
    tagline: "Recette secrète aux 11 épices avec frites dorées et sauces généreuses.",
    restaurantName: "KFC",
    restaurantSlug: "kfc",
    image: "/images/banners/kfcc.png",
    logo: "/images/restaurants/KFC.jpg",
    badge: "Recette Originale",
    prepTime: "20-25 min",
    deliveryFee: "10.00 MAD",
    rating: "4.7"
  }
];

export const HomePage: React.FC = () => {
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const restaurants: Restaurant[] = restaurantsData as Restaurant[];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  const filteredRestaurants =
    selectedCuisine === "all"
      ? restaurants
      : restaurants.filter((r) => r.cuisineSlug === selectedCuisine);

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader />

      <main className="max-w-[1380px] mx-auto px-4 sm:px-6 pt-4 space-y-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1020] via-[#1E293B] to-[#0B1020] text-white p-6 md:p-10 shadow-2xl min-h-[300px] md:min-h-[360px] flex flex-col justify-between">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transition-opacity duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1020] via-[#0B1020]/80 to-transparent" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A00] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                <Flame className="w-3.5 h-3.5" />
                <span>{slide.badge}</span>
              </span>
              <span className="text-xs text-white/70 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF5A00]" />
                <span>{slide.prepTime}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {slide.title}
            </h1>

            <p className="text-xs md:text-sm text-white/80 max-w-lg font-medium leading-relaxed">
              {slide.tagline}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={`/restaurants/${slide.restaurantSlug}`}
                className="foodi-btn-primary py-3 px-6 rounded-2xl text-xs md:text-sm font-black shadow-lg shadow-[#FF5A00]/30 cursor-pointer"
              >
                <span>Commander maintenant</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl text-xs font-black">
                <Star className="w-4 h-4 fill-[#FF5A00] text-[#FF5A00]" />
                <span>{slide.rating}</span>
                <span className="text-white/40">•</span>
                <span className="text-[#12A150]">{slide.deliveryFee}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Aller au slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === index ? "w-8 bg-[#FF5A00]" : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
                }
                aria-label="Slide précédent"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                aria-label="Slide suivant"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#0B1020]">
                Explorez par Catégories
              </h2>
              <p className="text-xs md:text-sm text-[#7A8194]">
                Les spécialités culinaires les plus demandées à Agadir
              </p>
            </div>
            <Link
              to="/restaurants"
              className="text-xs md:text-sm font-bold text-[#FF5A00] hover:underline flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => setSelectedCuisine("all")}
              className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                selectedCuisine === "all"
                  ? "bg-[#FF5A00] text-white border-[#FF5A00] shadow-md shadow-[#FF5A00]/25"
                  : "bg-white text-[#3B4256] border-[#0B1020]/8 hover:border-[#FF5A00]/30 hover:bg-[#FFF3EA]"
              }`}
            >
              🔥 Tous les plats
            </button>

            {cuisinesData.map((c) => {
              const isSelected = selectedCuisine === c.slug;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCuisine(c.slug)}
                  className={`px-5 py-3 rounded-2xl text-xs md:text-sm font-extrabold whitespace-nowrap transition-all border cursor-pointer shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#FF5A00] text-white border-[#FF5A00] shadow-md shadow-[#FF5A00]/25"
                      : "bg-white text-[#3B4256] border-[#0B1020]/8 hover:border-[#FF5A00]/30 hover:bg-[#FFF3EA]"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#0B1020]">
                Restaurants Partenaires à Agadir
              </h2>
              <p className="text-xs md:text-sm text-[#7A8194]">
                Talborjt, Dakhla, Founty, Bensergao & Marina
              </p>
            </div>
            <span className="text-xs font-bold text-[#7A8194] bg-white px-3 py-1 rounded-full border border-[#0B1020]/8">
              {filteredRestaurants.length} enseignes ouvertes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRestaurants.map((res) => (
              <Link
                key={res.id}
                to={`/restaurants/${res.slug}`}
                className="foodi-card overflow-hidden group flex flex-col cursor-pointer"
              >
                <div className="relative h-48 w-full bg-[#0B1020]/5 overflow-hidden">
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
                  {res.isPromo && (
                    <span className="absolute bottom-3 left-3 bg-[#FF5A00] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                      {res.promoLabel || "Offre Spéciale"}
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
                      <h3 className="font-extrabold text-base text-[#0B1020] group-hover:text-[#FF5A00] transition-colors truncate">
                        {res.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-[#FFF3EA] text-[#FF5A00] px-2 py-0.5 rounded-md text-xs font-black shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#FF5A00]" />
                        <span>{res.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#7A8194] mt-1 font-medium">{res.cuisine}</p>
                    <p className="text-[11px] text-[#3B4256] mt-0.5 font-bold">
                      📍 {res.neighborhood}, Agadir
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#0B1020]/6 flex items-center justify-between text-xs text-[#3B4256]">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#7A8194]" />
                      <span>{res.deliveryTime}</span>
                    </div>
                    <div className="font-extrabold text-[#12A150]">
                      {res.deliveryFee === 0 ? "Livraison gratuite" : `${res.deliveryFee} MAD livr.`}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 md:p-10 border border-[#0B1020]/8 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-black text-[#0B1020]">Pourquoi choisir Foodi Agadir ?</h2>
            <p className="text-xs md:text-sm text-[#7A8194] mt-1">
              La plateforme n°1 pensée pour les habitants et vacanciers d'Agadir
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B1020]">Livraison 25 Min Chrono</h3>
                <p className="text-xs text-[#7A8194] mt-1 leading-relaxed">
                  Nos livreurs gadiris connaissent chaque ruelle de Talborjt à Founty pour vous livrer chaud.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B1020]">100% Enseignes Authentiques</h3>
                <p className="text-xs text-[#7A8194] mt-1 leading-relaxed">
                  McDonald's, KFC, Pizza Hut, Burger King, Mister Cook et vos snacks locaux.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#0B1020]">Paiement à la Livraison</h3>
                <p className="text-xs text-[#7A8194] mt-1 leading-relaxed">
                  Réglez en toute sécurité en espèces ou par carte bancaire lors de la remise en main propre.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#0B1020]/8 pt-8 pb-4 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7A8194]">
          <div className="flex items-center gap-3">
            <img src="/images/logohor.png" alt="Foodi Agadir" className="h-7 w-auto object-contain" />
            <span>© 2026 Foodi Maroc — Tous droits réservés. Ville d'Agadir.</span>
          </div>
          <div className="flex gap-4 font-bold">
            <Link to="/restaurants" className="hover:text-[#FF5A00]">Restaurants</Link>
            <Link to="/myaddress" className="hover:text-[#FF5A00]">Mon Adresse</Link>
            <Link to="/login" className="hover:text-[#FF5A00]">Espace Client</Link>
          </div>
        </footer>
      </main>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
