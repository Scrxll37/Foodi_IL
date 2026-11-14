import React, { useState, useEffect } from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

export const NotificationDrawer: React.FC = () => {
  const { isNotifOpen, setIsNotifOpen, notifications, markNotificationRead, markAllNotificationsRead } = useApp();

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
    markAllNotificationsRead();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={handleClose}
        className={`notif-drawer-backdrop ${
          isClosing ? "drawer-fade-out" : "drawer-fade-in"
        }`}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`notif-drawer-panel pointer-events-auto ${
            isClosing ? "drawer-slide-out" : "drawer-slide-in"
          }`}
        >
          <div className="notif-drawer-header">
            <div className="notif-drawer-brand">
              <div className="notif-drawer-icon-box">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="notif-drawer-title">Notifications</h2>
                <p className="notif-drawer-subtitle">Vos alertes de livraison & offres</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer"
              className="notif-drawer-close-btn"
            >
              <X size={16} />
            </button>
          </div>

          <div className="notif-subbar">
            <span>Activité récente à Agadir</span>
            <button
              type="button"
              onClick={markAllRead}
              className="notif-mark-read-btn"
            >
              <CheckCheck size={14} />
              <span>Tout marquer lu</span>
            </button>
          </div>

          <div className="notif-drawer-body">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={38} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>Aucune notification pour le moment</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markNotificationRead(item.id)}
                  className={`notif-item-card ${!item.isRead ? "unread" : ""}`}
                >
                  <div className="notif-item-header">
                    <h4 className="notif-item-title">{item.title}</h4>
                    {!item.isRead && (
                      <span className="notif-unread-dot" />
                    )}
                  </div>
                  <p className="notif-item-message">{item.message}</p>
                  <span className="notif-item-time">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
