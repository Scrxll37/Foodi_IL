import React, { useState, useRef, useEffect } from "react";
import { COUNTRY_CODES, type CountryCode } from "../lib/countryCodes";

interface PhoneCountryInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phone: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  error?: string;
}

export const PhoneCountryInput: React.FC<PhoneCountryInputProps> = ({
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  placeholder = "6 12 34 56 78",
  required = false,
  autoFocus = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRY_CODES.find((c) => c.dialCode === countryCode) || COUNTRY_CODES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: "relative", width: "100%", zIndex: isOpen ? 100 : 1 }} ref={dropdownRef}>
      <div
        className="auth-input-container"
        data-filled={Boolean(phoneNumber)}
        style={{ overflow: "hidden", borderColor: error ? "#EF4444" : undefined }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="auth-phone-country-btn"
          title="Choisir l'indicatif"
        >
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>{selectedCountry.flag}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", color: "#111827", fontWeight: 700 }}>
            {selectedCountry.dialCode}
          </span>
          <i
            className="fa-solid fa-chevron-down"
            style={{
              fontSize: "10px",
              color: "#6B7280",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "none"
            }}
          />
        </button>

        <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", height: "100%" }}>
          <input
            type="tel"
            required={required}
            autoFocus={autoFocus}
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s]/g, "");
              onPhoneNumberChange(val);
            }}
            placeholder={placeholder}
            className="auth-input-element has-right-toggle"
            style={{ paddingLeft: "12px" }}
          />
          <i
            className="fa-solid fa-phone"
            style={{
              position: "absolute",
              right: "14px",
              color: phoneNumber ? "#F25C05" : "#9CA3AF",
              fontSize: "14px",
              pointerEvents: "none",
              transition: "color 0.2s"
            }}
          />
        </div>
      </div>

      {isOpen && (
        <div className="auth-phone-dropdown">
          <div className="auth-phone-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher pays ou code..."
              className="auth-phone-search-input"
            />
          </div>

          <div className="auth-phone-list">
            {filteredCountries.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "0.75rem", color: "#6B7280" }}>
                Aucun pays trouvé
              </div>
            ) : (
              filteredCountries.map((c) => (
                <button
                  key={c.code + c.dialCode}
                  type="button"
                  onClick={() => {
                    onCountryCodeChange(c.dialCode);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`auth-phone-option ${
                    selectedCountry.dialCode === c.dialCode && selectedCountry.code === c.code ? "selected" : ""
                  }`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    <span style={{ fontSize: "1.1rem" }}>{c.flag}</span>
                    <span
                      style={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        color: "#111827",
                        fontWeight: 600
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <span
                    style={{
                      color: "#F25C05",
                      fontVariantNumeric: "tabular-nums",
                      marginLeft: "8px",
                      flexShrink: 0,
                      fontWeight: 700
                    }}
                  >
                    {c.dialCode}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
