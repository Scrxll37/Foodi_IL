import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Bike, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle, 
  Send,
  Loader2,
  User,
  FileText,
  UploadCloud,
  Check,
  X
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { HomeHeader } from "../components/HomeHeader";
import { Footer } from "../components/Footer";
import { apiApplyDriver } from "../services/api";

const AGADIR_ZONES = [
  "Talborjt",
  "Centre-Ville",
  "Haut Founty",
  "Sonaba & Cité Suisse",
  "Dakhla & Salam",
  "Bensergao",
  "Anza",
  "Inezgane & Dcheira",
  "Tikiouine",
  "Autre quartier d'Agadir"
];

export const DriverApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [cinNumber, setCinNumber] = useState("");
  const [zone, setZone] = useState("Centre-Ville");
  const [availability, setAvailability] = useState("full_time");

  const [licenseNumber, setLicenseNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [licensePhotoPreview, setLicensePhotoPreview] = useState<string>("");
  const [cinPhotoPreview, setCinPhotoPreview] = useState<string>("");

  const [vehicleType, setVehicleType] = useState<"motorcycle" | "scooter" | "bicycle" | "car">("motorcycle");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string>("");
  const [regCardPreview, setRegCardPreview] = useState<string>("");

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
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage("Veuillez renseigner votre nom complet.");
      return false;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage("Veuillez renseigner un numéro de téléphone valide.");
      return false;
    }
    if (!cinNumber.trim()) {
      setErrorMessage("Veuillez renseigner votre numéro de CIN.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep2 = (): boolean => {
    if (vehicleType !== "bicycle" && !licenseNumber.trim()) {
      setErrorMessage("Le numéro de permis est obligatoire pour les véhicules motorisés.");
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
      const res = await apiApplyDriver({
        user_id: user.id,
        full_name: fullName.trim() || user.name,
        phone: phone.trim() || user.phone,
        cin_number: cinNumber.trim().toUpperCase(),
        vehicle_type: vehicleType,
        vehicle_brand: vehicleBrand.trim() || undefined,
        vehicle_model: vehicleModel.trim() || undefined,
        license_plate: licensePlate.trim().toUpperCase() || undefined,
        license_number: licenseNumber.trim().toUpperCase() || undefined,
        zone,
        avatar_path: avatarPreview || undefined,
        license_photo_path: licensePhotoPreview || undefined,
        cin_photo_path: cinPhotoPreview || undefined,
        registration_card_path: regCardPreview || vehiclePhotoPreview || undefined,
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
                  <Check size={14} className="text-[#10B981]" /> Fichier prêt
                </span>
                <span className="text-[11px] text-[#7A8194]">Format image validé</span>
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
            <span className="text-[#0B1020]">Devenir Coursier Partenaire</span>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#0B1020]/10 bg-[#161D31] min-h-[200px] sm:min-h-[260px] flex items-end">
            <img
              src="/images/banners/driver-banner.jpg"
              alt="Devenir coursier Foodi Agadir"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/banners/joinus.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/60 to-transparent pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8 space-y-2 text-white max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A00] text-white text-[11px] font-black uppercase tracking-wider">
                <Bike size={13} /> Flotte Agadir
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Devenez coursier partenaire Foodi
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Remplissez les 3 étapes pour rejoindre notre flotte à Agadir. Horaires libres, gains attractifs et assistance continue.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0B1020]/6">
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, title: "1. Infos Générales", icon: User },
                { step: 2, title: "2. Profil & Permis", icon: FileText },
                { step: 3, title: "3. Véhicule & Photos", icon: Bike },
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
                <h2 className="text-2xl font-black text-[#0B1020]">Candidature soumise avec succès !</h2>
                <p className="text-xs sm:text-sm text-[#7A8194] leading-relaxed">
                  Merci <span className="font-bold text-[#0B1020]">{fullName || user.name}</span>. Vos informations et documents ont été enregistrés avec succès. Notre coordinateur des opérations vous appellera au <span className="font-bold text-[#0B1020]">{phone || user.phone}</span> sous 48 heures.
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
                  to="/orders"
                  className="px-6 py-3 rounded-2xl text-xs font-bold text-[#3B4256] hover:bg-[#FAF8F5] transition-colors"
                >
                  Mes commandes
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
                      <User className="text-[#FF5A00]" size={20} />
                      Étape 1 : Informations Générales
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Renseignez vos coordonnées de contact et vos informations personnelles.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Nom et prénom</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Yassine El Amrani"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Numéro de téléphone</label>
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
                      <label className="text-xs font-bold text-[#0B1020]">Adresse Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: yassine@gmail.com"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Numéro CIN</label>
                      <input
                        type="text"
                        value={cinNumber}
                        onChange={(e) => setCinNumber(e.target.value)}
                        placeholder="Ex: JC123456"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0B1020]">Zone préférée à Agadir</label>
                      <select
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      >
                        {AGADIR_ZONES.map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#0B1020]">Disponibilité souhaitée</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "full_time", label: "Temps plein", desc: "35h+ / semaine" },
                        { id: "part_time", label: "Temps partiel", desc: "15h à 25h / semaine" },
                        { id: "weekends", label: "Soirs & Week-ends", desc: "Complément de revenus" },
                      ].map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAvailability(a.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            availability === a.id
                              ? "bg-[#FFF3EA] border-[#FF5A00] text-[#0B1020] shadow-xs"
                              : "bg-[#FAF8F5] border-transparent text-[#7A8194] hover:bg-[#F3EFEA]"
                          }`}
                        >
                          <div className="text-xs font-black text-[#0B1020]">{a.label}</div>
                          <div className="text-[11px] text-[#7A8194] mt-0.5">{a.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#0B1020]/8 pb-4">
                    <h2 className="text-lg font-black text-[#0B1020] flex items-center gap-2">
                      <FileText className="text-[#FF5A00]" size={20} />
                      Étape 2 : Profil & Pièces d'identité
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Téléchargez votre photo de profil ainsi que vos pièces justificatives.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {renderUploadBox(
                      "Photo de profil (visage net)",
                      avatarPreview,
                      setAvatarPreview,
                      "Cliquer pour téléverser votre photo de profil"
                    )}

                    {renderUploadBox(
                      "Photo CIN (Recto / Verso)",
                      cinPhotoPreview,
                      setCinPhotoPreview,
                      "Cliquer pour téléverser votre carte CIN"
                    )}

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-[#0B1020]">Numéro de permis de conduire</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="Ex: 12/345678"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      {renderUploadBox(
                        "Photo du permis de conduire",
                        licensePhotoPreview,
                        setLicensePhotoPreview,
                        "Cliquer pour téléverser votre permis de conduire"
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#0B1020]/8 pb-4">
                    <h2 className="text-lg font-black text-[#0B1020] flex items-center gap-2">
                      <Bike className="text-[#FF5A00]" size={20} />
                      Étape 3 : Véhicule & Documents
                    </h2>
                    <p className="text-xs text-[#7A8194] mt-1">
                      Indiquez votre moyen de transport et téléversez ses photos.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0B1020]">Type de véhicule</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "motorcycle", label: "Moto", icon: "🏍️" },
                        { id: "scooter", label: "Scooter", icon: "🛵" },
                        { id: "bicycle", label: "Vélo", icon: "🚲" },
                        { id: "car", label: "Voiture", icon: "🚗" },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVehicleType(v.id as any)}
                          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            vehicleType === v.id
                              ? "bg-[#FFF3EA] border-[#FF5A00] text-[#FF5A00] font-black shadow-xs"
                              : "bg-[#FAF8F5] border-transparent text-[#3B4256] font-bold hover:bg-[#F3EFEA]"
                          }`}
                        >
                          <span className="text-xl">{v.icon}</span>
                          <span className="text-xs">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Marque du véhicule</label>
                      <input
                        type="text"
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="Ex: Yamaha, Peugeot..."
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Modèle</label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Ex: Kisbee, Jog, SH..."
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#0B1020]">Plaque / Matricule</label>
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="Ex: 12345-A-33"
                        className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                    {renderUploadBox(
                      "Photo de votre véhicule",
                      vehiclePhotoPreview,
                      setVehiclePhotoPreview,
                      "Cliquer pour téléverser la photo de votre véhicule"
                    )}

                    {renderUploadBox(
                      "Photo Carte Grise ou Assurance",
                      regCardPreview,
                      setRegCardPreview,
                      "Cliquer pour téléverser la carte grise / assurance"
                    )}
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
                        <span>Envoi de votre dossier...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Soumettre ma candidature</span>
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

export default DriverApplyPage;
