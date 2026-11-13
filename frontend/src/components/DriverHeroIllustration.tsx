import React from "react";

export const DriverHeroIllustration: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`driver-hero-illustration-wrap ${className}`}>
      <svg
        viewBox="0 0 640 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="driver-hero-svg"
      >
        <defs>
          <linearGradient id="scooterOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A1A" />
            <stop offset="100%" stopColor="#E64A00" />
          </linearGradient>
          <linearGradient id="boxOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#D94800" />
          </linearGradient>
          <linearGradient id="helmetVisor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="cityFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EEF2F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.1" />
          </linearGradient>
          <filter id="heroShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(11, 16, 32, 0.14)" />
          </filter>
          <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(255, 90, 0, 0.28)" />
          </filter>
        </defs>

        <g opacity="0.65">
          <path d="M 60 210 L 60 140 L 90 140 L 90 120 L 120 120 L 120 150 L 150 150 L 150 210 Z" fill="url(#cityFade)" />
          <path d="M 160 210 L 160 130 L 190 110 L 220 130 L 220 210 Z" fill="url(#cityFade)" />
          <path d="M 420 210 L 420 135 L 455 135 L 455 105 L 490 105 L 490 145 L 520 145 L 520 210 Z" fill="url(#cityFade)" />
          <path d="M 530 210 L 530 150 L 575 125 L 610 150 L 610 210 Z" fill="url(#cityFade)" />
        </g>

        <g opacity="0.55">
          <path d="M 110 80 C 110 72, 118 66, 126 66 C 132 66, 138 70, 140 74 C 144 70, 152 70, 156 74 C 162 74, 166 78, 166 84 C 166 90, 160 94, 152 94 L 118 94 C 112 94, 110 88, 110 80 Z" fill="#E2E8F0" />
          <path d="M 470 65 C 470 58, 477 53, 484 53 C 490 53, 495 56, 497 60 C 500 56, 507 56, 511 60 C 516 60, 520 64, 520 69 C 520 74, 515 78, 508 78 L 478 78 C 472 78, 470 73, 470 65 Z" fill="#E2E8F0" />
        </g>

        <path
          d="M 50 160 C 130 110, 180 180, 280 130 C 370 85, 470 165, 590 120"
          stroke="#E2E8F0"
          strokeWidth="3.5"
          strokeDasharray="8 8"
          strokeLinecap="round"
        />

        <g transform="translate(145, 90)" filter="url(#pinShadow)">
          <path d="M 0 0 C -14 0, -21 9, -21 19 C -21 33, 0 52, 0 52 C 0 52, 21 33, 21 19 C 21 9, 14 0, 0 0 Z" fill="#FF5A00" />
          <circle cx="0" cy="19" r="7" fill="#FFFFFF" />
        </g>

        <g transform="translate(485, 110)" filter="url(#pinShadow)">
          <path d="M 0 0 C -14 0, -21 9, -21 19 C -21 33, 0 52, 0 52 C 0 52, 21 33, 21 19 C 21 9, 14 0, 0 0 Z" fill="#EF4444" />
          <circle cx="0" cy="19" r="7" fill="#FFFFFF" />
        </g>

        <g stroke="#FFD8C2" strokeLinecap="round">
          <line x1="120" y1="210" x2="190" y2="210" strokeWidth="4" />
          <line x1="95" y1="228" x2="165" y2="228" strokeWidth="3" />
          <line x1="135" y1="245" x2="185" y2="245" strokeWidth="3" />
        </g>

        <ellipse cx="320" cy="295" rx="135" ry="14" fill="rgba(15, 23, 42, 0.08)" />

        <g transform="translate(230, 95)" filter="url(#heroShadow)">
          <circle cx="45" cy="180" r="28" fill="#1E293B" />
          <circle cx="45" cy="180" r="16" fill="#94A3B8" />
          <circle cx="45" cy="180" r="7" fill="#334155" />

          <circle cx="160" cy="180" r="26" fill="#1E293B" />
          <circle cx="160" cy="180" r="15" fill="#94A3B8" />
          <circle cx="160" cy="180" r="6" fill="#334155" />

          <path d="M 45 180 L 76 142 L 115 145 L 125 178 Z" fill="url(#scooterOrange)" />
          <path d="M 76 142 L 95 105 L 138 122 L 132 170 L 112 170 Z" fill="#E64A00" />
          <path d="M 85 166 L 138 166 L 138 175 L 85 175 Z" fill="#334155" />

          <path d="M 132 135 L 154 95 L 163 100 L 146 168 L 132 166 Z" fill="url(#scooterOrange)" />
          <path d="M 148 95 L 139 90 L 157 74 L 166 81 Z" fill="#334155" />
          <circle cx="168" cy="83" r="6" fill="#F8FAFC" />

          <circle cx="134" cy="85" r="4" fill="#475569" />
          <line x1="136" y1="88" x2="146" y2="95" stroke="#334155" strokeWidth="3" />

          <path d="M 144 160 C 144 150, 175 150, 177 166 Z" fill="url(#scooterOrange)" />
          <path d="M 32 170 C 32 156, 58 156, 60 174 Z" fill="#334155" />

          <rect x="82" y="132" width="44" height="13" rx="4" fill="#0F172A" />

          <path d="M 78 95 L 94 145 L 111 145 L 100 95 Z" fill="#1E293B" />
          <ellipse cx="113" cy="147" rx="11" ry="7" fill="#0F172A" />

          <path d="M 72 62 L 105 70 L 100 110 L 72 103 Z" fill="#0F172A" />

          <path d="M 95 76 L 139 87 L 136 96 L 91 85 Z" fill="#1E293B" />
          <ellipse cx="140" cy="89" rx="6" ry="5" fill="#FF5A00" />

          <g transform="translate(32, 36)">
            <rect x="0" y="0" width="54" height="58" rx="10" fill="url(#boxOrange)" stroke="#C23E00" strokeWidth="1.5" />
            <rect x="0" y="9" width="54" height="4" fill="#C23E00" />
            <text x="27" y="42" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontStyle="italic">F</text>
          </g>

          <g transform="translate(76, 14)">
            <ellipse cx="24" cy="24" rx="22" ry="23" fill="url(#scooterOrange)" />
            <path d="M 28 13 C 38 18, 42 26, 42 31 C 42 38, 33 42, 24 42 C 20 42, 15 40, 13 37 L 15 28 C 20 31, 28 31, 31 26 C 33 22, 28 15, 28 13 Z" fill="url(#helmetVisor)" />
            <circle cx="37" cy="22" r="3" fill="#FFFFFF" opacity="0.6" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default DriverHeroIllustration;
