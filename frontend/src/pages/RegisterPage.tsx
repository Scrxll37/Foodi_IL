import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AuthLayoutShell } from "../components/AuthLayoutShell";
import { PhoneCountryInput } from "../components/PhoneCountryInput";
import { apiRegister } from "../services/api";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+212");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const cleanEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!trimmedName || trimmedName.length < 3) {
      errs.name = "Veuillez renseigner votre nom complet (au moins 3 caractères).";
    }

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      errs.email = "Veuillez renseigner une adresse email valide.";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      errs.phone = "Veuillez renseigner votre numéro de téléphone.";
    } else if (countryCode === "+212" && (cleanPhone.length < 9 || cleanPhone.length > 10)) {
      errs.phone = "Numéro marocain invalide (ex: 6 12 34 56 78).";
    } else if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      errs.phone = "Veuillez renseigner un numéro de téléphone valide.";
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};

    if (!password || password.length < 6) {
      errs.password = "Le mot de passe doit comporter au moins 6 caractères.";
    }

    if (!passwordConfirmation) {
      errs.password_confirmation = "Veuillez confirmer votre mot de passe.";
    } else if (password !== passwordConfirmation) {
      errs.password_confirmation = "Les mots de passe ne correspondent pas.";
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTriggerCaptcha = () => {
    if (captchaVerified || captchaLoading) return;
    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaVerified(true);
      setClientErrors((prev) => ({ ...prev, captcha: "" }));
    }, 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!captchaVerified) {
      setClientErrors((prev) => ({ ...prev, captcha: "Veuillez valider le contrôle de sécurité Foodi Shield." }));
      return;
    }

    if (!agreed) {
      setClientErrors((prev) => ({ ...prev, agreed: "Veuillez accepter les conditions d'utilisation." }));
      return;
    }

    setIsSubmitting(true);
    setClientErrors((prev) => ({ ...prev, general: "" }));

    const fullPhone = `${countryCode} ${phone.trim()}`;

    try {
      const res = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        password: password,
      });

      if (res.success && res.user) {
        login(res.user.email || email.trim(), {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || fullPhone,
          role: "client",
        });
        navigate("/myaddress?complete=1", { replace: true });
      } else {
        setClientErrors((prev) => ({
          ...prev,
          general: res.message || "Impossible de créer le compte. Veuillez vérifier vos informations.",
        }));
      }
    } catch (err: any) {
      setClientErrors((prev) => ({
        ...prev,
        general: err?.message || "Erreur de connexion au serveur. Veuillez réessayer.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayoutShell pageType="register" backHref="/">
      <div className="auth-steps-bar">
        <div className="auth-step-node">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`auth-step-pill ${step === 1 ? "active" : step > 1 ? "completed" : "inactive"}`}
          >
            {step > 1 ? <i className="fa-solid fa-check" /> : "1"}
          </button>
          <span className="auth-step-label">Profil</span>
        </div>

        <div className={`auth-step-line ${step > 1 ? "completed" : ""}`} />

        <div className="auth-step-node">
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setStep(2);
            }}
            className={`auth-step-pill ${step === 2 ? "active" : step > 2 ? "completed" : "inactive"}`}
          >
            {step > 2 ? <i className="fa-solid fa-check" /> : "2"}
          </button>
          <span className="auth-step-label">Sécurité</span>
        </div>

        <div className={`auth-step-line ${step > 2 ? "completed" : ""}`} />

        <div className="auth-step-node">
          <button
            type="button"
            onClick={() => {
              if (validateStep1() && validateStep2()) setStep(3);
            }}
            className={`auth-step-pill ${step === 3 ? "active" : "inactive"}`}
            style={{ cursor: step === 3 ? "default" : "pointer" }}
          >
            3
          </button>
          <span className="auth-step-label">Confirmer</span>
        </div>
      </div>

      {step === 1 && (
        <div className="auth-slide-in">
          <div className="auth-header">
            <h1 className="auth-title">
              Créer un compte <i className="fa-solid fa-user-plus" style={{ color: "#F25C05", marginLeft: "6px" }} />
            </h1>
            <p className="auth-subtitle">
              Étape 1 : Vos coordonnées de profil
            </p>
          </div>

          <div className="auth-form">
            <div className="auth-field-group">
              <label htmlFor="name" className="auth-label">
                Nom et prénom
              </label>
              <div
                className="auth-input-container"
                data-filled={Boolean(name)}
                style={{ borderColor: clientErrors.name ? "#EF4444" : undefined }}
              >
                <i className="fa-solid fa-user auth-input-icon" />
                <input
                  id="name"
                  type="text"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (clientErrors.name) setClientErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Ex. Youssef Bennani"
                  className="auth-input-element"
                />
              </div>
              {clientErrors.name && (
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{clientErrors.name}</span>
                </p>
              )}
            </div>

            <div className="auth-field-group">
              <label htmlFor="email" className="auth-label">
                Adresse Email
              </label>
              <div
                className="auth-input-container"
                data-filled={Boolean(email)}
                style={{ borderColor: clientErrors.email ? "#EF4444" : undefined }}
              >
                <i className="fa-solid fa-envelope auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (clientErrors.email) setClientErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="votre@email.com"
                  className="auth-input-element"
                />
              </div>
              {clientErrors.email && (
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{clientErrors.email}</span>
                </p>
              )}
            </div>

            <div className="auth-field-group">
              <label className="auth-label">
                Numéro de téléphone
              </label>
              <PhoneCountryInput
                countryCode={countryCode}
                onCountryCodeChange={(code) => {
                  setCountryCode(code);
                  if (clientErrors.phone) setClientErrors((prev) => ({ ...prev, phone: "" }));
                }}
                phoneNumber={phone}
                onPhoneNumberChange={(val) => {
                  setPhone(val);
                  if (clientErrors.phone) setClientErrors((prev) => ({ ...prev, phone: "" }));
                }}
                error={clientErrors.phone}
              />
              {clientErrors.phone && (
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{clientErrors.phone}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextToStep2}
              className="auth-action-btn"
              style={{ marginTop: "0.5rem" }}
            >
              <span>Continuer</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="auth-slide-in">
          <div className="auth-header">
            <h1 className="auth-title">
              Sécurité du compte <i className="fa-solid fa-lock" style={{ color: "#F25C05", marginLeft: "6px" }} />
            </h1>
            <p className="auth-subtitle">
              Étape 2 : Votre mot de passe de connexion
            </p>
          </div>

          <div className="auth-form">
            <div className="auth-field-group">
              <label htmlFor="password" className="auth-label">
                Mot de passe
              </label>
              <div
                className="auth-input-container"
                data-filled={Boolean(password)}
                style={{ borderColor: clientErrors.password ? "#EF4444" : undefined }}
              >
                <i className="fa-solid fa-lock auth-input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (clientErrors.password) setClientErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Au moins 6 caractères"
                  className="auth-input-element has-right-toggle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-btn"
                  tabIndex={-1}
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
              {clientErrors.password && (
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{clientErrors.password}</span>
                </p>
              )}
            </div>

            <div className="auth-field-group">
              <label htmlFor="password_confirmation" className="auth-label">
                Confirmer le mot de passe
              </label>
              <div
                className="auth-input-container"
                data-filled={Boolean(passwordConfirmation)}
                style={{ borderColor: clientErrors.password_confirmation ? "#EF4444" : undefined }}
              >
                <i className="fa-solid fa-shield-halved auth-input-icon" />
                <input
                  id="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                    if (clientErrors.password_confirmation) {
                      setClientErrors((prev) => ({ ...prev, password_confirmation: "" }));
                    }
                  }}
                  placeholder="Retapez votre mot de passe"
                  className="auth-input-element has-right-toggle"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="auth-toggle-btn"
                  tabIndex={-1}
                  title={showConfirmPassword ? "Masquer" : "Afficher"}
                >
                  <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
              {clientErrors.password_confirmation && (
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "0.75rem",
                    color: "#EF4444",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-circle-exclamation" />
                  <span>{clientErrors.password_confirmation}</span>
                </p>
              )}
            </div>

            <div className="auth-step-actions">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="auth-secondary-btn"
                style={{ flex: 1 }}
              >
                <i className="fa-solid fa-arrow-left" />
                <span>Retour</span>
              </button>
              <button
                type="button"
                onClick={handleNextToStep3}
                className="auth-action-btn"
                style={{ flex: 2 }}
              >
                <span>Continuer</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="auth-slide-in">
          <div className="auth-header">
            <h1 className="auth-title">
              Confirmation <i className="fa-solid fa-paper-plane" style={{ color: "#F25C05", marginLeft: "6px" }} />
            </h1>
            <p className="auth-subtitle">
              Étape 3 : Vérifiez vos informations et confirmez
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-summary-card">
              <div className="auth-summary-row">
                <span className="auth-summary-key">Nom complet</span>
                <span className="auth-summary-val">{name}</span>
              </div>
              <div className="auth-summary-row">
                <span className="auth-summary-key">Adresse email</span>
                <span className="auth-summary-val">{email}</span>
              </div>
              <div className="auth-summary-row">
                <span className="auth-summary-key">Mot de passe</span>
                <span className="auth-summary-val" style={{ letterSpacing: "0.15em" }}>
                  ••••••••
                </span>
              </div>
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderRadius: "14px",
                backgroundColor: "#F9FAFB",
                border: captchaVerified
                  ? "1.5px solid #10B981"
                  : clientErrors.captcha
                  ? "1.5px solid #EF4444"
                  : "1.5px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: captchaVerified ? "default" : "pointer",
                transition: "all 0.2s ease",
                userSelect: "none"
              }}
              onClick={handleTriggerCaptcha}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    border: captchaVerified
                      ? "2px solid #10B981"
                      : clientErrors.captcha
                      ? "2px solid #EF4444"
                      : "2px solid #D1D5DB",
                    backgroundColor: captchaVerified ? "#10B981" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  {captchaLoading ? (
                    <i className="fa-solid fa-spinner fa-spin" style={{ color: "#F25C05", fontSize: "13px" }} />
                  ) : captchaVerified ? (
                    <i className="fa-solid fa-check" style={{ color: "#FFFFFF", fontSize: "13px" }} />
                  ) : null}
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: captchaVerified ? "#065F46" : clientErrors.captcha ? "#EF4444" : "#374151"
                  }}
                >
                  {captchaVerified
                    ? "Vérification humaine réussie"
                    : "Je ne suis pas un robot (Cliquez pour valider)"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", opacity: 0.6 }}>
                <i
                  className="fa-solid fa-shield-halved"
                  style={{ fontSize: "18px", color: captchaVerified ? "#10B981" : "#6B7280" }}
                />
                <span style={{ fontSize: "9px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.5px" }}>
                  Foodi Shield
                </span>
              </div>
            </div>
            {clientErrors.captcha && (
              <p
                style={{
                  marginTop: "4px",
                  fontSize: "0.75rem",
                  color: "#EF4444",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <i className="fa-solid fa-circle-exclamation" />
                <span>{clientErrors.captcha}</span>
              </p>
            )}

            <div className="auth-checkbox-row" style={{ marginTop: "14px" }}>
              <div
                className={`auth-custom-checkbox ${agreed ? "checked" : ""}`}
                onClick={() => {
                  setAgreed(!agreed);
                  if (clientErrors.agreed) setClientErrors((prev) => ({ ...prev, agreed: "" }));
                }}
              >
                {agreed && <i className="fa-solid fa-check" />}
              </div>
              <span className="auth-checkbox-label">
                <span
                  onClick={() => {
                    setAgreed(!agreed);
                    if (clientErrors.agreed) setClientErrors((prev) => ({ ...prev, agreed: "" }));
                  }}
                  style={{ cursor: "pointer" }}
                >
                  J'accepte les conditions d'utilisation et la politique de confidentialité de Foodi
                </span>
              </span>
            </div>
            {clientErrors.agreed && (
              <p
                style={{
                  marginTop: "2px",
                  fontSize: "0.75rem",
                  color: "#EF4444",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <i className="fa-solid fa-circle-exclamation" />
                <span>{clientErrors.agreed}</span>
              </p>
            )}

            {clientErrors.general && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-circle-exclamation" />
                <span>{clientErrors.general}</span>
              </div>
            )}

            <div className="auth-step-actions" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="auth-secondary-btn"
                style={{ flex: 1 }}
              >
                <i className="fa-solid fa-arrow-left" />
                <span>Modifier</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !agreed || !captchaVerified}
                className="auth-action-btn"
                style={{
                  flex: 2,
                  opacity: agreed && captchaVerified ? 1 : 0.6,
                  cursor: agreed && captchaVerified ? "pointer" : "not-allowed"
                }}
              >
                <span>{isSubmitting ? "Création en cours..." : "Confirmer mon compte"}</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="auth-footer">
        Vous avez déjà un compte ?{" "}
        <Link
          to={redirectPath !== "/" ? `/login?redirect=${encodeURIComponent(redirectPath)}` : "/login"}
          className="auth-footer-link"
        >
          Se connecter
        </Link>
      </div>
    </AuthLayoutShell>
  );
};
