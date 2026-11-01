import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";

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
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-hero-mobile" key={`mobile-hero-${pageType}`}>
          <img
            key={`mobile-img-${pageType}`}
            src={resolvedMobile}
            alt="Foodi"
            className="auth-hero-mobile-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/auth/authhero.png";
            }}
          />
          <div className="auth-curve-divider-mobile">
            <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="auth-curve-svg-mobile">
              <path d="M0,36 Q720,-10 1440,36 L1440,60 L0,60 Z" fill="#FAF8F5" />
            </svg>
          </div>

          <Link to={backHref} className="auth-back-btn" title="Retour à l'accueil">
            <i className="fa-solid fa-arrow-left" />
          </Link>
        </div>

        <div className="auth-hero-desktop" key={`desktop-hero-${pageType}`}>
          <img
            key={`desktop-img-${pageType}`}
            src={resolvedDesktop}
            alt="Foodi - Vos plats préférés, en un clic !"
            className="auth-hero-img"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/auth/authhero.png";
            }}
          />
          <div className="auth-curve-divider-desktop">
            <svg viewBox="0 0 60 1440" fill="none" preserveAspectRatio="none" className="auth-curve-svg-desktop">
              <path d="M36,0 Q-10,720 36,1440 L60,1440 L60,0 Z" fill="#FAF8F5" />
            </svg>
          </div>

          <Link to={backHref} className="auth-back-btn" title="Retour à l'accueil">
            <i className="fa-solid fa-arrow-left" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        <div className="auth-form-side">
         

          <div className="auth-content-box" key={`content-box-${pageType}`}>
            <div className="auth-logo-wrap">
              <Link to="/">
                <img src="/images/logohor.png" alt="Foodi" className="auth-logo-img" />
              </Link>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
