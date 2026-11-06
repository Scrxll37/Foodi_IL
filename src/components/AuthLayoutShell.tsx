import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutShellProps {
  children: ReactNode;
  pageType?: "login" | "register" | "forgot" | "reset" | "verify";
  desktopImage?: string;
  mobileImage?: string;
  backHref?: string;
}

export const AuthLayoutShell: React.FC<AuthLayoutShellProps> = ({
  children,
  pageType = "login",
  desktopImage,
  mobileImage,
  backHref = "/"
}) => {
  const defaultDesktopImages: Record<string, string> = {
    login: "/images/auth/authhero.png",
    register: "/images/auth/mp.png",
    forgot: "/images/auth/fee.png",
    reset: "/images/auth/forgot.jpg",
    verify: "/images/auth/adc.png"
  };

  const defaultMobileImages: Record<string, string> = {
    login: "/images/auth/authhero.png",
    register: "/images/auth/mp.png",
    forgot: "/images/auth/phone-forgot.png",
    reset: "/images/auth/phone-forgot.png",
    verify: "/images/auth/phone-verify.jpg"
  };

  const resolvedDesktop = desktopImage || defaultDesktopImages[pageType] || "/images/auth/authhero.png";
  const resolvedMobile = mobileImage || defaultMobileImages[pageType] || "/images/auth/phone-login.png";

  return (
    <div className="min-h-screen bg-white font-sans text-[#0B1020]">
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen bg-white">
          <div className="flex items-center justify-between w-full">
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0B1020]/10 bg-white text-xs font-bold text-[#0B1020] hover:bg-[#FAF8F5] transition-colors shadow-2xs cursor-pointer"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0B1020]" />
              <span>Retour</span>
            </Link>

            <div />
          </div>

          <div className="w-full max-w-[380px] mx-auto my-auto py-8">
            {children}
          </div>

          <div className="text-center pt-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7A8194]/60">
              Foodi • Agadir
            </span>
          </div>
        </div>

        <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-[#0B1020] p-10 xl:p-14 flex-col justify-end">
          <img
            key={`desktop-img-${pageType}`}
            src={resolvedDesktop}
            alt="Foodi - Livraison de repas à Agadir"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/auth/authhero.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

          <div className="relative z-10 max-w-lg space-y-4 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
              <span>Foodi Agadir</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
              Vos plats préférés, livrés en un clic.
            </h2>
            <p className="text-xs xl:text-sm text-white/80 leading-relaxed font-normal">
              Découvrez une expérience culinaire unique, suivez votre coursier en temps réel et profitez du meilleur d'Agadir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayoutShell;
