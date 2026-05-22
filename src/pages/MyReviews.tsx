import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Star, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';

export default function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    async function loadMyReviews() {
      const q = query(
        collection(db, 'reviews'), 
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    loadMyReviews();
  }, [user, refreshTrigger]);

  const handleEditClick = async (review: any) => {
    setProviderLoading(true);
    try {
      const providerDoc = await getDoc(doc(db, 'providers', review.providerId));
      if (providerDoc.exists()) {
        setSelectedProvider({ id: providerDoc.id, ...providerDoc.data() });
      } else {
        // Fallback with basic review info if provider is not found or has been deleted
        setSelectedProvider({
          id: review.providerId,
          name: review.providerName,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.providerName)}`
        });
      }
    } catch (error) {
      console.error("Error loading provider for edit:", error);
      setSelectedProvider({
        id: review.providerId,
        name: review.providerName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(review.providerName)}`
      });
    } finally {
      setProviderLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg flex items-center gap-4 text-white">
        <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Minhas Avaliações</h1>
          <p className="text-white/80 text-sm">Histórico de feedbacks enviados</p>
        </div>
      </header>

      <main className="px-6 mt-8">
        {loading || providerLoading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-3xl animate-pulse"></div>)}
             </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-gray-900">{review.providerName}</h4>
                   <div className="flex items-center gap-1 text-amber-500 font-bold">
                     <Star size={14} fill="currentColor" />
                     <span>{review.rating}</span>
                   </div>
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {review.updatedAt ? `Atualizada em ${new Date(review.updatedAt).toLocaleDateString()}` : `Avaliada em ${new Date(review.createdAt).toLocaleDateString()}`}
                  </span>
                  <button 
                    onClick={() => handleEditClick(review)}
                    className="text-blue-650 bg-blue-50/70 hover:bg-blue-100/90 text-xs font-black px-4 py-2 rounded-full transition-colors active:scale-95 shadow-sm"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <Star className="mx-auto mb-4 opacity-20" size={64} />
                <p>Você ainda não fez nenhuma avaliação.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedProvider && (
        <ReviewModal
          provider={selectedProvider}
          isOpen={!!selectedProvider}
          onClose={() => {
            setSelectedProvider(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
