import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, MapPin, Package, Bike, CheckCircle2, RotateCcw, LogOut } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { useApp } from "../context/AppContext";
import ordersData from "../data/orders.json";
import { OrderRecord } from "../types";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, address, addToCart } = useApp();

  const orders: OrderRecord[] = ordersData as OrderRecord[];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleReorder = (order: OrderRecord) => {
    order.items.forEach((item) => {
      addToCart({
        dishId: `reorder-${item.name}`,
        restaurantId: order.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        restaurantName: order.restaurantName,
        name: item.name,
        price: item.price,
        image: order.restaurantLogo,
        quantity: item.quantity
      });
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader showBackButton />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-4 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center text-xl font-black shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#0B1020]">{user.name || "Client Foodi"}</h1>
                <span className="text-[10px] font-black uppercase text-[#12A150] bg-emerald-50 px-2 py-0.5 rounded-md">
                  Vérifié Agadir
                </span>
              </div>
              <p className="text-xs text-[#7A8194] mt-0.5 font-medium">
                {user.phone || "+212 6 12 34 56 78"} • {user.email || "client@foodi.ma"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/myaddress"
              className="foodi-btn-secondary py-2.5 px-4 text-xs font-extrabold"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
              <span>{address?.neighborhood || "Agadir"}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-10 px-3.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0B1020] to-[#1E293B] text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#12A150] animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-[#12A150]">
                Commande en cours de livraison
              </span>
            </div>
            <span className="text-xs font-mono text-white/70">#CMD-AGD-8821</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-lg font-black">McDonald's Agadir Talborjt</h3>
              <p className="text-xs text-white/70 mt-0.5">
                Livraison estimée : <strong className="text-white">12 - 18 minutes</strong>
              </p>
            </div>
            <span className="text-sm font-black text-[#FF5A00] bg-white/10 px-3 py-1.5 rounded-xl">
              Total : 176 MAD
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10 text-center text-xs">
            <div className="space-y-1.5">
              <div className="w-8 h-8 mx-auto rounded-full bg-[#12A150] text-white flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-bold block text-[11px] text-white">Validée</span>
            </div>
            <div className="space-y-1.5">
              <div className="w-8 h-8 mx-auto rounded-full bg-[#12A150] text-white flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-bold block text-[11px] text-white">En cuisine</span>
            </div>
            <div className="space-y-1.5">
              <div className="w-8 h-8 mx-auto rounded-full bg-[#FF5A00] text-white flex items-center justify-center ring-4 ring-[#FF5A00]/30 animate-pulse">
                <Bike className="w-4 h-4" />
              </div>
              <span className="font-black block text-[11px] text-[#FF5A00]">En livraison</span>
            </div>
            <div className="space-y-1.5 opacity-50">
              <div className="w-8 h-8 mx-auto rounded-full bg-white/10 text-white flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="font-bold block text-[11px]">Livrée</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#0B1020]">Historique des commandes</h2>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-[#0B1020]/8 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#0B1020]/8">
                  <div className="flex items-center gap-3">
                    <img
                      src={ord.restaurantLogo}
                      alt={ord.restaurantName}
                      className="w-12 h-12 rounded-xl object-contain border border-[#0B1020]/10 p-1"
                    />
                    <div>
                      <h4 className="font-extrabold text-base text-[#0B1020]">
                        {ord.restaurantName}
                      </h4>
                      <p className="text-xs text-[#7A8194]">
                        {ord.neighborhood} • {ord.date}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-[#12A150] bg-emerald-50 px-3 py-1 rounded-full">
                    {ord.statusLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-[#3B4256] font-semibold">
                        <strong className="text-[#0B1020]">{item.quantity}x</strong> {item.name}
                        {item.options ? ` (${item.options})` : ""}
                      </span>
                      <span className="font-bold text-[#0B1020]">
                        {item.price * item.quantity} MAD
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#0B1020]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#7A8194]">
                    Total payé : <strong className="text-sm font-black text-[#0B1020]">{ord.total} MAD</strong>
                  </div>

                  <button
                    onClick={() => handleReorder(ord)}
                    className="foodi-btn-secondary py-2 px-4 text-xs font-extrabold cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF5A00]" />
                    <span>Commander à nouveau</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
