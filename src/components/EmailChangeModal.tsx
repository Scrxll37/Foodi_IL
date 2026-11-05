import React, { useState, useEffect } from "react";
import { X, Mail, ShieldCheck, Check, ArrowRight, RotateCw, AlertCircle } from "lucide-react";
import { OtpInput } from "./OtpInput";

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
}

type ModalStep = "verify_current" | "enter_new" | "verify_new" | "success";

export const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess
}) => {
  const [step, setStep] = useState<ModalStep>("verify_current");
  const [currentOtp, setCurrentOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOtp, setNewOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setStep("verify_current");
      setCurrentOtp("");
      setNewEmail("");
      setNewOtp("");
      setErrorMessage("");
      setIsSubmitting(false);
      setResendCountdown(30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, resendCountdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleVerifyCurrentOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentOtp.length !== 6) {
      setErrorMessage("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsSubmitting(false);
      setStep("enter_new");
      setResendCountdown(30);
    }, 400);
  };

  const handleSendNewEmailCode = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      setErrorMessage("La nouvelle adresse doit être différente de l'actuelle.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsSubmitting(false);
      setStep("verify_new");
      setResendCountdown(30);
    }, 400);
  };

  const handleVerifyNewOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOtp.length !== 6) {
      setErrorMessage("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(newEmail.trim());
      setStep("success");
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 450);
  };

  const handleResend = () => {
    if (resendCountdown > 0) return;
    setResendCountdown(30);
    setErrorMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#0B1020]/10 z-10 animate-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF8F5] text-[#7A8194] hover:text-[#0B1020] hover:bg-[#F0ECE4] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {step === "verify_current" && (
            <form onSubmit={handleVerifyCurrentOtp} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto border border-[#FF5A00]/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFF3EA] text-[#FF5A00] text-[10px] font-black uppercase tracking-wider">
                  Étape 1/2 • Sécurité
                </div>
                <h3 className="text-lg font-black text-[#0B1020]">
                  Vérifier votre e-mail actuel
                </h3>
                <p className="text-xs text-[#7A8194] max-w-xs mx-auto">
                  Un code de vérification à 6 chiffres a été envoyé à :
                </p>
                <p className="text-xs font-black text-[#0B1020] bg-[#FAF8F5] py-1.5 px-3 rounded-xl border border-[#0B1020]/8 inline-block">
                  {currentEmail}
                </p>
              </div>

              <div className="space-y-3">
                <OtpInput
                  value={currentOtp}
                  onChange={(val) => {
                    setCurrentOtp(val);
                    if (errorMessage) setErrorMessage("");
                  }}
                  hasError={Boolean(errorMessage)}
                  disabled={isSubmitting}
                />

                {errorMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || isSubmitting}
                    className={`text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                      resendCountdown > 0
                        ? "text-[#7A8194] cursor-not-allowed"
                        : "text-[#FF5A00] hover:underline"
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>
                      {resendCountdown > 0
                        ? `Renvoyer le code (${resendCountdown}s)`
                        : "Renvoyer le code"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={currentOtp.length !== 6 || isSubmitting}
                className="w-full foodi-btn-primary py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#FF5A00]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? "Vérification..." : "Continuer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === "enter_new" && (
            <form onSubmit={handleSendNewEmailCode} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto border border-[#FF5A00]/20">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFF3EA] text-[#FF5A00] text-[10px] font-black uppercase tracking-wider">
                  Étape 2/2 • Nouvelle adresse
                </div>
                <h3 className="text-lg font-black text-[#0B1020]">
                  Nouvelle adresse e-mail
                </h3>
                <p className="text-xs text-[#7A8194] max-w-xs mx-auto">
                  Entrez votre nouvelle adresse. Un code de validation y sera immédiatement envoyé.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#0B1020] block">
                  Nouvelle adresse e-mail
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  autoFocus
                  required
                  placeholder="nom@exemple.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#0B1020]/15 focus:border-[#FF5A00] focus:ring-2 focus:ring-[#FF5A00]/20 outline-none text-xs font-semibold text-[#0B1020]"
                />

                {errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("verify_current")}
                  disabled={isSubmitting}
                  className="w-1/3 py-2.5 rounded-xl border border-[#0B1020]/15 text-xs font-bold text-[#7A8194] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={!newEmail.trim() || isSubmitting}
                  className="w-2/3 foodi-btn-primary py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5A00]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? "Envoi..." : "Envoyer le code"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === "verify_new" && (
            <form onSubmit={handleVerifyNewOtp} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center mx-auto border border-[#FF5A00]/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#12A150] text-[10px] font-black uppercase tracking-wider">
                  Confirmation finale
                </div>
                <h3 className="text-lg font-black text-[#0B1020]">
                  Confirmer la nouvelle adresse
                </h3>
                <p className="text-xs text-[#7A8194] max-w-xs mx-auto">
                  Saisissez le code à 6 chiffres envoyé à votre nouvelle adresse :
                </p>
                <p className="text-xs font-black text-[#0B1020] bg-[#FAF8F5] py-1.5 px-3 rounded-xl border border-[#0B1020]/8 inline-block truncate max-w-full">
                  {newEmail}
                </p>
              </div>

              <div className="space-y-3">
                <OtpInput
                  value={newOtp}
                  onChange={(val) => {
                    setNewOtp(val);
                    if (errorMessage) setErrorMessage("");
                  }}
                  hasError={Boolean(errorMessage)}
                  disabled={isSubmitting}
                />

                {errorMessage && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || isSubmitting}
                    className={`text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                      resendCountdown > 0
                        ? "text-[#7A8194] cursor-not-allowed"
                        : "text-[#FF5A00] hover:underline"
                    }`}
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>
                      {resendCountdown > 0
                        ? `Renvoyer le code (${resendCountdown}s)`
                        : "Renvoyer le code"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("enter_new")}
                  disabled={isSubmitting}
                  className="w-1/3 py-2.5 rounded-xl border border-[#0B1020]/15 text-xs font-bold text-[#7A8194] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={newOtp.length !== 6 || isSubmitting}
                  className="w-2/3 foodi-btn-primary py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-[#FF5A00]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? "Validation..." : "Valider et changer"}</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#12A150] flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-[#0B1020]">
                Adresse e-mail mise à jour !
              </h3>
              <p className="text-xs text-[#7A8194]">
                Votre nouvelle adresse <strong className="text-[#0B1020]">{newEmail}</strong> est validée avec succès.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailChangeModal;
