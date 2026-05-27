import { Star, MapPin, Phone, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNotifications } from '../lib/NotificationContext';
import { db, logProviderClick } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { formatLocation } from '../lib/location';
import ProviderDetailsModal from './ProviderDetailsModal';

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [ratingStats, setRatingStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 });

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

  useEffect(() => {
    async function loadReviews() {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('providerId', '==', provider.id)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => doc.data());
        if (docs.length > 0) {
          const total = docs.reduce((acc, curr: any) => acc + curr.rating, 0);
          const avg = parseFloat((total / docs.length).toFixed(1));
          setRatingStats({ average: avg, count: docs.length });
        } else {
          setRatingStats({ average: 0, count: 0 });
        }
      } catch (error) {
        console.error("Error loading reviews for ProviderCard:", error);
      }
    }
    if (provider?.id) {
      loadReviews();
    }
  }, [provider.id, isDetailsOpen]);

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
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-4 transition-all duration-300 hover:shadow-md hover:border-gray-200"
      >
        <div 
          onClick={() => setIsDetailsOpen(true)}
          className="flex gap-4 cursor-pointer group"
        >
          <img 
            src={provider.photoURL} 
            alt={provider.name}
            className="w-20 h-20 rounded-2xl object-cover shadow-sm group-hover:scale-102 transition-transform duration-300 shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate leading-snug">
                    {provider.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{provider.category}</p>
                    {provider.featured && !hideSponsoredBadge && (
                      <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                        ⚡ Patrocinado
                      </span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
                  className={`p-1.5 rounded-xl transition-all shrink-0 -mt-1 ${isFavorite ? "bg-rose-50 text-rose-500" : "bg-gray-50 hover:bg-gray-100 text-gray-300 hover:text-gray-400"}`}
                >
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-2 text-xs flex-wrap">
              {ratingStats.count > 0 ? (
                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg font-bold shrink-0">
                  <Star size={12} fill="currentColor" />
                  <span>{ratingStats.average.toFixed(1)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg shrink-0 font-bold">
                  <Star size={12} fill="none" className="text-gray-300" />
                  <span>0.0</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-gray-400 min-w-0 flex-1 font-medium">
                <MapPin size={12} className="shrink-0 text-gray-400" />
                <span className="truncate">{formatLocation(provider.location)}</span>
              </div>
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

      <AnimatePresence>
        {isDetailsOpen && (
          <ProviderDetailsModal 
            provider={provider}
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
