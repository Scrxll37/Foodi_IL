import React from "react";

export const DriverHeroIllustration: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`driver-hero-illustration-wrap ${className}`}>
      <svg
        viewBox="0 0 540 300"
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
          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.12)" />
          </filter>
        </defs>

        <path
          d="M 60 140 C 120 100, 170 160, 240 120 C 310 80, 390 140, 480 110"
          stroke="#E2E8F0"
          strokeWidth="3.5"
          strokeDasharray="7 7"
          strokeLinecap="round"
        />

        <g transform="translate(140, 75)" filter="url(#shadowFilter)">
          <path d="M 0 0 C -12 0, -18 8, -18 16 C -18 28, 0 44, 0 44 C 0 44, 18 28, 18 16 C 18 8, 12 0, 0 0 Z" fill="#FF5A00" />
          <circle cx="0" cy="16" r="6" fill="#FFFFFF" />
        </g>

        <g transform="translate(420, 95)" filter="url(#shadowFilter)">
          <path d="M 0 0 C -12 0, -18 8, -18 16 C -18 28, 0 44, 0 44 C 0 44, 18 28, 18 16 C 18 8, 12 0, 0 0 Z" fill="#FF5A00" />
          <circle cx="0" cy="16" r="6" fill="#FFFFFF" />
        </g>

        <line x1="80" y1="180" x2="130" y2="180" stroke="#FFD8C2" strokeWidth="3" strokeLinecap="round" />
        <line x1="60" y1="195" x2="110" y2="195" stroke="#FFD8C2" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="90" y1="210" x2="125" y2="210" stroke="#FFD8C2" strokeWidth="2.5" strokeLinecap="round" />

        <ellipse cx="265" cy="256" rx="105" ry="12" fill="rgba(15, 23, 42, 0.08)" />

        <g transform="translate(185, 70)" filter="url(#shadowFilter)">
          <circle cx="40" cy="160" r="26" fill="#1E293B" />
          <circle cx="40" cy="160" r="14" fill="#94A3B8" />
          <circle cx="40" cy="160" r="6" fill="#334155" />

          <circle cx="145" cy="160" r="24" fill="#1E293B" />
          <circle cx="145" cy="160" r="13" fill="#94A3B8" />
          <circle cx="145" cy="160" r="5" fill="#334155" />

          <path d="M 40 160 L 68 128 L 105 130 L 115 158 Z" fill="url(#scooterOrange)" />
          <path d="M 68 128 L 85 95 L 125 110 L 120 152 L 102 152 Z" fill="#E64A00" />
          <path d="M 75 148 L 125 148 L 125 156 L 75 156 Z" fill="#334155" />

          <path d="M 120 120 L 140 85 L 148 90 L 132 150 L 120 148 Z" fill="url(#scooterOrange)" />
          <path d="M 134 85 L 126 80 L 142 66 L 150 72 Z" fill="#334155" />
          <circle cx="152" cy="74" r="5" fill="#F8FAFC" />

          <circle cx="122" cy="75" r="4" fill="#475569" />
          <line x1="124" y1="78" x2="132" y2="85" stroke="#334155" strokeWidth="2.5" />

          <path d="M 130 142 C 130 134, 158 134, 160 148 Z" fill="url(#scooterOrange)" />
          <path d="M 28 152 C 28 140, 52 140, 54 156 Z" fill="#334155" />

          <rect x="74" y="118" width="38" height="12" rx="4" fill="#0F172A" />

          <path d="M 70 85 L 85 130 L 100 130 L 90 85 Z" fill="#1E293B" />
          <ellipse cx="102" cy="132" rx="10" ry="6" fill="#0F172A" />

          <path d="M 65 55 L 95 62 L 90 98 L 65 92 Z" fill="#0F172A" />

          <path d="M 85 68 L 125 78 L 122 86 L 82 76 Z" fill="#1E293B" />
          <ellipse cx="126" cy="80" rx="5" ry="4" fill="#FF5A00" />

          <g transform="translate(30, 32)">
            <rect x="0" y="0" width="48" height="52" rx="9" fill="url(#boxOrange)" stroke="#C23E00" strokeWidth="1.5" />
            <rect x="0" y="8" width="48" height="4" fill="#C23E00" />
            <text x="24" y="38" fontFamily="sans-serif" fontSize="24" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontStyle="italic">F</text>
          </g>

          <g transform="translate(68, 12)">
            <ellipse cx="22" cy="22" rx="20" ry="21" fill="url(#scooterOrange)" />
            <path d="M 26 12 C 34 16, 38 24, 38 28 C 38 34, 30 38, 22 38 C 18 38, 14 36, 12 34 L 14 26 C 18 28, 26 28, 28 24 C 30 20, 26 14, 26 12 Z" fill="url(#helmetVisor)" />
            <circle cx="34" cy="20" r="3" fill="#FFFFFF" opacity="0.6" />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default DriverHeroIllustration;
