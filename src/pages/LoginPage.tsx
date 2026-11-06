import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Phone, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Bike } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AuthLayoutShell } from "../components/AuthLayoutShell";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useApp();

  const [authMode, setAuthMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [clientError, setClientError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setClientError("");

    if (authMode === "email") {
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
    } else {
      const cleanPhone = phone.trim();
      if (!cleanPhone || cleanPhone.length < 8) {
        setClientError("Veuillez saisir un numéro de téléphone valide.");
        return;
      }
    }

    if (!password || password.length < 6) {
      setClientError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);

    const identifier = authMode === "email" ? email.trim() : phone.trim();

    setTimeout(() => {
      login(identifier);
      setIsSubmitting(false);
      navigate(redirectPath, { replace: true });
    }, 350);
  };

  const fillQuickAccount = (demoId: string) => {
    if (demoId.includes("@")) {
      setAuthMode("email");
      setEmail(demoId);
    } else {
      setAuthMode("phone");
      setPhone(demoId);
    }
    setPassword("password123");
    setClientError("");
  };

  return (
    <AuthLayoutShell pageType="login" backHref="/">
      <div className="space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block mb-3">
            <img src="/images/logohor.png" alt="Foodi" className="h-8 sm:h-9 mx-auto object-contain" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1020] tracking-tight">
            Bienvenue
          </h1>
          <p className="text-xs sm:text-sm text-[#7A8194] font-medium mt-1">
            Connectez-vous à votre compte
          </p>
        </div>

        <div className="bg-[#F1F3F6] p-1 rounded-2xl flex max-w-full text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("email");
              setClientError("");
            }}
            className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
              authMode === "email"
                ? "bg-white text-[#0B1020] font-black shadow-xs"
                : "text-[#7A8194] hover:text-[#0B1020]"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setClientError("");
            }}
            className={`flex-1 py-2 rounded-xl text-center transition-all cursor-pointer ${
              authMode === "phone"
                ? "bg-white text-[#0B1020] font-black shadow-xs"
                : "text-[#7A8194] hover:text-[#0B1020]"
            }`}
          >
            Téléphone
          </button>
        </div>

        {clientError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{clientError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === "email" ? (
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7A8194] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setClientError("");
                }}
                placeholder="votre@email.com"
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white focus:ring-3 focus:ring-[#FF5A00]/15 text-xs sm:text-sm font-semibold text-[#0B1020] placeholder:text-[#7A8194]/70 outline-none transition-all"
              />
            </div>
          ) : (
            <div className="relative">
              <Phone className="w-4 h-4 text-[#7A8194] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                required
                autoFocus
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setClientError("");
                }}
                placeholder="+212 6 12 34 56 78"
                className="w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white focus:ring-3 focus:ring-[#FF5A00]/15 text-xs sm:text-sm font-semibold text-[#0B1020] placeholder:text-[#7A8194]/70 outline-none transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="w-4 h-4 text-[#7A8194] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setClientError("");
              }}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 sm:py-3.5 rounded-2xl bg-[#F0F4F8] border border-transparent focus:border-[#FF5A00] focus:bg-white focus:ring-3 focus:ring-[#FF5A00]/15 text-xs sm:text-sm font-semibold text-[#0B1020] placeholder:text-[#7A8194]/70 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#7A8194] hover:text-[#0B1020] transition-colors cursor-pointer"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded text-[#FF5A00] accent-[#FF5A00] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#3B4256]">Se souvenir de moi</span>
            </label>

            <span className="text-xs font-semibold text-[#7A8194] hover:text-[#FF5A00] transition-colors cursor-pointer">
              Mot de passe oublié ?
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="foodi-btn-primary w-full py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-[#FF5A00]/25 hover:shadow-xl hover:shadow-[#FF5A00]/35 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? "Connexion en cours..." : "Se connecter"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-[#7A8194] font-medium pt-1">
          Vous n'avez pas de compte ?{" "}
          <Link
            to={redirectPath !== "/" ? `/register?redirect=${encodeURIComponent(redirectPath)}` : "/register"}
            className="font-black text-[#FF5A00] hover:underline ml-1"
          >
            S'inscrire
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => fillQuickAccount("youssef.foodi@gmail.com")}
            className="text-[11px] font-bold text-[#7A8194] hover:text-[#FF5A00] bg-gray-50 hover:bg-orange-50 px-3 py-1.5 rounded-xl border border-gray-200/60 transition-colors cursor-pointer"
          >
            Compte démo
          </button>
          <Link
            to="/driver"
            className="text-[11px] font-bold text-[#7A8194] hover:text-[#FF5A00] bg-gray-50 hover:bg-orange-50 px-3 py-1.5 rounded-xl border border-gray-200/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Bike className="w-3 h-3 text-[#FF5A00]" />
            <span>Espace Livreur</span>
          </Link>
        </div>
      </div>
    </AuthLayoutShell>
  );
};

export default LoginPage;
