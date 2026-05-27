import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

interface ReviewModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ provider, isOpen, onClose }: ReviewModalProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    if (!isOpen || !user || !provider?.id) {
      setExistingReview(null);
      setIsEditMode(false);
      setRating(0);
      setComment('');
      return;
    }

    async function checkExistingReview() {
      setCheckingExisting(true);
      try {
        const q = query(
          collection(db, 'reviews'),
          where('userId', '==', user?.uid),
          where('providerId', '==', provider.id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const rId = snapshot.docs[0].id;
          const found: any = { id: rId, ...docData };
          setExistingReview(found);
          setIsEditMode(true);
          setRating(found.rating || 0);
          setComment(found.comment || '');
        } else {
          setExistingReview(null);
          setIsEditMode(false);
          setRating(0);
          setComment('');
        }
      } catch (error) {
        console.error("Error checking existing review:", error);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingReview();
  }, [isOpen, user, provider?.id]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      if (isEditMode && existingReview) {
        // Update existing review document
        try {
          const reviewRef = doc(db, 'reviews', existingReview.id);
          await updateDoc(reviewRef, {
            rating,
            comment,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `reviews/${existingReview.id}`);
        }
      } else {
        // Create new review
        const review = {
          userId: user?.uid,
          userName: profile?.name || user?.displayName,
          userPhoto: profile?.photoURL || user?.photoURL,
          providerId: provider.id,
          providerName: provider.name,
          rating,
          comment,
          createdAt: new Date().toISOString()
        };
        
        try {
          await addDoc(collection(db, 'reviews'), review);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'reviews');
        }
        
        try {
          // Update provider rating count (simplified)
          const providerRef = doc(db, 'providers', provider.id);
          await updateDoc(providerRef, {
             reviewCount: increment(1),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `providers/${provider.id}`);
        }
      }

      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center">
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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            {checkingExisting ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-bold text-sm">Verificando sua avaliação...</p>
              </div>
            ) : (
              <div className="text-center">
                <img 
                  src={provider.photoURL} 
                  alt={provider.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-50 shadow-lg object-cover"
                />

                {isEditMode && (
                  <div className="bg-amber-50 text-amber-900 p-4 rounded-3xl text-sm font-semibold mb-5 text-center border border-amber-200 leading-relaxed shadow-sm">
                    Você já avaliou este prestador. Gostaria de atualizar sua avaliação sobre esse prestador?
                  </div>
                )}

                <p className="text-gray-400 text-sm mb-2">O serviço merece quantas estrelas?</p>
                <h2 className="text-2xl font-black text-gray-900 mb-6">
                  {isEditMode ? "Atualizar Avaliação" : `Avalie ${provider.name}`}
                </h2>
                
                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-125"
                    >
                      <Star 
                        size={40} 
                        fill={star <= rating ? "#F59E0B" : "none"}
                        className={star <= rating ? "text-amber-500" : "text-gray-200"}
                      />
                    </button>
                  ))}
                </div>

                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos como foi a prestação de serviço, assim podemos indicar para novos clientes, oferecendo o melhor para todos"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 outline-none rounded-3xl p-4 text-gray-700 placeholder:text-gray-400 mb-6 min-h-[120px] transition-all resize-none"
                />

                <button 
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="w-full bg-blue-600 disabled:bg-gray-300 text-white font-black py-5 rounded-3xl shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? "Enviando..." : (isEditMode ? "Atualizar avaliação" : "Enviar avaliação")}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
