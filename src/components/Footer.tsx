import React from "react";
import { Link } from "react-router-dom";
import restaurantsData from "../data/restaurants.json";
import cuisinesData from "../data/cuisines.json";
import { Restaurant } from "../types";

export const Footer: React.FC = () => {
  const restaurants: Restaurant[] = restaurantsData as Restaurant[];
  const cuisines = cuisinesData;

  return (
    <footer className="home-footer">
      <div className="footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <img
              src="/images/logo.png"
              alt="Foodi"
              style={{ width: "32px", height: "32px", objectFit: "contain" }}
            />
            <span style={{ fontWeight: "900", fontSize: "18px", color: "#0F172A" }}>
              Food<span style={{ color: "#FF5A00" }}>i</span>
            </span>
          </div>

          <p style={{ fontSize: "12px", color: "#64748B", lineHeight: "1.6", margin: 0 }}>
            Application web de commande et livraison de repas dédiée aux meilleures enseignes d'Agadir.
          </p>
        </div>

        <div>
          <h5 className="footer-col-title">Enseignes</h5>
          <ul className="footer-links-list">
            {restaurants.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link to={`/restaurants/${r.slug}`} className="footer-link-item">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="footer-col-title">Spécialités</h5>
          <ul className="footer-links-list">
            {cuisines.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/restaurants?category=${c.slug}`} className="footer-link-item">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="footer-col-title">Projet Web</h5>
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "16px", fontSize: "12px", color: "#64748B" }}>
            <strong style={{ color: "#0F172A", display: "block", marginBottom: "4px", fontSize: "13px" }}>
              Projet Web IL • Faical
            </strong>
            Plateforme moderne de commande en ligne et livraison express à Agadir.
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>&copy; 2026 Foodi — Tous droits réservés.  </span>
        <span>Powered By Platvion / FAICAL BENOUCHEN Ingéniere Logiciel</span>
      </div>
    </footer>
  );
};
