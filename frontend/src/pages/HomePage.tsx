import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Star,
  Clock,
  Bike,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
  Info,
  ThumbsUp
} from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { SearchOverlay } from "../components/SearchOverlay";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Footer } from "../components/Footer";
import { Loader } from "../components/Loader";
import { useApp } from "../context/AppContext";
import { getNearestBranchInfo } from "../utils/delivery";
import { fetchRestaurants, fetchCuisines } from "../services/api";
import restaurantsData from "../data/restaurants.json";
import cuisinesData from "../data/cuisines.json";
import budgetMealsData from "../data/budget_meals.json";
import { Restaurant, CuisineType } from "../types";

interface HeroAd {
  id: number;
  title: string;
  tagline: string;
  restaurantName: string;
  restaurantSlug: string;
  image: string;
  logo: string;
  badge: string;
  prepTime: string;
  deliveryFee: string;
  rating: string;
  isFreeDelivery?: boolean;
}

interface BudgetMeal {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_path: string;
  restaurant?: {
    name: string;
    slug: string;
    logo_path?: string;
    base_delivery_fee?: number;
  };
}

interface SectionInfoModalData {
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  highlights: { icon: string; title: string; desc: string }[];
}

const HERO_ADS: HeroAd[] = [
  {
    id: 1,
    title: "McDonald's Agadir",
    tagline: "Vos menus Best Of, burgers signatures et frites croustillantes livrés chauds chez vous.",
    restaurantName: "McDonald's",
    restaurantSlug: "mcdonalds",
    image: "/images/banners/mce.png",
    logo: "/images/restaurants/McDonalds.png",
    badge: "Partenaire Officiel",
    prepTime: "15-20'",
    deliveryFee: "12 DH",
    rating: "4.8",
    isFreeDelivery: false
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
    prepTime: "20-25'",
    deliveryFee: "GRATUIT",
    rating: "4.8",
    isFreeDelivery: true
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
    prepTime: "20-25'",
    deliveryFee: "10 DH",
    rating: "4.7",
    isFreeDelivery: false
  }
];

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

const SECTION_INFOS: Record<string, SectionInfoModalData> = {
  fast: {
    title: "Livraison Rapide",
    badge: "Moins de 20 min",
    subtitle: "Comment fonctionne la livraison rapide ?",
    description: "Sélection d'établissements préparant vos commandes en express avec départ direct des coursiers.",
    highlights: [
      { icon: "⚡", title: "Priorité préparation", desc: "Votre commande est cuisinée et emballée en priorité par le restaurant." },
      { icon: "🛵", title: "Attribution immédiate", desc: "Un coursier partenaire à proximité est affecté dès validation." },
      { icon: "📍", title: "Proximité garantie", desc: "Enseignes idéalement situées autour de votre adresse à Agadir." }
    ]
  },
  demand: {
    title: "Les plus demandés",
    badge: "Tendances en direct",
    subtitle: "Où tout le monde commande en ce moment ?",
    description: "Les enseignes qui enregistrent le plus fort volume de commandes réelles et de réassorts sur Foodi.",
    highlights: [
      { icon: "📈", title: "Volume certifié", desc: "Mise à jour dynamique selon les commandes confirmées aujourd'hui." },
      { icon: "⭐", title: "Satisfaction vérifiée", desc: "Taux de satisfaction client systématiquement supérieur à 90%." },
      { icon: "🍔", title: "Menus phares", desc: "Les best-sellers incontournables et nouveautés plébiscitées." }
    ]
  },
  budget: {
    title: "Moins de 50 MAD",
    badge: "Petits Prix",
    subtitle: "Repas complets sans minimum de commande",
    description: "Une sélection économique négociée pour savourer de vrais plats à moins de 50 MAD.",
    highlights: [
      { icon: "🏷️", title: "Plafond strict 50,00 MAD", desc: "Des tarifs clairs et accessibles pour tous les budgets quotidiens." },
      { icon: "✨", title: "Aucun minimum requis", desc: "Commandez en solo sans obligation de panier minimum." },
      { icon: "🥗", title: "Variété gourmande", desc: "Burgers, pizzas, plats marocains, sandwiches et salades." }
    ]
  },
  popular: {
    title: "Les plus populaires",
    badge: "Avis Clients",
    subtitle: "Classement selon les notes vérifiées",
    description: "Les restaurants les mieux notés et recommandés par la communauté des clients Foodi.",
    highlights: [
      { icon: "⭐", title: "Avis 100% vérifiés", desc: "Seuls les utilisateurs ayant validé leur livraison peuvent noter." },
      { icon: "🏆", title: "Excellence & Régularité", desc: "Tenue des délais, température des plats et soin de l'emballage." },
      { icon: "🤝", title: "Partenaires de référence", desc: "Les plus grandes franchises et spécialités de renom." }
    ]
  },
  all: {
    title: "Tous les restaurants",
    badge: "Réseau Foodi",
    subtitle: "Toutes les enseignes disponibles",
    description: "Explorez notre catalogue complet de restaurants partenaires à Agadir avec filtres par catégorie.",
    highlights: [
      { icon: "🍽️", title: "+25 Enseignes", desc: "Fast-food, pizzerias traditionnelles, cuisine du monde et brasseries." },
      { icon: "⚡", title: "Filtres instantanés", desc: "Affinez par promos, livraison gratuite ou cuisine en 1 clic." },
      { icon: "📦", title: "Suivi de commande", desc: "Notification à chaque étape de votre commande jusqu'à la livraison." }
    ]
  }
};

