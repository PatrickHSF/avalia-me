import React, { useState, useEffect } from 'react';
import { Star, X, MapPin, Phone, MessageSquare, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, logProviderClick } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { formatLocation } from '../lib/location';
import { useAuth } from '../lib/AuthContext';
import { useNotifications } from '../lib/NotificationContext';
import ReviewModal from './ReviewModal';

interface ProviderDetailsModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProviderDetailsModal({ provider, isOpen, onClose }: ProviderDetailsModalProps) {
  const { user } = useAuth();
  const { addReminder } = useNotifications();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load reviews and favorite status
  useEffect(() => {
    if (!isOpen || !provider?.id) return;

    setLoadingReviews(true);

    async function fetchData() {
      try {
        // Load reviews
        const q = query(collection(db, 'reviews'), where('providerId', '==', provider.id));
        const snapshot = await getDocs(q);
        const fetchedReviews = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error loading reviews for provider details:", error);
      } finally {
        setLoadingReviews(false);
      }

      // Check if favorite
      if (user) {
        try {
          const favQuery = query(
            collection(db, 'users', user.uid, 'favorites'),
            where('providerId', '==', provider.id)
          );
          const favSnapshot = await getDocs(favQuery);
          setIsFavorite(!favSnapshot.empty);
        } catch (error) {
          console.error("Error checking favorite:", error);
        } finally {
          setFavLoading(false);
        }
      } else {
        setFavLoading(false);
      }
    }

    fetchData();
  }, [isOpen, provider?.id, user, isReviewOpen]);

  if (!isOpen) return null;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    
    // Log click and trigger reminder
    logProviderClick(provider.id);
    addReminder(provider.id, provider.name, provider.photoURL);
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl text-left my-auto flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 shrink-0">
            <div className="flex gap-4 items-center min-w-0 flex-1">
              <img 
                src={provider.photoURL} 
                alt={provider.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-gray-900 leading-tight break-words">{provider.name}</h2>
                  {provider.featured && (
                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                      ⚡ Patrocinado
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mt-0.5">{provider.category}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button 
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`p-2 rounded-xl transition-all ${isFavorite ? "bg-rose-50 text-rose-500" : "bg-gray-100 text-gray-400"}`}
              >
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-xl transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-600">
            {/* Quick Stats / Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-50/50 p-4 rounded-3xl flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2.5 rounded-2xl shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-blue-600/60 font-black uppercase tracking-wider">Localização</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{formatLocation(provider.location)}</p>
                </div>
              </div>
              
              <div className="bg-amber-50/50 p-4 rounded-3xl flex items-center gap-3">
                <div className="bg-amber-500 text-white p-2.5 rounded-2xl shrink-0">
                  <Star fill="currentColor" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-amber-600/60 font-black uppercase tracking-wider font-mono">Nota Geral</p>
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {provider.rating ? provider.rating.toFixed(1) : "5.0"}
                    <span className="text-xs text-gray-400 font-normal ml-1">({reviews.length} avaliações)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Service Custom Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-blue-600/80">Descrição dos Serviços</h3>
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                <p className="whitespace-pre-line text-sm text-gray-700 leading-relaxed font-medium">
                  {provider.description || "Este profissional não adicionou uma descrição detalhada."}
                </p>
              </div>
            </div>

            {/* List of Reviews */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest text-blue-600/80">Avaliações do Profissional</h3>
              </div>

              {loadingReviews ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2.5 items-center">
                          <img 
                            src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} 
                            alt={review.userName} 
                            className="w-8 h-8 rounded-full border border-blue-100"
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{review.userName}</p>
                            <p className="text-[10px] text-gray-400">há {new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-1 rounded-xl text-xs font-black">
                          <Star size={12} fill="currentColor" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm italic font-medium">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <MessageSquare className="text-gray-300 mx-auto mb-2" size={28} />
                  <p className="text-xs text-gray-400 font-bold">Nenhuma avaliação ainda</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Seja o primeiro a contratá-lo e avaliar!</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/80 shrink-0 flex items-center justify-center gap-10">
            <button 
              onClick={handleWhatsApp}
              className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-[#20ba5a] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
              title="Contratar no WhatsApp"
            >
              <svg className="w-8 h-8 fill-current" viewBox="0 0 448 512" width="32" height="32">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="w-16 h-16 bg-white border border-amber-200 text-amber-400 rounded-full flex items-center justify-center hover:bg-amber-50 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title="Escrever Avaliação"
            >
              <Star size={32} fill="currentColor" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewOpen && (
          <ReviewModal 
            provider={provider}
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
