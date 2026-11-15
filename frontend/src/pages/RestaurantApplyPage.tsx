import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Store, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle, 
  Send,
  Loader2,
  UtensilsCrossed,
  Sparkles
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { HomeHeader } from "../components/HomeHeader";
import { Footer } from "../components/Footer";
import { apiApplyRestaurant } from "../services/api";

const AGADIR_NEIGHBORHOODS = [
  "Talborjt",
  "Centre-Ville",
  "Haut Founty",
  "Sonaba & Cité Suisse",
  "Dakhla",
  "Salam",
  "Bensergao",
  "Anza",
  "Inezgane",
  "Dcheira",
  "Tikiouine",
  "Taghazout",
  "Autre quartier"
];

const CUISINES = [
  "Marocain",
  "Fast Food & Burgers",
  "Pizza & Italien",
  "Tacos & Sandwichs",
  "Asiatique & Sushi",
  "Grillades & Chawarma",
  "Café & Desserts",
  "Healthy & Salades",
  "Autre cuisine"
];

export const RestaurantApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [restaurantName, setRestaurantName] = useState("");
  const [managerName, setManagerName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("Talborjt");
  const [cuisine, setCuisine] = useState("Marocain");
  const [rcNumber, setRcNumber] = useState("");
  const [iceNumber, setIceNumber] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [user.isLoggedIn, navigate, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!restaurantName.trim()) {
      setErrorMessage("Veuillez renseigner le nom de votre établissement.");
      return;
    }

    if (!managerName.trim()) {
      setErrorMessage("Veuillez renseigner le nom du gérant ou responsable.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Veuillez renseigner un numéro de téléphone de contact.");
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Veuillez renseigner l'adresse du restaurant à Agadir.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiApplyRestaurant({
        user_id: user.id,
        name: restaurantName.trim(),
        manager_name: managerName.trim(),
        phone_number: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        neighborhood,
        cuisine,
        rc_number: rcNumber.trim() || undefined,
        ice_number: iceNumber.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.message || "Une erreur est survenue lors de l'envoi de la demande.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Impossible de joindre le serveur. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <div>
        <HomeHeader showBackButton />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A8194]">
            <Link to="/" className="hover:text-[#FF5A00] flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Accueil
            </Link>
            <span>/</span>
            <span className="text-[#0B1020]">Devenir Restaurant Partenaire</span>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0B1020] via-[#161D31] to-[#0B1020] text-white p-6 sm:p-10 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A00]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A00]/20 border border-[#FF5A00]/30 text-[#FF5A00] text-xs font-black tracking-wide uppercase">
                <Sparkles size={14} /> Partenariat Foodi
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Développez vos commandes et votre visibilité à Agadir
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Connectez votre cuisine à des dizaines de milliers de clients gourmands à Agadir, Inezgane et Taghazout. Gestion simplifiée, livreurs dédiés et outils en temps réel.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <TrendingUp size={13} />
                    <span>+40% de ventes</span>
                  </div>
                  <p className="text-[11px] text-white/60">Croissance moyenne dès le 1er mois</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <Users size={13} />
                    <span>Visibilité locale</span>
                  </div>
                  <p className="text-[11px] text-white/60">Large audience ciblée à Agadir</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <Clock size={13} />
                    <span>Mise en ligne rapide</span>
                  </div>
                  <p className="text-[11px] text-white/60">Activation sous 48h chrono</p>
                </div>
              </div>
            </div>
          </div>

          {isSuccess ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#0B1020]/6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-full bg-[#ECFDF5] text-[#10B981] mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 size={42} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-black text-[#0B1020]">Demande transmise avec succès !</h2>
                <p className="text-xs sm:text-sm text-[#7A8194] leading-relaxed">
                  Merci <span className="font-bold text-[#0B1020]">{managerName}</span>. Votre demande pour <span className="font-bold text-[#0B1020]">{restaurantName}</span> a été enregistrée. Notre chargé de partenariats Agadir prendra contact avec vous au <span className="font-bold text-[#0B1020]">{phone}</span> pour configurer votre carte et valider votre compte.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/"
                  className="foodi-btn-primary px-6 py-3 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/20"
                >
                  Retour à l'accueil
                </Link>
                <Link
                  to="/restaurants"
                  className="px-6 py-3 rounded-2xl text-xs font-bold text-[#3B4256] hover:bg-[#FAF8F5] transition-colors"
                >
                  Explorer les restaurants
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-[#0B1020]/6 space-y-8">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0B1020] flex items-center gap-2">
                  <Store className="text-[#FF5A00]" size={20} />
                  Fiche de renseignements de votre établissement
                </h2>
                <p className="text-xs text-[#7A8194] mt-1">
                  Remplissez ce formulaire pour lancer le partenariat avec Foodi.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold flex items-center gap-3">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  1. Informations Restaurant
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Nom de l'établissement</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="Ex: Le Grill d'Or, Pizza Roma..."
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Type de cuisine principale</label>
                    <select
                      value={cuisine}
                      onChange={(e) => setCuisine(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    >
                      {CUISINES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Quartier à Agadir</label>
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    >
                      {AGADIR_NEIGHBORHOODS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Adresse complète</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: 45 Avenue Hassan II, Immeuble B"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-[#0B1020]">Description courte ou spécialités</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentez brièvement vos plats signatures, votre ambiance..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#0B1020]/8">
                <h3 className="text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  2. Contact & Responsable
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Nom du gérant / responsable</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="Ex: Mehdi Alaoui"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Téléphone professionnel</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: 06 12 34 56 78"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Email professionnel</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: contact@restaurant.ma"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#0B1020]/8">
                <h3 className="text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  3. Informations Juridiques (Facultatif)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Numéro RC (Registre du Commerce)</label>
                    <input
                      type="text"
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                      placeholder="Ex: RC 12345/Agadir"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Identifiant Commun de l'Entreprise (ICE)</label>
                    <input
                      type="text"
                      value={iceNumber}
                      onChange={(e) => setIceNumber(e.target.value)}
                      placeholder="Ex: 001234567000089"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#0B1020]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-[#7A8194]">
                  <ShieldCheck size={16} className="text-[#10B981] shrink-0" />
                  <span>Aucun frais d'inscription préalable. Notre équipe vous accompagne pas à pas.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="foodi-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Envoyer la demande</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default RestaurantApplyPage;
