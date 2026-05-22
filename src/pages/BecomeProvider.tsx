import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, Briefcase, MapPin, Phone, Info, Grid, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import { CATEGORIES } from '../lib/categories';

export default function BecomeProvider() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    category: '',
    location: '',
    whatsapp: '',
    description: '',
  });

  useEffect(() => {
    if (!user) return;
    async function checkExistingProvider() {
      try {
        const q = query(collection(db, 'providers'), where('userId', '==', user?.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setProviderId(snapshot.docs[0].id);
          setFormData({
            name: data.name || '',
            category: data.category || '',
            location: data.location || '',
            whatsapp: data.whatsapp || '',
            description: data.description || '',
          });
        }
      } catch (error) {
        console.error("Error checking provider:", error);
      } finally {
        setFetching(false);
      }
    }
    checkExistingProvider();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const providerData = {
        ...formData,
        userId: user.uid,
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      };

      try {
        if (providerId) {
          await updateDoc(doc(db, 'providers', providerId), providerData);
        } else {
          await addDoc(collection(db, 'providers'), {
            ...providerData,
            rating: 5.0,
            reviewCount: 0,
            featured: false,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, providerId ? OperationType.UPDATE : OperationType.CREATE, providerId ? `providers/${providerId}` : 'providers');
      }

      try {
        // Also update user profile with location to personalize experience
        await updateDoc(doc(db, 'users', user.uid), {
          location: formData.location,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      // 1. Delete all reviews for this provider
      const reviewsQuery = query(collection(db, 'reviews'), where('providerId', '==', providerId));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const deletePromises = reviewsSnapshot.docs.map(reviewDoc => deleteDoc(doc(db, 'reviews', reviewDoc.id)));
      await Promise.all(deletePromises);
      
      // 2. Delete provider profile
      await deleteDoc(doc(db, 'providers', providerId));
      
      navigate('/profile');
    } catch (error) {
      console.error("Erro ao remover perfil:", error);
      // Modern way to handle and report errors
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: 'delete',
        path: `providers/${providerId}`,
        authInfo: { userId: user?.uid }
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
      alert("Houve um erro ao tentar remover seu perfil. Por favor, verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center text-green-500 mb-6"
        >
          <CheckCircle size={48} />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Sucesso!</h2>
        <p className="text-gray-500">
          Seu perfil profissional foi {providerId ? 'atualizado' : 'criado'} com sucesso. Redirecionando...
        </p>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-12 bg-gray-50 min-h-screen">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg text-white flex items-center gap-4 text-left">
        <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black">
            {providerId ? 'Editar Perfil Profissional' : 'Seja um Prestador'}
          </h1>
          <p className="text-white/80 text-sm">
            {providerId ? 'Mantenha seus dados atualizados' : 'Cadastre seus serviços na plataforma'}
          </p>
        </div>
      </header>

      <main className="px-6 -mt-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-100 text-left"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" />
                Nome Profissional
              </label>
              <input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João da Elétrica"
                className="w-full bg-gray-50 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Grid size={16} className="text-blue-500" />
                Categoria
              </label>
              <select 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium "
              >
                <option value="">Selecione uma categoria</option>
                {[...CATEGORIES].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="Outros">❓ Outros</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500" />
                Localização
              </label>
              <button 
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full bg-gray-50 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium text-left flex items-center justify-between group"
              >
                <span className={formData.location ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.location || "Selecionar no mapa..."}
                </span>
                <MapPin size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Phone size={16} className="text-blue-500" />
                WhatsApp (apenas números)
              </label>
              <input 
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="Ex: 5544999999999"
                className="w-full bg-gray-50 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Info size={16} className="text-blue-500" />
                Descrição dos Serviços
              </label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Fale um pouco sobre sua experiência e os serviços que oferece..."
                className="w-full bg-gray-50 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-500 transition-all font-medium resize-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Processando..." : (providerId ? "Salvar Alterações" : "Finalizar Cadastro")}
              </button>

              {providerId && (
                <button 
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={loading}
                  className="w-full bg-red-50 text-red-500 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                >
                  <Trash2 size={20} />
                  Remover Perfil Profissional
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </main>

      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setShowConfirmDelete(false)}
              className="absolute inset-0 bg-red-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="mb-6 mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Atenção!</h3>
              <div className="text-gray-500 text-sm space-y-3 mb-8 text-left bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p>⚠️ <strong>Esta ação é irreversível:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Todas as suas <strong>avaliações</strong> serão apagadas permanentemente.</li>
                  <li>Você perderá seu <strong>ranking</strong> nestas categorias.</li>
                  <li>Seu histórico profissional na plataforma será removido.</li>
                </ul>
                <p>Deseja realmente prosseguir com a exclusão?</p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Excluindo..." : "Sim, Excluir Tudo"}
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={loading}
                  className="w-full text-gray-400 font-bold py-2 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LocationPicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialValue={formData.location}
        onSelect={(loc) => {
          setFormData({...formData, location: loc});
          setIsPickerOpen(false);
        }}
      />
    </div>
  );
}
