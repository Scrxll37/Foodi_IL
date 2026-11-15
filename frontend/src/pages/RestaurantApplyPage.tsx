import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Store, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle, 
  Send,
  Loader2,
  FileText,
  UploadCloud,
  Check,
  X,
  Camera
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

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("Marocain");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("Talborjt");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [description, setDescription] = useState("");

  const [managerName, setManagerName] = useState(user.name || "");
  const [managerPhone, setManagerPhone] = useState(user.phone || "");
  const [rcNumber, setRcNumber] = useState("");
  const [iceNumber, setIceNumber] = useState("");

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [facadePreview, setFacadePreview] = useState<string>("");
  const [menuPreview, setMenuPreview] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [user.isLoggedIn, navigate, location.pathname]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("La taille maximale par photo est de 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
      setErrorMessage("");
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = (): boolean => {
    if (!restaurantName.trim()) {
      setErrorMessage("Veuillez renseigner le nom de votre établissement.");
      return false;
    }
    if (!address.trim()) {
      setErrorMessage("Veuillez renseigner l'adresse complète du restaurant.");
      return false;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage("Veuillez renseigner un numéro de téléphone de contact.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!managerName.trim()) {
      setErrorMessage("Veuillez renseigner le nom du gérant ou responsable.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 200, behavior: "smooth" });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 200, behavior: "smooth" });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      setErrorMessage("");
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await apiApplyRestaurant({
        user_id: user.id,
        name: restaurantName.trim(),
        manager_name: managerName.trim(),
        phone_number: (phone || managerPhone).trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        neighborhood,
        cuisine,
        rc_number: rcNumber.trim() || undefined,
        ice_number: iceNumber.trim() || undefined,
        description: description.trim() || undefined,
        logo_path: logoPreview || undefined,
        cover_image_path: facadePreview || menuPreview || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.message || "Une erreur est survenue lors de l'envoi.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Impossible de joindre le serveur. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUploadBox = (
    label: string, 
    preview: string, 
    onSet: (val: string) => void, 
    placeholder: string
  ) => {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#0B1020] block">{label}</label>
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#FF5A00] bg-[#FAF8F5] p-2 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <img src={preview} alt="Aperçu" className="w-14 h-14 rounded-xl object-cover border border-[#0B1020]/10" />
              <div className="min-w-0">
                <span className="text-xs font-black text-[#0B1020] flex items-center gap-1.5 truncate">
                  <Check size={14} className="text-[#10B981]" /> Image prête
                </span>
                <span className="text-[11px] text-[#7A8194]">Format validé</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSet("")}
              className="w-8 h-8 rounded-xl bg-white text-[#EF4444] border border-[#0B1020]/10 flex items-center justify-center hover:bg-[#FEF2F2] transition-colors cursor-pointer shrink-0"
              title="Supprimer"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#0B1020]/15 hover:border-[#FF5A00] bg-[#FAF8F5] hover:bg-[#FFF3EA]/30 transition-all cursor-pointer group text-center">
            <UploadCloud size={24} className="text-[#7A8194] group-hover:text-[#FF5A00] transition-colors mb-1.5" />
            <span className="text-xs font-bold text-[#0B1020] group-hover:text-[#FF5A00] transition-colors">
              {placeholder}
            </span>
            <span className="text-[10px] text-[#7A8194] mt-0.5">PNG, JPG ou JPEG (max 5 Mo)</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, onSet)}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <div>
        <HomeHeader showBackButton />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A8194]">
            <Link to="/" className="hover:text-[#FF5A00] flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Accueil
            </Link>
            <span>/</span>
            <span className="text-[#0B1020]">Devenir Restaurant Partenaire</span>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#0B1020]/10 bg-[#161D31] min-h-[200px] sm:min-h-[260px] flex items-end">
            <img
              src="/images/banners/restaurant-banner.jpg"
              alt="Devenir restaurant partenaire Foodi Agadir"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/banners/restau.jpg";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/60 to-transparent pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8 space-y-2 text-white max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A00] text-white text-[11px] font-black uppercase tracking-wider">
                <Store size={13} /> Partenariat Agadir
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Enregistrez votre restaurant sur Foodi
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Rejoignez le réseau Foodi à Agadir. Augmentez vos ventes en livraison et bénéficiez d'une visibilité directe auprès de milliers de clients.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1020]/6">
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, title: "1. Restaurant", icon: Store },
                { step: 2, title: "2. Gérant & Légal", icon: FileText },
                { step: 3, title: "3. Photos & Menu", icon: Camera },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = currentStep === s.step;
                const isDone = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    className={`flex items-center justify-center sm:justify-start gap-2.5 p-2 sm:p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-[#FFF3EA] text-[#FF5A00] font-black border border-[#FF5A00]/30 shadow-2xs"
                        : isDone
                        ? "bg-[#ECFDF5] text-[#10B981] font-bold"
                        : "text-[#7A8194] font-medium"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        isActive
                          ? "bg-[#FF5A00] text-white font-black"
                          : isDone
                          ? "bg-[#10B981] text-white font-bold"
                          : "bg-[#FAF8F5] text-[#7A8194] border border-[#0B1020]/10"
                      }`}
                    >
                      {isDone ? <Check size={14} /> : s.step}
                    </div>
                    <span className="text-xs hidden sm:inline truncate">{s.title}</span>
                  </div>
                );
              })}
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
                  Merci <span className="font-bold text-[#0B1020]">{managerName}</span>. Votre dossier pour <span className="font-bold text-[#0B1020]">{restaurantName}</span> a été enregistré. Notre responsable partenariats Agadir vous appellera au <span className="font-bold text-[#0B1020]">{phone}</span> pour finaliser la mise en ligne de votre carte.
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
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold flex items-center gap-3 animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#0B1020]/8 pb-4">
                    <h2 className="text-lg font-black text-[#0B1020] flex items-center gap-2">
                      <Store className="text-[#FF5A00]" size={20} />
                      Étape 1 : Coordonnées du Restaurant
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Renseignez les détails d'identification de votre établissement.
                    </p>
                  </div>

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
                        placeholder="Ex: 45 Avenue Hassan II, Talborjt"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Téléphone du restaurant</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 05 28 84 00 00"
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

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-[#0B1020]">Description courte ou spécialités</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Présentez brièvement vos plats signatures, votre univers..."
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#0B1020]/8 pb-4">
                    <h2 className="text-lg font-black text-[#0B1020] flex items-center gap-2">
                      <FileText className="text-[#FF5A00]" size={20} />
                      Étape 2 : Responsable & Informations Juridiques
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Informations sur le gérant et données administratives.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Nom complet du gérant</label>
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
                      <label className="text-xs font-bold text-[#0B1020]">Téléphone portable direct</label>
                      <input
                        type="tel"
                        value={managerPhone}
                        onChange={(e) => setManagerPhone(e.target.value)}
                        placeholder="Ex: 06 12 34 56 78"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Numéro RC (Registre du Commerce)</label>
                      <input
                        type="text"
                        value={rcNumber}
                        onChange={(e) => setRcNumber(e.target.value)}
                        placeholder="Ex: RC 12345/Agadir"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Numéro ICE</label>
                      <input
                        type="text"
                        value={iceNumber}
                        onChange={(e) => setIceNumber(e.target.value)}
                        placeholder="Ex: 001234567000089"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#0B1020]/8 pb-4">
                    <h2 className="text-lg font-black text-[#0B1020] flex items-center gap-2">
                      <Camera className="text-[#FF5A00]" size={20} />
                      Étape 3 : Photos & Identité Visuelle
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Téléversez votre logo et des photos de votre restaurant.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {renderUploadBox(
                      "Logo officiel du restaurant",
                      logoPreview,
                      setLogoPreview,
                      "Cliquer pour téléverser votre logo"
                    )}

                    {renderUploadBox(
                      "Photo de la devanture / façade",
                      facadePreview,
                      setFacadePreview,
                      "Cliquer pour téléverser la photo de devanture"
                    )}

                    <div className="sm:col-span-2">
                      {renderUploadBox(
                        "Photo du menu ou plat signature",
                        menuPreview,
                        setMenuPreview,
                        "Cliquer pour téléverser votre menu ou plat signature"
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-[#0B1020]/8 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-6 py-3.5 rounded-2xl border border-[#0B1020]/10 bg-[#FAF8F5] hover:bg-[#F3EFEA] text-xs font-bold text-[#0B1020] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={15} />
                    <span>Précédent</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="foodi-btn-primary px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/25 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Étape suivante</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="foodi-btn-primary px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Enregistrement de la demande...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Envoyer la demande</span>
                      </>
                    )}
                  </button>
                )}
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
