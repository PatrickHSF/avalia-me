import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    loadReviews();
  }, []);

  return (
    <div className="pb-24">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg sticky top-0 z-40">
        <h1 className="text-2xl font-black text-white">Avaliações</h1>
        <p className="text-white/80 text-sm mt-1">Veja o que estão falando dos profissionais</p>
      </header>

      <main className="px-6 mt-8">
        {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-40 bg-gray-200 rounded-3xl animate-pulse"></div>
               ))}
             </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} 
                      alt={review.userName} 
                      className="w-12 h-12 rounded-full border-2 border-blue-100"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{review.userName}</h4>
                      <p className="text-xs text-gray-400">há {new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-3 py-1.5 rounded-xl flex items-center gap-1 text-blue-600 font-bold">
                    <Star size={14} fill="currentColor" className="text-amber-500" />
                    <span>{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-medium">Serviço de <span className="text-blue-600 font-bold">{review.providerName}</span></span>
                </div>
              </motion.div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-20">
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <MessageSquare className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Nenhuma avaliação ainda</h3>
                <p className="text-gray-500">Seja o primeiro a avaliar um profissional!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
