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
      <div className="apply-form-group">
        <label className="apply-label">{label}</label>
        {preview ? (
          <div className="apply-upload-preview">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <img src={preview} alt="Aperçu" style={{ width: "54px", height: "54px", borderRadius: "12px", objectFit: "cover" }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#0B1020", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Check size={14} color="#10B981" /> Image prête
                </span>
                <span style={{ fontSize: "11px", color: "#7A8194" }}>Format validé</span>
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
            <span style={{ color: "#0B1020" }}>Devenir Restaurant Partenaire</span>
          </div>

          <div className="apply-banner">
            <img
              src="/images/banners/restaurant-banner.jpg"
              alt="Devenir restaurant partenaire Foodi Agadir"
              className="apply-banner-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/banners/restau.jpg";
              }}
            />
            <div className="apply-banner-overlay" />

            <div className="apply-banner-content">
              <span className="apply-badge">
                <Store size={13} /> Partenariat Agadir
              </span>
              <h1 className="apply-banner-title">
                Enregistrez votre restaurant sur Foodi
              </h1>
              <p className="apply-banner-subtitle">
                Rejoignez le réseau Foodi à Agadir. Augmentez vos ventes en livraison et bénéficiez d'une visibilité directe auprès de milliers de clients.
              </p>
            </div>
          </div>

          <div className="apply-stepper-bar">
            {[
              { step: 1, title: "1. Restaurant", icon: Store },
              { step: 2, title: "2. Gérant & Légal", icon: FileText },
              { step: 3, title: "3. Photos & Menu", icon: Camera },
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
                Demande transmise avec succès !
              </h2>
              <p style={{ fontSize: "13px", color: "#7A8194", maxWidth: "480px", margin: "0 auto 24px auto", lineHeight: 1.6 }}>
                Merci <strong style={{ color: "#0B1020" }}>{managerName}</strong>. Votre dossier pour <strong style={{ color: "#0B1020" }}>{restaurantName}</strong> a été enregistré. Notre responsable partenariats Agadir vous appellera au <strong style={{ color: "#0B1020" }}>{phone}</strong> pour finaliser la mise en ligne de votre carte.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <Link to="/" className="apply-btn-submit" style={{ textDecoration: "none" }}>
                  Retour à l'accueil
                </Link>
                <Link to="/restaurants" className="apply-btn-prev" style={{ textDecoration: "none" }}>
                  Explorer les restaurants
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
                      <Store color="#FF5A00" size={20} />
                      Étape 1 : Coordonnées du Restaurant
                    </h2>
                    <p className="apply-section-desc">
                      Renseignez les détails d'identification de votre établissement.
                    </p>
                  </div>

                  <div className="apply-grid-2">
                    <div className="apply-form-group">
                      <label className="apply-label">Nom de l'établissement</label>
                      <input
                        type="text"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="Ex: Le Grill d'Or, Pizza Roma..."
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Type de cuisine principale</label>
                      <select
                        value={cuisine}
                        onChange={(e) => setCuisine(e.target.value)}
                        className="apply-select"
                      >
                        {CUISINES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Quartier à Agadir</label>
                      <select
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="apply-select"
                      >
                        {AGADIR_NEIGHBORHOODS.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Adresse complète</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: 45 Avenue Hassan II, Talborjt"
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Téléphone du restaurant</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 05 28 84 00 00"
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Email professionnel</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: contact@restaurant.ma"
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group apply-col-full">
                      <label className="apply-label">Description courte ou spécialités</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Présentez brièvement vos plats signatures, votre univers..."
                        className="apply-textarea"
                        style={{ resize: "none" }}
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
                      Étape 2 : Responsable & Informations Juridiques
                    </h2>
                    <p className="apply-section-desc">
                      Informations sur le gérant et données administratives.
                    </p>
                  </div>

                  <div className="apply-grid-2">
                    <div className="apply-form-group">
                      <label className="apply-label">Nom complet du gérant</label>
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="Ex: Mehdi Alaoui"
                        required
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Téléphone portable direct</label>
                      <input
                        type="tel"
                        value={managerPhone}
                        onChange={(e) => setManagerPhone(e.target.value)}
                        placeholder="Ex: 06 12 34 56 78"
                        className="apply-input"
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Numéro RC (Registre du Commerce)</label>
                      <input
                        type="text"
                        value={rcNumber}
                        onChange={(e) => setRcNumber(e.target.value)}
                        placeholder="Ex: RC 12345/Agadir"
                        className="apply-input"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>

                    <div className="apply-form-group">
                      <label className="apply-label">Numéro ICE</label>
                      <input
                        type="text"
                        value={iceNumber}
                        onChange={(e) => setIceNumber(e.target.value)}
                        placeholder="Ex: 001234567000089"
                        className="apply-input"
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <div className="apply-section-header">
                    <h2 className="apply-section-title">
                      <Camera color="#FF5A00" size={20} />
                      Étape 3 : Photos & Identité Visuelle
                    </h2>
                    <p className="apply-section-desc">
                      Téléversez votre logo et des photos de votre restaurant.
                    </p>
                  </div>

                  <div className="apply-grid-2">
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

                    <div className="apply-col-full">
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
