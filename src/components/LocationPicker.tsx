import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { X, Search as SearchIcon, Check, MapPin, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React using CDN URLs
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: string, coordinates?: { lat: number; lng: number }) => void;
  initialValue?: string;
}

export default function LocationPicker({ isOpen, onClose, onSelect, initialValue }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo default
  const [address, setAddress] = useState(initialValue || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Auto-locate when opening if no address is set
  useEffect(() => {
    if (isOpen && !address) {
      handleGetLocation();
    }
  }, [isOpen]);

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          fetchAddress(newPos[0], newPos[1]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Reverse Geocoding using Nominatim (Free)
  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search Address using Nominatim (Free)
  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const newPos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setPosition(newPos);
        setAddress(data[0].display_name);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  // Map click handler component
  function LocationMarker() {
    const map = useMap();
    
    useMapEvents({
      click(e) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });

    useEffect(() => {
      map.flyTo(position, map.getZoom());
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative bg-white w-full max-w-2xl h-[90vh] sm:h-[80vh] sm:rounded-[40px] rounded-t-[40px] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Selecionar Localização</h3>
                <p className="text-xs text-gray-400">Clique na sua cidade ou endereço no mapa</p>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-4 space-y-3">
               <div className="relative">
                 <button 
                  onClick={handleSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                 >
                   {searching ? <Loader2 className="animate-spin" size={20} /> : <SearchIcon size={20} />}
                 </button>
                 <input 
                   type="text"
                   placeholder="Pesquisar cidade ou bairro..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                   className="w-full bg-gray-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium border-2 border-transparent"
                 />
               </div>

               <button 
                onClick={handleGetLocation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 text-blue-600 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all shadow-sm"
               >
                 <Navigation size={16} />
                 Usar minha localização atual
               </button>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-10">
              <MapContainer 
                center={position} 
                zoom={13} 
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker />
              </MapContainer>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-gray-100 z-20">
              <div className="flex items-center gap-3 mb-6 bg-blue-50 p-4 rounded-2xl">
                <div className={`shrink-0 ${loading ? 'animate-pulse' : ''}`}>
                  <MapPin className="text-blue-600" size={24} />
                </div>
                <div className="overflow-hidden">
                   <p className="text-xs text-blue-600/60 font-bold uppercase tracking-wider">
                     {loading ? 'Buscando endereço...' : 'Local Selecionado'}
                   </p>
                   <p className="font-bold text-gray-900 truncate">
                     {address || 'Clique no mapa para selecionar...'}
                   </p>
                </div>
              </div>
              <button 
                onClick={() => onSelect(address, { lat: position[0], lng: position[1] })}
                disabled={!address || loading}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Confirmar Localização
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
