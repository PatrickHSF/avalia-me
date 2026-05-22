import { Star, MapPin, Phone, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNotifications } from '../lib/NotificationContext';
import { db, logProviderClick } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface ProviderCardProps {
  provider: any;
  onReview?: () => void;
  hideSponsoredBadge?: boolean;
  key?: any;
}

export default function ProviderCard({ provider, onReview, hideSponsoredBadge }: ProviderCardProps) {
  const { user } = useAuth();
  const { addReminder } = useNotifications();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function checkFavorite() {
      const q = query(
        collection(db, 'users', user?.uid || '', 'favorites'),
        where('providerId', '==', provider.id)
      );
      const snapshot = await getDocs(q);
      setIsFavorite(!snapshot.empty);
      setFavLoading(false);
    }
    checkFavorite();
  }, [user, provider.id]);

  const toggleFavorite = async () => {
    if (!user) return;
    try {
      const favQuery = query(
        collection(db, 'users', user.uid, 'favorites'),
        where('providerId', '==', provider.id)
      );
      const snapshot = await getDocs(favQuery);
      
      if (!snapshot.empty) {
        await deleteDoc(doc(db, 'users', user.uid, 'favorites', snapshot.docs[0].id));
        setIsFavorite(false);
      } else {
        const newFavRef = doc(collection(db, 'users', user.uid, 'favorites'));
        await setDoc(newFavRef, {
          providerId: provider.id,
          createdAt: new Date().toISOString()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá ${provider.name}, vi seu perfil no Avalia-Me e gostaria de um orçamento.`);
    window.open(`https://wa.me/${provider.whatsapp}?text=${message}`, '_blank');
    
    // Log the contact click
    logProviderClick(provider.id);
    
    // Trigger notification
    addReminder(provider.id, provider.name, provider.photoURL);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-4"
    >
      <div className="flex gap-4">
        <img 
          src={provider.photoURL} 
          alt={provider.name}
          className="w-20 h-20 rounded-2xl object-cover shadow-sm"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
                {provider.featured && !hideSponsoredBadge && (
                  <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                    ⚡ Patrocinado
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm font-medium mt-0.5">{provider.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                className={`p-2 rounded-xl transition-all ${isFavorite ? "bg-rose-50 text-rose-500" : "bg-gray-50 text-gray-300"}`}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold">{provider.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-3">
            <MapPin size={12} />
            <span>{provider.location}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button 
          onClick={handleWhatsApp}
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Phone size={18} />
          Contato
        </button>
        <button 
          onClick={onReview}
          className="flex-1 bg-gray-50 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Star size={18} />
          Avaliar
        </button>
      </div>
    </motion.div>
  );
}
