import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, where } from 'firebase/firestore';
import { db, logProviderClick } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Heart, ArrowLeft, Phone, User, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    async function loadFavorites() {
      const q = query(collection(db, 'users', user?.uid, 'favorites'));
      const snapshot = await getDocs(q);
      const favs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // For each favorite, fetch provider details
      const providerPromises = favs.map(async (f: any) => {
        const pDoc = await getDocs(query(collection(db, 'providers'), where('__name__', '==', f.providerId)));
        if (!pDoc.empty) {
          return { ...pDoc.docs[0].data(), id: pDoc.docs[0].id, favoriteId: f.id };
        }
        return null;
      });

      const results = await Promise.all(providerPromises);
      setFavorites(results.filter(r => r !== null));
      setLoading(false);
    }
    loadFavorites();
  }, [user]);

  const removeFavorite = async (favoriteId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'favorites', favoriteId));
    setFavorites(favorites.filter(f => f.favoriteId !== favoriteId));
  };

  const handleContactClick = (provider: any) => {
    window.open(`https://wa.me/${provider.whatsapp}`, '_blank');
    logProviderClick(provider.id);
  };

  return (
    <div className="pb-24">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg flex items-center gap-4 text-white">
        <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Favoritos</h1>
          <p className="text-white/80 text-sm">Seus prestadores salvos</p>
        </div>
      </header>

      <main className="px-6 mt-8">
        {loading ? (
             <div className="space-y-4">
               {[1, 2].map(i => <div key={i} className="h-40 bg-gray-200 rounded-3xl animate-pulse"></div>)}
             </div>
        ) : (
          <div className="space-y-4">
            {favorites.map(provider => (
              <motion.div 
                key={provider.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={provider.photoURL} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-sm"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{provider.name}</h4>
                    <p className="text-sm text-gray-500">{provider.category}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <Star size={14} className="text-amber-500" fill="currentColor" />
                       <span className="text-sm font-bold">{provider.rating}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFavorite(provider.favoriteId)}
                    className="bg-rose-50 p-3 rounded-2xl text-rose-500"
                  >
                    <Heart fill="currentColor" size={24} />
                  </button>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => handleContactClick(provider)}
                    className="flex-1 bg-green-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Contato
                  </button>
                  <button className="flex-1 bg-blue-50 text-blue-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
                    <User size={18} />
                    Perfil
                  </button>
                </div>
              </motion.div>
            ))}
            {favorites.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Heart className="mx-auto mb-4 opacity-20" size={64} />
                <p>Nenhum prestador favorito ainda.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
