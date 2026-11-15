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

export const DriverApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [cinNumber, setCinNumber] = useState("");

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
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      setErrorMessage("");
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
      <div className="apply-form-group">
        <label className="apply-label">{label}</label>
        {preview ? (
          <div className="apply-upload-preview">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <img src={preview} alt="Aperçu" style={{ width: "54px", height: "54px", borderRadius: "12px", objectFit: "cover" }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#0B1020", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Check size={14} color="#10B981" /> Photo prête
                </span>
                <span style={{ fontSize: "11px", color: "#7A8194" }}>Format image validé</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSet("")}
              style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#FFFFFF", color: "#EF4444", border: "1px solid rgba(11,16,32,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              title="Supprimer"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <label className="apply-upload-dropzone">
            <UploadCloud size={24} color="#FF5A00" style={{ marginBottom: "6px" }} />
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0B1020" }}>
              {placeholder}
            </span>
            <span style={{ fontSize: "11px", color: "#7A8194", marginTop: "2px" }}>PNG, JPG ou JPEG (max 5 Mo)</span>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, onSet)}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="apply-page-root">
      <div>
        <HomeHeader showBackButton />

        <main className="apply-main-full">
          <div className="apply-breadcrumb">
            <Link to="/">
              <ArrowLeft size={14} /> Accueil
            </Link>
            <span>/</span>
            <span style={{ color: "#0B1020" }}>Devenir Coursier Partenaire</span>
          </div>

          <div className="apply-banner">
            <img
              src="/images/banners/driver-banner.jpg"
              alt="Devenir coursier Foodi Agadir"
              className="apply-banner-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/banners/joinus.png";
              }}
            />
            <div className="apply-banner-overlay" />

            <div className="apply-banner-content">
              <span className="apply-badge">
                <Bike size={13} /> Flotte Agadir
              </span>
              <h1 className="apply-banner-title">
                Devenez coursier partenaire Foodi
              </h1>
              <p className="apply-banner-subtitle">
                Remplissez les 3 étapes pour rejoindre notre flotte à Agadir. Horaires libres, gains attractifs et assistance continue.
              </p>
            </div>
          </div>

          <div className="apply-stepper-bar">
            {[
              { step: 1, title: "1. Infos Générales", icon: User },
              { step: 2, title: "2. Profil & Permis", icon: FileText },
              { step: 3, title: "3. Véhicule & Photos", icon: Bike },
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isDone = currentStep > s.step;
              return (
                <div
                  key={s.step}
                  className={`apply-step-node ${isActive ? "active" : isDone ? "completed" : ""}`}
                >
                  <div className="apply-step-number">
                    {isDone ? <Check size={14} /> : s.step}
                  </div>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                </div>
              );
            })}
          </div>

          {isSuccess ? (
            <div className="apply-success-box">
              <div className="apply-success-icon">
                <CheckCircle2 size={40} />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#0B1020", margin: "0 0 8px 0" }}>
                Candidature soumise avec succès !
              </h2>
              <p style={{ fontSize: "13px", color: "#7A8194", maxWidth: "480px", margin: "0 auto 24px auto", lineHeight: 1.6 }}>
                Merci <strong style={{ color: "#0B1020" }}>{fullName || user.name}</strong>. Vos informations et documents ont été enregistrés avec succès. Notre coordinateur des opérations vous appellera au <strong style={{ color: "#0B1020" }}>{phone || user.phone}</strong> sous 48 heures.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link to="/" className="apply-btn-submit" style={{ textDecoration: "none" }}>
                  Retour à l'accueil
                </Link>
                <Link to="/orders" className="apply-btn-prev" style={{ textDecoration: "none" }}>
                  Mes commandes
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="apply-form-box">
              {errorMessage && (
                <div className="apply-error-banner">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <div className="apply-section-header">
                    <h2 className="apply-section-title">
                      <User color="#FF5A00" size={20} />
                      Étape 1 : Informations Générales
                    </h2>
                    <p className="apply-section-desc">
                      Renseignez vos coordonnées de contact et informations personnelles.
                    </p>
                  </div>

                  <div className="apply-grid-2">
                    <div className="apply-form-group">
                      <label className="apply-label">Nom et prénom</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex: Yassine El Amrani"
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Numéro de téléphone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 06 12 34 56 78"
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Adresse Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: yassine@gmail.com"
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Numéro CIN</label>
                      <input
                        type="text"
                        value={cinNumber}
                        onChange={(e) => setCinNumber(e.target.value)}
                        placeholder="Ex: JC123456"
                        required
                        className="apply-input"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="apply-section-header">
                    <h2 className="apply-section-title">
                      <FileText color="#FF5A00" size={20} />
                      Étape 2 : Profil & Pièces d'identité
                    </h2>
                    <p className="apply-section-desc">
                      Téléchargez votre photo de profil ainsi que vos pièces justificatives.
                    </p>
                  </div>

                  <div className="apply-grid-2">
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

                    <div className="apply-form-group apply-col-full">
                      <label className="apply-label">Numéro de permis de conduire</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="Ex: 12/345678"
                        className="apply-input"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>

                    <div className="apply-col-full">
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
                <div>
                  <div className="apply-section-header">
                    <h2 className="apply-section-title">
                      <Bike color="#FF5A00" size={20} />
                      Étape 3 : Véhicule & Documents
                    </h2>
                    <p className="apply-section-desc">
                      Indiquez votre moyen de transport et téléversez ses photos.
                    </p>
                  </div>

                  <div className="apply-form-group" style={{ marginBottom: "16px" }}>
                    <label className="apply-label">Type de véhicule</label>
                    <div className="apply-grid-4">
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
                          className={`apply-vehicle-option ${vehicleType === v.id ? "selected" : ""}`}
                        >
                          <span style={{ fontSize: "22px" }}>{v.icon}</span>
                          <span>{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="apply-grid-3">
                    <div className="apply-form-group">
                      <label className="apply-label">Marque du véhicule</label>
                      <input
                        type="text"
                        value={vehicleBrand}
                        onChange={(e) => setVehicleBrand(e.target.value)}
                        placeholder="Ex: Yamaha, Peugeot..."
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Modèle</label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Ex: Kisbee, Jog, SH..."
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Plaque / Matricule</label>
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="Ex: 12345-A-33"
                        className="apply-input"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  </div>

                  <div className="apply-grid-2" style={{ marginTop: "16px" }}>
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

              <div className="apply-nav-bar">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="apply-btn-prev"
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
                    className="apply-btn-next"
                  >
                    <span>Étape suivante</span>
                    <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="apply-btn-submit"
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
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
