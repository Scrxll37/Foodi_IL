import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AuthLayoutShell } from "../components/AuthLayoutShell";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [clientError, setClientError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setClientError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setClientError("Veuillez saisir votre adresse email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setClientError("Format d'adresse email invalide.");
      return;
    }

    if (!password || password.length < 6) {
      setClientError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      login(cleanEmail);
      setIsSubmitting(false);
      navigate(redirectPath, { replace: true });
    }, 400);
  };

  const fillQuickAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setClientError("");
  };

  return (
    <AuthLayoutShell pageType="login" backHref="/">
      <div className="auth-header">
        <h1 className="auth-title">
          Bienvenue <i className="fa-solid fa-utensils" style={{ color: "#F25C05", marginLeft: "6px" }} />
        </h1>
        <p className="auth-subtitle">
          Connectez-vous pour continuer vos commandes
        </p>
      </div>

      {clientError && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: "12px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#991B1B",
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ color: "#EF4444" }} />
          <span>{clientError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field-group">
          <label htmlFor="email" className="auth-label">
            Adresse Email
          </label>
          <div className="auth-input-container" data-filled={Boolean(email)}>
            <i className="fa-solid fa-envelope auth-input-icon" />
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setClientError("");
              }}
              placeholder="votre@email.com"
              className="auth-input-element"
            />
          </div>
        </div>

        <div className="auth-field-group">
          <div className="auth-label-row">
            <label htmlFor="password" className="auth-label">
              Mot de passe
            </label>
            <span
              className="auth-forgot-link"
              style={{ cursor: "default", opacity: 0.85, userSelect: "none" }}
            >
              Mot de passe oublié ?
            </span>
          </div>
          <div className="auth-input-container" data-filled={Boolean(password)}>
            <i className="fa-solid fa-lock auth-input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setClientError("");
              }}
              placeholder="Votre mot de passe"
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
        </div>

        <div className="auth-checkbox-row" onClick={() => setRemember(!remember)}>
          <div className={`auth-custom-checkbox ${remember ? "checked" : ""}`}>
            {remember && <i className="fa-solid fa-check" />}
          </div>
          <span className="auth-checkbox-label">Se souvenir de moi</span>
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-action-btn">
          <span>{isSubmitting ? "Connexion en cours..." : "Se connecter"}</span>
          <i className="fa-solid fa-arrow-right" />
        </button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">OU</span>
      </div>

      <div className="auth-social-row">
        <button
          type="button"
          onClick={() => fillQuickAccount("youssef.foodi@gmail.com")}
          className="auth-social-btn"
          title="Continuer avec Google"
        >
          <i className="fa-brands fa-google" style={{ color: "#EA4335" }} />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => fillQuickAccount("ali.apple@foodi.ma")}
          className="auth-social-btn"
          title="Continuer avec Apple"
        >
          <i className="fa-brands fa-apple" style={{ color: "#000000" }} />
          <span>Apple</span>
        </button>
      </div>

      <div className="auth-footer">
        Pas encore de compte ?{" "}
        <Link
          to={redirectPath !== "/" ? `/register?redirect=${encodeURIComponent(redirectPath)}` : "/register"}
          className="auth-footer-link"
        >
          Créer un compte
        </Link>
      </div>
    </AuthLayoutShell>
  );
};
