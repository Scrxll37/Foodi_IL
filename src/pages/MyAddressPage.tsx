import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { ArrowLeft, Home, Building2, Briefcase, HelpCircle, Check, Edit3, Navigation } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Loader } from "../components/Loader";
import { useApp } from "../context/AppContext";
import { UserAddress } from "../types";

export const MyAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const { address, saveAddress, user } = useApp();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [buildingType, setBuildingType] = useState<UserAddress["type"]>(address?.type || "apartment");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood || "Talborjt");
  const [street, setStreet] = useState(address?.street || "Avenue du 29 Février");
  const [buildingNameNumber, setBuildingNameNumber] = useState(address?.buildingNameNumber || "");
  const [floorNumber, setFloorNumber] = useState(address?.floorNumber || "");
  const [doorNumber, setDoorNumber] = useState(address?.doorNumber || "");
  const [instructions, setInstructions] = useState(address?.instructions || "");
  const [lat, setLat] = useState(address?.lat || 30.4278);
  const [lng, setLng] = useState(address?.lng || -9.5981);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const createPinIcon = (text: string) => {
    return L.divIcon({
      className: "custom-pin-wrapper",
      html: `
        <div class="custom-leaflet-pin" style="transform: translate(-50%, -100%);">
          <div class="custom-leaflet-tooltip">${text}</div>
          <div class="custom-leaflet-circle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate("/login?redirect=/myaddress");
    }
  }, [user.isLoggedIn, navigate]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([lat, lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: createPinIcon(neighborhood),
        draggable: true
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([lat, lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setIcon(createPinIcon(neighborhood));
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleLocateMe = () => {
    if (mapInstanceRef.current && markerRef.current) {
      const agadirCenter: [number, number] = [30.4278, -9.5981];
      mapInstanceRef.current.setView(agadirCenter, 16);
      markerRef.current.setLatLng(agadirCenter);
      setLat(agadirCenter[0]);
      setLng(agadirCenter[1]);
      setNeighborhood("Talborjt");
      setStreet("Avenue du 29 Février");
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    const newAddress: UserAddress = {
      id: address?.id || `addr_${Date.now()}`,
      type: buildingType,
      neighborhood,
      street,
      city: "Agadir",
      lat,
      lng,
      buildingNameNumber,
      floorNumber,
      doorNumber,
      instructions,
      isDefault: true
    };

    saveAddress(newAddress);
    setIsEditing(false);
    setStep(1);
  };

  if (pageLoading) {
    return <Loader fullScreen message="Chargement de votre adresse..." />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 md:pb-16">
      <HomeHeader showBackButton />

      <main className="max-w-[1100px] mx-auto px-0 sm:px-6 pt-0 md:pt-4 space-y-4">
        <div className="relative w-full h-[320px] md:h-[420px] sm:rounded-3xl overflow-hidden shadow-md border-y sm:border border-[#0B1020]/10 bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          <button
            onClick={() => navigate("/")}
            aria-label="Retour"
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white text-[#0B1020] shadow-lg flex items-center justify-center hover:bg-[#FFF3EA] hover:text-[#FF5A00] transition-colors md:hidden cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleLocateMe}
            aria-label="Recentrer sur Agadir"
            className="absolute bottom-5 right-5 z-10 bg-white text-[#0B1020] hover:text-[#FF5A00] font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-lg border border-[#0B1020]/10 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Navigation className="w-4 h-4 text-[#FF5A00]" />
            <span className="hidden sm:inline">Recentrer sur Agadir</span>
          </button>
        </div>

        <div className="px-4 sm:px-0">
          {!isEditing ? (
            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0">
                    {address?.type === "house" ? (
                      <Home className="w-6 h-6" />
                    ) : address?.type === "office" ? (
                      <Briefcase className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#12A150] bg-emerald-50 px-2 py-0.5 rounded-md">
                        Adresse active
                      </span>
                      <span className="text-xs text-[#7A8194] font-semibold">Agadir</span>
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-[#0B1020] mt-0.5">
                      {address?.neighborhood}, {address?.street}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="foodi-btn-primary py-2.5 px-4 text-xs font-extrabold cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier mon adresse</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#0B1020]/8 text-xs">
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                  <span className="text-[#7A8194] font-bold block mb-1">Bâtiment / Résidence</span>
                  <span className="font-extrabold text-[#0B1020]">
                    {address?.buildingNameNumber || "Non spécifié"}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                  <span className="text-[#7A8194] font-bold block mb-1">Étage & Porte</span>
                  <span className="font-extrabold text-[#0B1020]">
                    {address?.floorNumber ? `${address.floorNumber} - ` : ""}
                    {address?.doorNumber || "Non spécifié"}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                  <span className="text-[#7A8194] font-bold block mb-1">Instructions coursier</span>
                  <span className="font-extrabold text-[#0B1020]">
                    {address?.instructions || "Aucune consigne"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-[#0B1020]/8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#0B1020]/8">
                <div>
                  <h2 className="text-lg font-black text-[#0B1020]">
                    {step === 1 ? "Étape 1 : Type de logement" : "Étape 2 : Détails de votre adresse"}
                  </h2>
                  <p className="text-xs text-[#7A8194] mt-0.5">
                    {step === 1
                      ? "Sélectionnez votre type d'habitation à Agadir"
                      : "Complétez les informations pour guider le livreur Foodi"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      step === 1 ? "bg-[#FF5A00] text-white" : "bg-[#FAF8F5] text-[#3B4256]"
                    }`}
                  >
                    1
                  </span>
                  <span className="w-4 h-0.5 bg-[#0B1020]/10" />
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      step === 2 ? "bg-[#FF5A00] text-white" : "bg-[#FAF8F5] text-[#3B4256]"
                    }`}
                  >
                    2
                  </span>
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { type: "house" as const, label: "Maison", icon: Home },
                      { type: "apartment" as const, label: "Appartement", icon: Building2 },
                      { type: "office" as const, label: "Bureau", icon: Briefcase },
                      { type: "other" as const, label: "Autre", icon: HelpCircle }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = buildingType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setBuildingType(item.type)}
                          className={`p-4 rounded-2xl border text-center flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FFF3EA] border-[#FF5A00] text-[#FF5A00] shadow-sm"
                              : "bg-[#FAF8F5] border-[#0B1020]/8 text-[#3B4256] hover:border-[#FF5A00]/40"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-black">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs font-bold text-[#7A8194] hover:text-[#0B1020] cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="foodi-btn-primary py-3 px-6 text-xs font-black cursor-pointer"
                    >
                      Suivant : Remplir les informations
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                        Quartier (Agadir) *
                      </label>
                      <input
                        type="text"
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Talborjt, Dakhla, Founty..."
                        className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                        Nom de la rue / Avenue *
                      </label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ex: Avenue du 29 Février"
                        className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                        Nom ou numéro du bâtiment / Résidence
                      </label>
                      <input
                        type="text"
                        value={buildingNameNumber}
                        onChange={(e) => setBuildingNameNumber(e.target.value)}
                        placeholder="Ex: Résidence Fleurie, Bâtiment B"
                        className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                          Étage
                        </label>
                        <input
                          type="text"
                          value={floorNumber}
                          onChange={(e) => setFloorNumber(e.target.value)}
                          placeholder="Ex: 2ème"
                          className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                          Porte / Appt
                        </label>
                        <input
                          type="text"
                          value={doorNumber}
                          onChange={(e) => setDoorNumber(e.target.value)}
                          placeholder="Ex: Appt 12"
                          className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                      Instructions pour le coursier Foodi
                    </label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Ex: Laisser à la réception, sonner au portail extérieur..."
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00]"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#0B1020]/8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-[#7A8194] hover:text-[#0B1020] cursor-pointer"
                    >
                      Retour au type de logement
                    </button>
                    <button
                      type="submit"
                      className="foodi-btn-primary py-3 px-6 text-xs font-black flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer mon adresse</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      <CartDrawer />
      <NotificationDrawer />
      <MobileBottomNav />
    </div>
  );
};
