import React, { useState, useEffect } from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export const NotificationDrawer: React.FC = () => {
  const { isNotifOpen, setIsNotifOpen, notifications, markNotificationRead } = useApp();

  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isNotifOpen);

  useEffect(() => {
    if (isNotifOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isNotifOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsNotifOpen(false);
      setShouldRender(false);
    }, 280);
  };

  if (!shouldRender && !isNotifOpen) return null;

  const markAllRead = () => {
    notifications.forEach((n) => markNotificationRead(n.id));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity cursor-pointer ${
          isClosing ? "drawer-fade-out" : "drawer-fade-in"
        }`}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`w-screen max-w-sm bg-white shadow-2xl flex flex-col pointer-events-auto ${
            isClosing ? "drawer-slide-out" : "drawer-slide-in"
          }`}
        >
          <div className="px-5 py-4 border-b border-[#0B1020]/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#0B1020]">Notifications</h2>
                <p className="text-xs text-[#7A8194]">Vos alertes de livraison & offres</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full bg-[#0B1020]/5 text-[#3B4256] hover:bg-[#0B1020]/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between px-5 py-2.5 bg-[#FAF8F5] border-b border-[#0B1020]/5 text-xs text-[#7A8194]">
            <span>Activité récente à Agadir</span>
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 font-bold text-[#FF5A00] hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer lu</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7A8194]">
                <Bell className="w-10 h-10 mb-2 stroke-[1.5] text-[#7A8194]/50" />
                <p className="text-sm font-semibold">Aucune notification pour le moment</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markNotificationRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    item.isRead
                      ? "bg-white border-[#0B1020]/8"
                      : "bg-[#FFF3EA]/40 border-[#FF5A00]/25 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#0B1020]">{item.title}</h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#FF5A00] shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#3B4256] mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-[#7A8194] font-medium block mt-2">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};