import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import { Home, Building2, Briefcase, HelpCircle, Check, Edit3, Navigation, MapPin, ArrowRight, ArrowLeft, X } from "lucide-react";
import { HomeHeader } from "../components/HomeHeader";
import { CartDrawer } from "../components/CartDrawer";
import { NotificationDrawer } from "../components/NotificationDrawer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { useApp } from "../context/AppContext";
import { UserAddress } from "../types";

const AGADIR_BOUNDS: L.LatLngBoundsExpression = [
  [30.25, -9.75],
  [30.60, -9.40]
];

export const MyAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isProfileSetup = searchParams.get("complete") === "1";
  const { address, saveAddress, user } = useApp();

  const [mode, setMode] = useState<"view" | "edit-map" | "edit-details">("view");
  const modeRef = useRef<"view" | "edit-map" | "edit-details">("view");

  const [buildingType, setBuildingType] = useState<UserAddress["type"]>(address?.type || "apartment");
  const [hasSelectedType, setHasSelectedType] = useState(Boolean(address?.type));

  const [street, setStreet] = useState(address?.street || "Avenue du 29 Février");
  const [neighborhood, setNeighborhood] = useState(address?.neighborhood || "Talborjt");
  const [buildingNameNumber, setBuildingNameNumber] = useState(address?.buildingNameNumber || "");
  const [floorNumber, setFloorNumber] = useState(address?.floorNumber || "");
  const [doorNumber, setDoorNumber] = useState(address?.doorNumber || "");
  const [instructions, setInstructions] = useState(address?.instructions || "");
  const [lat, setLat] = useState(address?.lat || 30.4278);
  const [lng, setLng] = useState(address?.lng || -9.5981);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSavedAlert, setShowSavedAlert] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    modeRef.current = mode;
    if (markerRef.current) {
      if (mode === "edit-map") {
        markerRef.current.dragging?.enable();
      } else {
        markerRef.current.dragging?.disable();
      }
    }
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || data.name || "Agadir";
        const district = addr.suburb || addr.neighbourhood || addr.city_district || "Agadir";
        setStreet(road);
        setNeighborhood(district);
      }
    } catch {
    } finally {
      setIsGeocoding(false);
    }
  };

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
        zoomControl: false,
        attributionControl: false,
        maxBounds: AGADIR_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 12
      }).setView([lat, lng], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const marker = L.marker([lat, lng], {
        icon: createPinIcon(street),
        draggable: false
      }).addTo(map);

      marker.on("dragend", () => {
        if (modeRef.current !== "edit-map") return;
        const position = marker.getLatLng();
        const bounds = L.latLngBounds(AGADIR_BOUNDS);
        if (!bounds.contains(position)) return;
        setLat(position.lat);
        setLng(position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      map.on("click", (e) => {
        if (modeRef.current !== "edit-map") return;
        const bounds = L.latLngBounds(AGADIR_BOUNDS);
        if (!bounds.contains(e.latlng)) return;
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      const handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, []);

  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createPinIcon(street));
    }
  }, [street, lat, lng]);

  const handleLocateMe = () => {
    const agadirCenter: [number, number] = [30.4278, -9.5981];
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView(agadirCenter, 16, { animate: true });
      markerRef.current.setLatLng(agadirCenter);
      markerRef.current.setIcon(createPinIcon("Avenue du 29 Février"));
    }
    setLat(agadirCenter[0]);
    setLng(agadirCenter[1]);
    setStreet("Avenue du 29 Février");
    setNeighborhood("Talborjt");
  };

  const handleConfirmMapLocation = () => {
    setMode("edit-details");
    if (markerRef.current) {
      markerRef.current.dragging?.disable();
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    const newAddress: UserAddress = {
      id: address?.id || `addr_${Date.now()}`,
      type: buildingType || "apartment",
      neighborhood: neighborhood || "Agadir",
      street: street || "Agadir",
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
    const userKey = `foodi_setprofile_${user.id || user.email}`;
    localStorage.setItem(userKey, "1");
    localStorage.setItem("foodi_setprofile", "1");
    setMode("view");
    setShowSavedAlert(true);
    setTimeout(() => {
      setShowSavedAlert(false);
      if (isProfileSetup) {
        navigate("/", { replace: true });
      }
    }, 1500);
  };

  const isPhoneFullScreenMap = mode === "edit-map";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 lg:pb-16 flex flex-col justify-between">
      {!isPhoneFullScreenMap && <HomeHeader showBackButton />}

      {showSavedAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#ECFDF5] border border-[#10B981] text-[#065F46] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-[90vw] animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <h4 className="font-black text-xs">Adresse enregistrée avec succès !</h4>
            <p className="text-[11px] text-[#047857]">Votre adresse de livraison a été mise à jour.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSavedAlert(false)}
            className="text-[#065F46] hover:text-[#047857] ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-6 pt-3 lg:pt-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={
              isPhoneFullScreenMap
                ? "fixed inset-0 z-50 w-screen h-screen bg-white flex flex-col"
                : mode === "edit-details"
                ? "hidden lg:block lg:col-span-7 xl:col-span-8 w-full"
                : "lg:col-span-7 xl:col-span-8 w-full"
            }
          >
            <div
              className={`relative w-full overflow-hidden bg-slate-100 ${
                isPhoneFullScreenMap
                  ? "flex-1 h-full rounded-none"
                  : "h-[300px] sm:h-[400px] lg:h-[640px] rounded-3xl shadow-sm border border-[#0B1020]/10"
              }`}
            >
              <div
                ref={mapContainerRef}
                className="w-full h-full z-0"
                style={{ minHeight: isPhoneFullScreenMap ? "100%" : "300px" }}
              />

              <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-col items-center gap-2 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg text-xs font-black text-[#0B1020] flex items-center gap-2 border border-[#0B1020]/10 max-w-full pointer-events-auto">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#12A150] animate-pulse shrink-0" />
                  <span className="truncate">{isGeocoding ? "Recherche de l'adresse..." : street || "Agadir, Maroc"}</span>
                </div>

                {mode === "edit-map" && (
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={handleConfirmMapLocation}
                      className="bg-[#12A150] hover:bg-[#0E8341] text-white font-black text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 cursor-pointer border-2 border-white transition-all transform active:scale-95"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Valider la position</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLocateMe}
                      className="bg-white hover:bg-[#FAF8F5] text-[#0B1020] font-black text-xs p-2 rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-[#0B1020]/10"
                      title="Recentrer sur Agadir"
                    >
                      <Navigation className="w-4 h-4 text-[#FF5A00]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("view")}
                      className="bg-white hover:bg-[#FAF8F5] text-[#EF4444] font-black text-xs p-2 rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-[#0B1020]/10"
                      title="Annuler"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              
            </div>
          </div>

          <div
            className={`w-full ${
              isPhoneFullScreenMap
                ? "hidden"
                : mode === "edit-details"
                ? "lg:col-span-5 xl:col-span-4"
                : "lg:col-span-5 xl:col-span-4"
            }`}
          >
            {mode === "view" && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0B1020]/8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#0B1020]/8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#12A150] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      Adresse active
                    </span>
                    <p className="text-xs text-[#7A8194] mt-1">Point de livraison principal</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode("edit-map")}
                    className="foodi-btn-primary py-2.5 px-4 rounded-xl text-xs font-black shadow-md shadow-[#FF5A00]/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier l'adresse</span>
                  </button>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#FFF3EA] text-[#FF5A00] flex items-center justify-center shrink-0 shadow-xs">
                    {address?.type === "house" ? (
                      <Home className="w-6 h-6" />
                    ) : address?.type === "office" ? (
                      <Briefcase className="w-6 h-6" />
                    ) : address?.type === "other" ? (
                      <HelpCircle className="w-6 h-6" />
                    ) : (
                      <Building2 className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[#7A8194] font-semibold">Agadir, Maroc</span>
                    <h1 className="text-lg sm:text-xl font-black text-[#0B1020] truncate">
                      {street || address?.street || "Agadir, Maroc"}
                    </h1>
                  </div>
                </div>

                <div className="space-y-3 text-xs pt-2">
                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-[#7A8194] font-bold">Type d'habitation</span>
                    <span className="font-black text-[#0B1020] capitalize">
                      {address?.type === "house"
                        ? "Maison"
                        : address?.type === "office"
                        ? "Bureau"
                        : address?.type === "other"
                        ? "Autre"
                        : "Appartement"}
                    </span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl flex items-center justify-between">
                    <span className="text-[#7A8194] font-bold">Bâtiment / Résidence</span>
                    <span className="font-black text-[#0B1020]">
                      {address?.buildingNameNumber || "Non spécifié"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                      <span className="text-[#7A8194] font-bold block mb-1">Étage</span>
                      <span className="font-black text-[#0B1020]">
                        {address?.floorNumber || "Rez-de-chaussée"}
                      </span>
                    </div>

                    <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                      <span className="text-[#7A8194] font-bold block mb-1">N° Porte</span>
                      <span className="font-black text-[#0B1020]">
                        {address?.doorNumber || "Non spécifié"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FAF8F5] p-3.5 rounded-2xl">
                    <span className="text-[#7A8194] font-bold block mb-1">Commentaire livreur</span>
                    <span className="font-extrabold text-[#3B4256]">
                      {address?.instructions || "Aucun commentaire"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {mode === "edit-map" && (
              <div className="hidden lg:block bg-white rounded-3xl p-6 sm:p-7 border border-[#0B1020]/8 shadow-sm space-y-5">
                <div className="pb-3 border-b border-[#0B1020]/8">
                  <div className="inline-flex items-center gap-1.5 bg-[#FFF3EA] text-[#FF5A00] px-3 py-1 rounded-full text-xs font-black mb-2">
                    <span>Étape 1 : Ajuster la carte</span>
                  </div>
                  <h2 className="text-lg font-black text-[#0B1020]">
                    Placez votre repère de livraison
                  </h2>
                  <p className="text-xs text-[#7A8194] mt-1">
                    Déplacez ou cliquez sur la carte à gauche pour cibler l'emplacement exact de votre porte.
                  </p>
                </div>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0B1020]/6 space-y-1">
                  <span className="text-[11px] font-bold text-[#7A8194]">Emplacement détecté :</span>
                  <p className="text-sm font-black text-[#0B1020] truncate">
                    {isGeocoding ? "Recherche en cours..." : street}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleConfirmMapLocation}
                    className="foodi-btn-primary w-full py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-[#FF5A00]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Valider la position et continuer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("view")}
                    className="w-full py-2.5 text-xs font-bold text-[#7A8194] hover:text-[#0B1020] cursor-pointer text-center"
                  >
                    Annuler la modification
                  </button>
                </div>
              </div>
            )}

            {mode === "edit-details" && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#0B1020]/8 shadow-sm space-y-5">
                <div className="pb-3 border-b border-[#0B1020]/8">
                  <div className="inline-flex items-center gap-1.5 bg-[#FFF3EA] text-[#FF5A00] px-3 py-1 rounded-full text-xs font-black mb-1.5">
                    <span>Étape 2 : Vos coordonnées</span>
                  </div>
                  <h2 className="text-lg font-black text-[#0B1020]">
                    Renseignez votre logement
                  </h2>
                  <p className="text-xs text-[#7A8194] truncate">
                    Position calée : <span className="font-bold text-[#0B1020]">{street}</span>
                  </p>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-[#3B4256] mb-2 uppercase tracking-wider">
                      Choisissez votre type de logement :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { type: "apartment" as const, label: "Appartement", icon: Building2 },
                        { type: "house" as const, label: "Maison", icon: Home },
                        { type: "office" as const, label: "Bureau", icon: Briefcase },
                        { type: "other" as const, label: "Autre", icon: HelpCircle }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = buildingType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              setBuildingType(item.type);
                              setHasSelectedType(true);
                            }}
                            className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#FFF3EA] border-[#FF5A00] text-[#FF5A00] shadow-xs font-black scale-102"
                                : "bg-[#FAF8F5] border-[#0B1020]/8 text-[#3B4256] hover:border-[#FF5A00]/40 font-bold"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-[11px]">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {hasSelectedType && (
                    <div className="space-y-3.5 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                          {buildingType === "house" ? "Numéro ou nom de la maison" : "Nom du bâtiment / Résidence"}
                        </label>
                        <input
                          type="text"
                          value={buildingNameNumber}
                          onChange={(e) => setBuildingNameNumber(e.target.value)}
                          placeholder={buildingType === "house" ? "Ex: Maison N° 12, Villa Yasmina..." : "Ex: Résidence Fleurie, Bâtiment B..."}
                          className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                        />
                      </div>

                      {buildingType !== "house" && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                              Étage
                            </label>
                            <input
                              type="text"
                              value={floorNumber}
                              onChange={(e) => setFloorNumber(e.target.value)}
                              placeholder="Ex: 2ème"
                              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                              N° Porte / Appt
                            </label>
                            <input
                              type="text"
                              value={doorNumber}
                              onChange={(e) => setDoorNumber(e.target.value)}
                              placeholder="Ex: Appt 12"
                              className="w-full px-4 py-3 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-[#3B4256] mb-1.5">
                          Commentaire pour le coursier
                        </label>
                        <textarea
                          rows={2}
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="Ex: Sonner à l'interphone, portail gris, appeler à l'arrivée..."
                          className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#0B1020]/10 rounded-xl text-xs font-bold text-[#0B1020] focus:outline-none focus:border-[#FF5A00] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#0B1020]/8">
                        <button
                          type="button"
                          onClick={() => setMode("edit-map")}
                          className="text-xs font-bold text-[#7A8194] hover:text-[#0B1020] cursor-pointer py-2 px-3 flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Revoir la carte</span>
                        </button>

                        <button
                          type="submit"
                          className="foodi-btn-primary py-3 px-6 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FF5A00]/20"
                        >
                          <Check className="w-4 h-4" />
                          <span>Enregistrer l'adresse</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {!isPhoneFullScreenMap && (
        <>
          <CartDrawer />
          <NotificationDrawer />
          <MobileBottomNav />
        </>
      )}
    </div>
  );
};
