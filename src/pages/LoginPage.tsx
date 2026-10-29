import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Phone, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useApp();

  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("06 12 34 56 78");
  const [email, setEmail] = useState("client@foodi.ma");
  const [password, setPassword] = useState("••••••••");
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState(["4", "8", "1", "9"]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "phone" && !otpStep) {
      setOtpStep(true);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(authMode === "phone" ? `+212 ${phone}` : email);
      setIsLoading(false);
      navigate(redirectPath);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          aria-label="Retour accueil"
          className="w-10 h-10 rounded-full bg-white border border-[#0B1020]/10 flex items-center justify-center text-[#0B1020] hover:text-[#FF5A00] transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link to="/">
          <img src="/images/logohor.png" alt="Foodi Agadir" className="h-9 w-auto object-contain" />
        </Link>
        <div className="w-10" />
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0B1020]/8 shadow-xl shadow-[#0B1020]/4 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-[#0B1020]">Bon retour sur Foodi</h1>
            <p className="text-xs text-[#7A8194]">
              Accédez à vos commandes, adresses et restaurants favoris à Agadir
            </p>
          </div>

          <div className="flex bg-[#FAF8F5] p-1 rounded-2xl border border-[#0B1020]/6">
            <button
              type="button"
              onClick={() => {
                setAuthMode("phone");
                setOtpStep(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === "phone"
                  ? "bg-white text-[#FF5A00] shadow-2xs border border-[#0B1020]/5"
                  : "text-[#7A8194] hover:text-[#0B1020]"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Téléphone</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("email");
                setOtpStep(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === "email"
                  ? "bg-white text-[#FF5A00] shadow-2xs border border-[#0B1020]/5"
                  : "text-[#7A8194] hover:text-[#0B1020]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <img
                  src="/images/logohor.png"
                  alt="Foodi"
                  className="h-10 w-auto animate-pulse object-contain"
                />
              </div>
              <div className="w-6 h-6 border-2 border-[#FF5A00] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-extrabold text-[#7A8194]">Connexion instantanée...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "phone" ? (
                !otpStep ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                      Numéro de téléphone marocain
                    </label>
                    <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl overflow-hidden focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                      <span className="px-3.5 text-xs font-black text-[#0B1020] border-r border-[#0B1020]/10 flex items-center gap-1.5">
                        🇲🇦 +212
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="6 12 34 56 78"
                        className="w-full px-3.5 py-3 text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#3B4256] text-center">
                      Code de vérification SMS envoyé au +212 {phone}
                    </label>
                    <div className="flex justify-center gap-2">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const newOtp = [...otpCode];
                            newOtp[index] = e.target.value;
                            setOtpCode(newOtp);
                          }}
                          className="w-12 h-12 text-center text-lg font-black bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl focus:outline-none focus:border-[#FF5A00] focus:bg-white"
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setOtpStep(false)}
                        className="text-xs text-[#FF5A00] font-bold hover:underline"
                      >
                        Changer de numéro
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                      Adresse email
                    </label>
                    <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-3.5 py-3 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                      <Mail className="w-4 h-4 text-[#7A8194] mr-2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@domaine.ma"
                        className="w-full text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                      Mot de passe
                    </label>
                    <div className="flex items-center bg-[#FAF8F5] border border-[#0B1020]/10 rounded-2xl px-3.5 py-3 focus-within:border-[#FF5A00] focus-within:bg-white transition-all">
                      <Lock className="w-4 h-4 text-[#7A8194] mr-2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-bold text-[#0B1020] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="foodi-btn-primary w-full py-3.5 rounded-2xl text-xs font-black shadow-md shadow-[#FF5A00]/25 cursor-pointer mt-4"
              >
                <span>
                  {authMode === "phone" && !otpStep
                    ? "Recevoir mon code SMS"
                    : "Connexion sécurisée"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-[#0B1020]/6">
            <p className="text-xs text-[#7A8194]">
              Nouveau client ?{" "}
              <Link to="/register" className="font-extrabold text-[#FF5A00] hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-[#7A8194]">
        © 2026 Foodi Maroc • Livraison de repas à Agadir
      </div>
    </div>
  );
};
