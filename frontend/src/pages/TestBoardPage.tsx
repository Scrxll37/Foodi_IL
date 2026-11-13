import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { OrderRecord, OrderStatus } from "../types";

export const TestBoardPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driverName, setDriverName] = useState<string>("Amine Tazi");
  const [driverPhone, setDriverPhone] = useState<string>("+212 6 62 10 20 30");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data: OrderRecord[] = await res.json();
        setOrders(data);
      }
    } catch {
      try {
        const raw = localStorage.getItem("foodi_orders");
        if (raw) {
          setOrders(JSON.parse(raw));
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (
    targetOrder: OrderRecord,
    newStatus: OrderStatus,
    newLabel: string,
    extraFields?: Partial<OrderRecord>
  ) => {
    const patch = {
      token: targetOrder.token,
      id: targetOrder.id,
      status: newStatus,
      statusLabel: newLabel,
      courierName: extraFields?.courierName || targetOrder.courierName || driverName,
      courierPhone: extraFields?.courierPhone || targetOrder.courierPhone || driverPhone,
      ...extraFields
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === targetOrder.id ? { ...o, ...patch } : o))
    );

    try {
      await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch {}

    try {
      const raw = localStorage.getItem("foodi_orders");
      if (raw) {
        const list: OrderRecord[] = JSON.parse(raw);
        const updated = list.map((o) =>
          o.id === targetOrder.id ? { ...o, ...patch } : o
        );
        localStorage.setItem("foodi_orders", JSON.stringify(updated));
      }
    } catch {}
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "pending_confirmation":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "preparing":
      case "accepted":
      case "in_prep":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "searching_driver":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "heading_to_restaurant":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_delivery":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Panneau de Test : Restaurant & Livreur
            </h1>
            <p className="text-xs text-gray-500">
              Page temporaire pour tester les transitions de statut en direct. Actualisation automatique toutes les 3s.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded border border-gray-300 cursor-pointer"
            >
              Rafraîchir
            </button>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded"
            >
              Dashboard Client
            </Link>
          </div>
        </header>

        <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold">Configuration Livreur Test :</span>
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Nom :</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600">Téléphone :</label>
            <input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">
            Chargement des commandes...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-300 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-700">Aucune commande trouvée.</p>
            <Link
              to="/restaurants"
              className="inline-block px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded"
            >
              Passer une commande test
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <section className="bg-white p-4 sm:p-5 rounded-xl border border-gray-300 shadow-sm space-y-4">
              <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                    Board Restaurant (Cuisine)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Accepter les commandes, préparer les plats, alerter les livreurs.
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded">
                  {orders.length} commande(s)
                </span>
              </div>

              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {o.id}
                        </span>
                        <div className="font-semibold text-gray-800">
                          {o.restaurantName}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {o.neighborhood} • {o.items?.length || 0} plat(s) • Total: {o.total} DH
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                        {o.token && (
                          <Link
                            to={`/track/${o.token}`}
                            target="_blank"
                            className="block text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            Ouvrir suivi client ↗
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "pending_confirmation",
                            "Commande reçue, en attente de confirmation"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "pending_confirmation"
                            ? "bg-amber-600 text-white border-amber-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        1. En attente
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "preparing",
                            "Restaurant prépare votre commande"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "preparing"
                            ? "bg-orange-600 text-white border-orange-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        2. Accepter & Cuisiner
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "searching_driver",
                            "Plats prêts, recherche d'un livreur à proximité"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "searching_driver"
                            ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        3. Prêt / Chercher livreur
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "rejected",
                            "Commande refusée par le restaurant"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "rejected"
                            ? "bg-red-600 text-white border-red-600 font-bold"
                            : "bg-white text-red-600 border-red-300 hover:bg-red-50"
                        }`}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-4 sm:p-5 rounded-xl border border-gray-300 shadow-sm space-y-4">
              <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    Board Livreur (Courses)
                  </h2>
                  <p className="text-xs text-gray-500">
                    Accepter les courses, se rendre au restaurant, livrer au client.
                  </p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded">
                  {driverName}
                </span>
              </div>

              <div className="space-y-4">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {o.id}
                        </span>
                        <div className="text-gray-800 font-medium">
                          Départ : <strong>{o.restaurantName}</strong>
                        </div>
                        <div className="text-gray-600">
                          Livraison : {o.neighborhood} ({o.address})
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeColor(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                        {o.token && (
                          <Link
                            to={`/track/${o.token}`}
                            target="_blank"
                            className="block text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            Ouvrir suivi client ↗
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "heading_to_restaurant",
                            `Livreur ${driverName} en route vers le restaurant`,
                            {
                              courierName: driverName,
                              courierPhone: driverPhone
                            }
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "heading_to_restaurant"
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        4. Accepter course (Vers resto)
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "in_delivery",
                            "Commande récupérée, en route chez le client",
                            {
                              courierName: driverName,
                              courierPhone: driverPhone
                            }
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "in_delivery"
                            ? "bg-purple-600 text-white border-purple-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        5. Paquet récupéré (En livraison)
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "delivered",
                            "Commande livrée en main propre au client"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "delivered"
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        6. Marquer comme Livré ✓
                      </button>

                      <button
                        onClick={() =>
                          updateOrderStatus(
                            o,
                            "cancelled",
                            "Course annulée par le livreur"
                          )
                        }
                        className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                          o.status === "cancelled"
                            ? "bg-red-600 text-white border-red-600 font-bold"
                            : "bg-white text-red-600 border-red-300 hover:bg-red-50"
                        }`}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestBoardPage;
