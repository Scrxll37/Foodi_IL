import React from "react";
import { AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

export const ConflictModal: React.FC = () => {
  const { conflictData, confirmConflictReplace, cancelConflict } = useApp();

  if (!conflictData) {
    return null;
  }

  return (
    <div className="conflict-modal-overlay">
      <div className="conflict-modal-card">
        <div className="conflict-modal-icon">
          <AlertCircle size={30} />
        </div>

        <h3 className="conflict-modal-title">Créer un nouveau panier ?</h3>

        <p className="conflict-modal-desc">
          Votre panier contient déjà des produits d'un autre restaurant (
          <strong>{conflictData.currentRestaurantName}</strong>).
          Si vous commandez chez <strong>{conflictData.newRestaurantName}</strong>, votre panier actuel sera vidé.
        </p>

        <div className="conflict-modal-actions">
          <button
            type="button"
            onClick={confirmConflictReplace}
            className="conflict-modal-replace-btn"
          >
            Vider et commander chez {conflictData.newRestaurantName}
          </button>

          <button
            type="button"
            onClick={cancelConflict}
            className="conflict-modal-cancel-btn"
          >
            Conserver mon panier
          </button>
        </div>
      </div>
    </div>
  );
};