export const HomePage: React.FC = () => {
  const { address, user, favorites, toggleFavorite } = useApp();
  const userLat = address?.lat || 30.4278;
  const userLng = address?.lng || -9.5981;

  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    try {
      const cached = localStorage.getItem("foodi_cache_restaurants_all");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data && parsed.data.length > 0) return parsed.data;
      }
    } catch {}
    return restaurantsData as Restaurant[];
  });
  const [cuisines, setCuisines] = useState<CuisineType[]>(() => {
    try {
      const cached = localStorage.getItem("foodi_cache_cuisines");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data && parsed.data.length > 0) return parsed.data;
      }
    } catch {}
    return cuisinesData as CuisineType[];
  });
  const budgetMeals: BudgetMeal[] = budgetMealsData as BudgetMeal[];

  useEffect(() => {
    fetchRestaurants().then((data) => {
      if (data && data.length > 0) {
        setRestaurants(data);
      }
    });
    fetchCuisines().then((data) => {
      if (data && data.length > 0) {
        setCuisines(data);
      }
    });
  }, []);

  const [activeCuisine, setActiveCuisine] = useState<string>("all");
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sectionInfo, setSectionInfo] = useState<SectionInfoModalData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const filteredObserverRef = useRef<IntersectionObserver | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (activeCuisine === "all") {
      setVisibleCount(restaurants.length);
    } else {
      setVisibleCount(8);
    }
  }, [activeCuisine, restaurants.length]);

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
              setVisibleCount((prev) => Math.min(prev + 8, restaurants.length));
            }
          },
          { rootMargin: "350px", threshold: 0.05 }
        );
        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [restaurants.length]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      filteredObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % HERO_ADS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleFavorite = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(slug);
  };

  const fastSliderRef = useRef<HTMLDivElement>(null);
  const popularSliderRef = useRef<HTMLDivElement>(null);
  const budgetSliderRef = useRef<HTMLDivElement>(null);

  const slide = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -320 : 320,
        behavior: "smooth"
      });
    }
  };

  const fastRestaurants = useMemo(() => {
    return [...restaurants]
      .map((r) => ({
        restaurant: r,
        deliv: getNearestBranchInfo(r, userLat, userLng)
      }))
      .sort((a, b) => a.deliv.totalMinutes - b.deliv.totalMinutes)
      .map((item) => item.restaurant);
  }, [restaurants, userLat, userLng]);

  const popularRestaurants = useMemo(() => {
    return [...restaurants].sort((a, b) => b.reviewCount - a.reviewCount);
  }, [restaurants]);

  const mostInDemandRestaurants = useMemo(() => {
    const prioritySlugs = [
      "mcdonalds",
      "pizzahut",
      "kfc",
      "burger-king",
      "mistercook",
      "otacos",
      "dominos",
      "crusty",
      "snack-rafiq",
      "kyoto-sushi"
    ];
    const matched: Restaurant[] = [];
    prioritySlugs.forEach((slug) => {
      const found = restaurants.find((r) => r.slug === slug || r.id === slug);
      if (found && !matched.some((m) => m.id === found.id)) {
        matched.push(found);
      }
    });
    const remaining = restaurants.filter((r) => !matched.some((m) => m.id === r.id));
    return [...matched, ...remaining].slice(0, 9);
  }, [restaurants]);

  const getSatisfactionScore = (restaurant: Restaurant): number => {
    const scoreMap: Record<string, number> = {
      mcdonalds: 94,
      pizzahut: 96,
      kfc: 93,
      "burger-king": 92,
      mistercook: 98,
      otacos: 94,
      dominos: 91,
      crusty: 95,
      "snack-rafiq": 97,
      "kyoto-sushi": 99
    };
    if (scoreMap[restaurant.slug]) {
      return scoreMap[restaurant.slug];
    }
    return Math.min(99, Math.max(88, Math.round((restaurant.rating / 5) * 100)));
  };

  const getPromoBadge = (slug: string): string | null => {
    switch (slug) {
      case "mcdonalds":
        return "-20% sur Menu Maxi";
      case "pizzahut":
        return "1 Achetée = 1 Offerte";
      case "mistercook":
        return "Livraison Gratuite";
      case "otacos":
        return "Sauce Fromagère Offerte";
      case "kyoto-sushi":
        return "Plateau Découverte -15%";
      default:
        return null;
    }
  };

  const activeCategoryName = useMemo(() => {
    if (activeCuisine === "promotions") return "Promotions & Offres Spéciales";
    if (activeCuisine === "free-delivery") return "Restaurants avec Livraison Gratuite";
    const found = cuisines.find((c) => c.slug === activeCuisine);
    return found ? found.name : activeCuisine;
  }, [activeCuisine, cuisines]);

  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (activeCuisine === "promotions") {
      return list.filter((r) => r.isPromo || r.deliveryFee === 0);
    }
    if (activeCuisine === "free-delivery") {
      return list.filter((r) => r.deliveryFee === 0);
    }
    return list.filter(
      (r) =>
        r.cuisineSlug === activeCuisine ||
        r.cuisine.toLowerCase().includes(activeCuisine.toLowerCase())
    );
  }, [restaurants, activeCuisine]);

  const paginatedFilteredRestaurants = useMemo(() => {
    return filteredRestaurants.slice(0, visibleCount);
  }, [filteredRestaurants, visibleCount]);

  const paginatedRestaurants = useMemo(() => {
    return restaurants.slice(0, visibleCount);
  }, [restaurants, visibleCount]);

  const filteredSentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (filteredObserverRef.current) {
        filteredObserverRef.current.disconnect();
        filteredObserverRef.current = null;
      }

      if (node) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setVisibleCount((prev) => Math.min(prev + 8, filteredRestaurants.length));
            }
          },
          { rootMargin: "350px", threshold: 0.05 }
        );
        observer.observe(node);
        filteredObserverRef.current = observer;
      }
    },
    [filteredRestaurants.length]
  );

  const renderRestaurantCard = (restaurant: Restaurant) => {
    const deliv = getNearestBranchInfo(restaurant, userLat, userLng);
    const prepTime = deliv.formattedTime;
    const fee = Number(restaurant.deliveryFee);
    const rating = Number(restaurant.rating);
    const isFav = favorites.includes(restaurant.slug);
    const cuisinesList = restaurant.cuisine || "Restaurant";

    return (
      <Link
        key={restaurant.id}
        to={user.isLoggedIn ? `/restaurants/${restaurant.slug}` : `/login?redirect=${encodeURIComponent(`/restaurants/${restaurant.slug}`)}`}
        className="restaurant-card"
      >
        <div className="restaurant-card-banner-box">
          <img
            src={restaurant.cover || "/images/banners/mcdo1.png"}
            alt={restaurant.name}
            className="restaurant-card-banner-img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80";
            }}
          />

          {fee === 0 && <div className="badge-gratuit-floating">GRATUIT</div>}

          <button
            type="button"
            onClick={(e) => handleToggleFavorite(e, restaurant.slug)}
            className={`restaurant-card-fav-btn ${isFav ? "active" : ""}`}
            title="Favoris"
          >
            <Heart size={16} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#94A3B8"} strokeWidth={2.2} />
          </button>

          <div className="restaurant-card-logo-carre">
            <img
              src={restaurant.logo || "/images/logo.png"}
              alt={restaurant.name}
              className="restaurant-card-logo-img"
            />
          </div>
        </div>

        <div className="restaurant-card-body">
          <div>
            <h4 className="restaurant-card-name">{restaurant.name}</h4>
            <p className="restaurant-card-cuisines">{cuisinesList}</p>
          </div>

          <div className="restaurant-card-meta">
            <div className="meta-group">
              {fee === 0 ? (
                <span className="meta-item-gratuit">GRATUIT</span>
              ) : (
                <span className="meta-item">
                  <Bike size={13} color="#FF5A00" />
                  {fee.toFixed(0)} DH
                </span>
              )}
              <span className="meta-item">
                <Clock size={13} color="#FF5A00" />
                {prepTime}
              </span>
            </div>

            <span className="meta-rating">
              <Star size={11} fill="#16A34A" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  if (pageLoading) {
    return <Loader fullScreen message="Chargement des restaurants d'Agadir..." />;
  }

  return (
    <div className="home-root">
      <HomeHeader />

      <main className="home-container">
        <section className="search-section">
          <div
            className="search-input-wrapper"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="search-icon-left" />
            <input
              type="text"
              readOnly
              placeholder="Rechercher un restaurant (McDonald's, KFC, Pizza Hut, Mister Cook, Crusty...)"
              className="search-input"
            />
          </div>
        </section>

        <section className="hero-slider-wrap">
          {HERO_ADS.map((ad, idx) => {
            const isActive = idx === activeHeroSlide;
            return (
              <Link
                key={ad.id}
                to={user.isLoggedIn ? `/restaurants/${ad.restaurantSlug}` : `/login?redirect=${encodeURIComponent(`/restaurants/${ad.restaurantSlug}`)}`}
                className={`hero-slide ${isActive ? "active" : ""}`}
                tabIndex={isActive ? 0 : -1}
              >
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="hero-slide-bg"
                />
                <div className="hero-slide-overlay" />

                <div
                  className="hero-restu-logo-corner"
                  title={`Voir le menu de ${ad.restaurantName}`}
                >
                  <img
                    src={ad.logo}
                    alt={ad.restaurantName}
                    className="hero-restu-logo-img"
                  />
                </div>

                <div className="hero-slide-body">
                  <span className="hero-slide-badge">
                    <Sparkles size={13} /> {ad.badge}
                  </span>
                  <h2 className="hero-slide-title">{ad.title}</h2>
                  <p className="hero-slide-desc">{ad.tagline}</p>
                </div>
              </Link>
            );
          })}

          <div className="hero-bottom-right-panel">
            <div className="hero-foodi-info-pill">
              <span className="hero-foodi-time-item">
                <Clock size={13} color="#FF5A00" />
                {HERO_ADS[activeHeroSlide].prepTime}
              </span>

              {HERO_ADS[activeHeroSlide].isFreeDelivery ? (
                <span className="hero-foodi-fee-gratuit">GRATUIT</span>
              ) : (
                <span className="hero-foodi-fee-item">
                  <Bike size={13} color="#FF5A00" />
                  {HERO_ADS[activeHeroSlide].deliveryFee}
                </span>
              )}

              <span className="meta-rating" style={{ padding: "4px 8px", fontSize: "12px" }}>
                <Star size={12} fill="#16A34A" />
                {HERO_ADS[activeHeroSlide].rating}
              </span>
            </div>
          </div>
        </section>

        <section className="categories-bar">
          {SPECIAL_CATEGORIES.map((cat) => {
            const isActive = activeCuisine === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCuisine(isActive ? "all" : cat.slug)}
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
            const isActive = activeCuisine === c.slug;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCuisine(isActive ? "all" : c.slug)}
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

        {activeCuisine !== "all" ? (
          <section className="filtered-category-view">
            <div className="section-head-modern" style={{ paddingBottom: "12px", borderBottom: "1px solid #E2E8F0" }}>
              <div className="section-head-title-wrap">
                <h3 className="section-title-modern">{activeCategoryName}</h3>
                <p className="section-sub-modern">
                  {filteredRestaurants.length} enseigne(s) disponible(s) à Agadir
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCuisine("all")}
                className="clear-filter-btn"
              >
                <X size={14} /> Voir tout
              </button>
            </div>

            {filteredRestaurants.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-state-icon">🔍</div>
                <h4 className="empty-state-title">Aucun restaurant trouvé</h4>
                <p className="empty-state-sub">
                  Aucun établissement ne correspond actuellement à la catégorie {activeCategoryName}.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCuisine("all")}
                  className="empty-state-reset-btn"
                >
                  Afficher tous les restaurants
                </button>
              </div>
            ) : (
              <>
                <div className="restaurants-grid-4col">
                  {paginatedFilteredRestaurants.map((restaurant) => renderRestaurantCard(restaurant))}
                </div>

                {visibleCount < filteredRestaurants.length ? (
                  <div
                    key={`filtered-sentinel-${visibleCount}`}
                    ref={filteredSentinelCallback}
                    className="infinite-scroll-sentinel"
                  >
                    <div className="infinite-scroll-loading">
                      <span className="infinite-scroll-dot" />
                      <span className="infinite-scroll-dot" />
                      <span className="infinite-scroll-dot" />
                      <span>Chargement...</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                    <div className="infinite-scroll-end">
                      <span>✨ Tous les restaurants de cette sélection sont affichés</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <section id="fast-section">
              <div className="section-head-modern">
                <div className="section-head-title-wrap">
                  <h3 className="section-title-modern">
                    Livraison rapide
                    <button
                      type="button"
                      onClick={() => setSectionInfo(SECTION_INFOS.fast)}
                      className="section-info-btn"
                      title="Informations livraison rapide"
                    >
                      <Info size={16} strokeWidth={2.2} />
                    </button>
                  </h3>
                </div>

                <div className="slider-pc-controls">
                  <button
                    type="button"
                    onClick={() => slide(fastSliderRef, "left")}
                    className="slider-control-arrow"
                    title="Précédent"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => slide(fastSliderRef, "right")}
                    className="slider-control-arrow"
                    title="Suivant"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div ref={fastSliderRef} className="slider-track">
                {fastRestaurants.map((restaurant) => (
                  <div key={`fast-${restaurant.id}`} className="slider-card-item">
                    {renderRestaurantCard(restaurant)}
                  </div>
                ))}
              </div>
            </section>

            {mostInDemandRestaurants.length > 0 && (
              <section id="most-in-demand-section" className="most-demand-section">
                <div className="section-head-modern">
                  <div className="section-head-title-wrap">
                    <h3 className="section-title-modern">
                      Les plus demandés
                      <button
                        type="button"
                        onClick={() => setSectionInfo(SECTION_INFOS.demand)}
                        className="section-info-btn"
                        title="Informations restaurants les plus demandés"
                      >
                        <Info size={16} strokeWidth={2.2} />
                      </button>
                    </h3>
                  </div>
                </div>

                <div className="most-demand-grid">
                  {mostInDemandRestaurants.map((restaurant) => {
                    const fee = Number(restaurant.deliveryFee || 0);
                    const isFree = fee === 0;
                    const score = getSatisfactionScore(restaurant);
                    const promoBadge = getPromoBadge(restaurant.slug);

                    return (
                      <Link
                        key={`demand-${restaurant.id}`}
                        to={user.isLoggedIn ? `/restaurants/${restaurant.slug}` : `/login?redirect=${encodeURIComponent(`/restaurants/${restaurant.slug}`)}`}
                        className="most-demand-card"
                      >
                        <div className="most-demand-logo-box">
                          <img
                            src={restaurant.logo || "/images/logo.png"}
                            alt={restaurant.name}
                            className="most-demand-logo-img"
                            loading="lazy"
                          />
                        </div>

                        <div className="most-demand-info">
                          <h4 className="most-demand-name">{restaurant.name}</h4>

                          <div className="most-demand-meta">
                            <span className="most-demand-score">
                              <ThumbsUp size={13} strokeWidth={2.4} />
                              {score}%
                            </span>

                            <span className="most-demand-dot">•</span>

                            <span className={`most-demand-fee ${isFree ? "free" : ""}`}>
                              <Bike size={13} strokeWidth={2.2} />
                              {isFree ? "Free" : `${fee.toFixed(0)} DH`}
                            </span>
                          </div>

                          {promoBadge && (
                            <span className="most-demand-badge">{promoBadge}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {budgetMeals.length > 0 && (
              <section id="budget-meals-section" className="budget-section-wrap">
                <div className="section-head-modern" style={{ marginBottom: "18px" }}>
                  <div className="section-head-title-wrap">
                    <h3 className="section-title-modern">
                      Moins de 50 MAD
                      <button
                        type="button"
                        onClick={() => setSectionInfo(SECTION_INFOS.budget)}
                        className="section-info-btn"
                        title="Informations offres à moins de 50 MAD"
                      >
                        <Info size={16} strokeWidth={2.2} />
                      </button>
                    </h3>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => slide(budgetSliderRef, "left")}
                      className="budget-ctrl-btn"
                      title="Précédent"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => slide(budgetSliderRef, "right")}
                      className="budget-ctrl-btn"
                      title="Suivant"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div ref={budgetSliderRef} className="budget-slider-track">
                  {budgetMeals.map((meal) => {
                    const fee = Number(meal.restaurant?.base_delivery_fee || 0);
                    return (
                      <Link
                        key={`budget-${meal.id}`}
                        to={user.isLoggedIn ? `/restaurants/${meal.restaurant?.slug}` : `/login?redirect=${encodeURIComponent(`/restaurants/${meal.restaurant?.slug}`)}`}
                        className="budget-item-card"
                      >
                        <div className="budget-photo-box">
                          <img
                            src={meal.image_path}
                            alt={meal.name}
                            className="budget-photo-img"
                            loading="lazy"
                          />
                          <div className="budget-photo-logo">
                            <img
                              src={meal.restaurant?.logo_path || "/images/logo.png"}
                              alt={meal.restaurant?.name}
                              className="budget-photo-logo-img"
                            />
                          </div>
                        </div>

                        <div className="budget-info-body">
                          <span className="budget-restu-name">
                            {meal.restaurant?.name}
                          </span>
                          <h4 className="budget-dish-name">{meal.name}</h4>
                          <div className="budget-dish-price">
                            <span>{Number(meal.price).toFixed(2).replace(".", ",")} MAD</span>
                            {meal.original_price && Number(meal.original_price) > Number(meal.price) && (
                              <span style={{ textDecoration: "line-through", color: "#94A3B8", fontSize: "11px", marginLeft: "6px" }}>
                                {Number(meal.original_price).toFixed(2).replace(".", ",")} MAD
                              </span>
                            )}
                          </div>
                          <div className="budget-delivery-meta">
                            {fee === 0 ? (
                              <span className="meta-item-gratuit">GRATUIT</span>
                            ) : (
                              <>
                                <Bike size={13} color="#6B7280" />
                                <span>{fee.toFixed(0)} DH</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section id="popular-section">
              <div className="section-head-modern">
                <div className="section-head-title-wrap">
                  <h3 className="section-title-modern">
                    Les plus populaires
                    <button
                      type="button"
                      onClick={() => setSectionInfo(SECTION_INFOS.popular)}
                      className="section-info-btn"
                      title="Informations enseignes populaires"
                    >
                      <Info size={16} strokeWidth={2.2} />
                    </button>
                  </h3>
                </div>

                <div className="slider-pc-controls">
                  <button
                    type="button"
                    onClick={() => slide(popularSliderRef, "left")}
                    className="slider-control-arrow"
                    title="Précédent"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => slide(popularSliderRef, "right")}
                    className="slider-control-arrow"
                    title="Suivant"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div ref={popularSliderRef} className="slider-track">
                {popularRestaurants.map((restaurant) => (
                  <div key={`pop-${restaurant.id}`} className="slider-card-item">
                    {renderRestaurantCard(restaurant)}
                  </div>
                ))}
              </div>
            </section>

            <section className="foodi-ad-section">
              <div className="foodi-ad-card">
                <div className="foodi-ad-content">
                  <span className="foodi-ad-pill">
                    <Sparkles size={13} /> Application Foodi
                  </span>
                  <h3 className="foodi-ad-title">
                    Commandez plus vite sur l'App Foodi
                  </h3>
                  <p className="foodi-ad-desc">
                    Profitez du suivi en direct de votre livreur, d'offres partenaires exclusives et commandez vos repas préférés en un clin d'œil.
                  </p>
                </div>

                <div className="foodi-ad-image-container">
                  <img
                    src="/images/banners/foodi.png"
                    alt="Foodi App Promo"
                    className="foodi-ad-img"
                  />
                </div>
              </div>
            </section>

            <section id="all-restaurants-section">
              <div className="section-head-modern">
                <div className="section-head-title-wrap">
                  <h3 className="section-title-modern">
                    Tous les restaurants
                    <button
                      type="button"
                      onClick={() => setSectionInfo(SECTION_INFOS.all)}
                      className="section-info-btn"
                      title="Informations restaurants partenaires"
                    >
                      <Info size={16} strokeWidth={2.2} />
                    </button>
                  </h3>
                  <p className="section-sub-modern">
                    {restaurants.length} enseignes disponibles à Agadir
                  </p>
                </div>
                <Link
                  to={user.isLoggedIn ? "/restaurants" : "/login?redirect=/restaurants"}
                  className="section-view-all-link"
                >
                  <span>Découvrir tout</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="restaurants-grid-4col">
                {paginatedRestaurants.map((restaurant) => renderRestaurantCard(restaurant))}
              </div>

              {visibleCount < restaurants.length ? (
                <div
                  key={`sentinel-${visibleCount}`}
                  ref={sentinelCallback}
                  className="infinite-scroll-sentinel"
                >
                  <div className="infinite-scroll-loading">
                    <span className="infinite-scroll-dot" />
                    <span className="infinite-scroll-dot" />
                    <span className="infinite-scroll-dot" />
                    <span>Chargement de nouveaux restaurants...</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                  <div className="infinite-scroll-end">
                    <span>✨ Tous les {restaurants.length} restaurants sont affichés</span>
                  </div>
                </div>
              )}
            </section>

            <section className="partner-recruitment-section">
              <div className="partner-recruitment-grid">
                <div className="partner-recruitment-card driver-card">
                  <div className="partner-recruitment-content">
                    <span className="partner-recruitment-pill">
                      <Bike size={13} /> Devenez Coursier
                    </span>
                    <h3 className="partner-recruitment-title">
                      Rejoignez notre flotte de livreurs
                    </h3>
                    <p className="partner-recruitment-desc">
                      Profitez d'horaires flexibles, de paiements rapides et de primes avantageuses en livrant avec Foodi à Agadir.
                    </p>
                    <Link to="/login" className="partner-recruitment-btn">
                      <span>Postuler comme coursier</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  <div className="partner-recruitment-img-wrap">
                    <img
                      src="/images/banners/joinus.png"
                      alt="Devenez coursier Foodi"
                      className="partner-recruitment-img"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>

                <div className="partner-recruitment-card restaurant-card-partner">
                  <div className="partner-recruitment-content">
                    <span className="partner-recruitment-pill">
                      <Sparkles size={13} /> Devenez Partenaire
                    </span>
                    <h3 className="partner-recruitment-title">
                      Enregistrez votre restaurant
                    </h3>
                    <p className="partner-recruitment-desc">
                      Augmentez votre visibilité, attirez des milliers de nouveaux clients et développez vos ventes à emporter et en livraison.
                    </p>
                    <Link to="/login" className="partner-recruitment-btn">
                      <span>Inscrire mon restaurant</span>
                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  <div className="partner-recruitment-img-wrap">
                    <img
                      src="/images/banners/restau.jpg"
                      alt="Inscrivez votre restaurant sur Foodi"
                      className="partner-recruitment-img"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {sectionInfo && (
        <div className="modal-overlay" onClick={() => setSectionInfo(null)}>
          <div className="section-info-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="section-info-modal-header">
              <div>
                <span className="section-info-modal-badge">{sectionInfo.badge}</span>
                <h4 className="section-info-modal-title">{sectionInfo.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSectionInfo(null)}
                className="section-info-modal-close-btn"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="section-info-modal-desc">{sectionInfo.description}</p>

            <div className="section-info-modal-list">
              {sectionInfo.highlights.map((item, idx) => (
                <div key={idx} className="section-info-modal-item">
                  <span className="section-info-modal-item-icon">{item.icon}</span>
                  <div>
                    <h5 className="section-info-modal-item-title">{item.title}</h5>
                    <p className="section-info-modal-item-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSectionInfo(null)}
              className="section-info-modal-action-btn"
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
