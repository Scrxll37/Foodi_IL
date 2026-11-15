import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Bike, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertCircle, 
  Send,
  Loader2,
  FileCheck
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

  const [fullName, setFullName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [cinNumber, setCinNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "scooter" | "bicycle" | "car">("motorcycle");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [zone, setZone] = useState("Centre-Ville");
  const [availability, setAvailability] = useState("full_time");
  
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

    if (!cinNumber.trim()) {
      setErrorMessage("Veuillez renseigner votre numéro de CIN.");
      return;
    }

    if (vehicleType !== "bicycle" && !licenseNumber.trim()) {
      setErrorMessage("Le numéro de permis est obligatoire pour les véhicules motorisés.");
      return;
    }

    setIsSubmitting(true);
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
            <span className="text-[#0B1020]">Devenir Coursier Partenaire</span>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#0B1020] via-[#161D31] to-[#0B1020] text-white p-6 sm:p-10 shadow-xl border border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A00]/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A00]/20 border border-[#FF5A00]/30 text-[#FF5A00] text-xs font-black tracking-wide uppercase">
                <Bike size={14} /> Flotte Agadir
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Livrez avec Foodi et augmentez vos revenus
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Rejoignez la première plateforme de livraison à Agadir. Choisissez vos horaires, soyez payé chaque semaine et profitez d'une flexibilité totale.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <Clock size={13} />
                    <span>100% Flexible</span>
                  </div>
                  <p className="text-[11px] text-white/60">Vous décidez quand vous roulez</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <DollarSign size={13} />
                    <span>Paiements réguliers</span>
                  </div>
                  <p className="text-[11px] text-white/60">Virements chaque semaine</p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#FF5A00]">
                    <ShieldCheck size={13} />
                    <span>Support dédié</span>
                  </div>
                  <p className="text-[11px] text-white/60">Assistance directe à Agadir</p>
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
                <h2 className="text-2xl font-black text-[#0B1020]">Candidature soumise avec succès !</h2>
                <p className="text-xs sm:text-sm text-[#7A8194] leading-relaxed">
                  Merci <span className="font-bold text-[#0B1020]">{fullName || user.name}</span>. Votre dossier a été enregistré dans notre système. Notre coordinateur des opérations vous appellera au <span className="font-bold text-[#0B1020]">{phone || user.phone}</span> sous 48 heures pour finaliser votre activation.
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
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#0B1020] flex items-center gap-2">
                  <FileCheck className="text-[#FF5A00]" size={20} />
                  Formulaire de candidature
                </h2>
                <p className="text-xs text-[#7A8194] mt-1">
                  Complétez ces informations pour enregistrer votre profil coursier à Agadir.
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
                  1. Informations Personnelles
                </h3>
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

                  <div className="space-y-1.5">
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
              </div>

              <div className="space-y-4 pt-4 border-t border-[#0B1020]/8">
                <h3 className="text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  2. Véhicule & Permis
                </h3>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Marque du véhicule</label>
                    <input
                      type="text"
                      value={vehicleBrand}
                      onChange={(e) => setVehicleBrand(e.target.value)}
                      placeholder="Ex: Peugeot, Yamaha, Sym..."
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#0B1020]">Modèle</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ex: Kisbee 50, Neos..."
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors"
                    />
                  </div>

                  {vehicleType !== "bicycle" && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0B1020]">Numéro de permis</label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="Ex: 12/345678"
                          required
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#0B1020]">Matricule / Plaque</label>
                        <input
                          type="text"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          placeholder="Ex: 12345-A-33"
                          className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] border border-[#0B1020]/10 text-xs font-bold text-[#0B1020] focus:outline-hidden focus:border-[#FF5A00] transition-colors uppercase"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#0B1020]/8">
                <h3 className="text-xs font-black uppercase text-[#7A8194] tracking-wider">
                  3. Disponibilité
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "full_time", label: "Temps plein", desc: "Plus de 35h / semaine" },
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

              <div className="pt-4 border-t border-[#0B1020]/8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-[#7A8194]">
                  <ShieldCheck size={16} className="text-[#10B981] shrink-0" />
                  <span>Vos données sont protégées et traitées uniquement par Foodi Agadir.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="foodi-btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Envoyer ma candidature</span>
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

export default DriverApplyPage;
