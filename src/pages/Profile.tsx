import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Star, Heart, Shield, HelpCircle, Settings, ChevronRight, User as UserIcon, Briefcase, MapPin, TrendingUp, CreditCard, LayoutDashboard, X, Camera, Check, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import EngagementModal from '../components/EngagementModal';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEngagementOpen, setIsEngagementOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [providerPlan, setProviderPlan] = useState('');
  const [stats, setStats] = useState({
    reviewsCount: 0,
    favoritesCount: 0,
    averageRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Profile image editing state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (profile?.photoURL) {
      setPhotoUrlInput(profile.photoURL);
    }
  }, [profile?.photoURL]);

  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      try {
        // Query reviews
        const reviewsQ = query(collection(db, 'reviews'), where('userId', '==', user.uid));
        const reviewsSnapshot = await getDocs(reviewsQ);
        const reviewsCount = reviewsSnapshot.size;

        let totalRating = 0;
        reviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          totalRating += data.rating || 0;
        });
        const averageRating = reviewsCount > 0 ? parseFloat((totalRating / reviewsCount).toFixed(1)) : 0;

        // Query favorites
        const favoritesQ = query(collection(db, 'users', user.uid, 'favorites'));
        const favoritesSnapshot = await getDocs(favoritesQ);
        const favoritesCount = favoritesSnapshot.size;

        // Check if provider
        const providersQ = query(collection(db, 'providers'), where('userId', '==', user.uid));
        const providersSnapshot = await getDocs(providersQ);
        if (!providersSnapshot.empty) {
          setIsProvider(true);
          const pDoc = providersSnapshot.docs[0];
          setProviderId(pDoc.id);
          const pData = pDoc.data();
          setProviderPlan(pData.plan || 'bronze');
        } else {
          setIsProvider(false);
          setProviderId('');
          setProviderPlan('');
        }

        setStats({
          reviewsCount,
          favoritesCount,
          averageRating,
        });
      } catch (error) {
        console.error("Error loading user profile stats:", error);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  const setLocation = async (loc: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        location: loc,
        updatedAt: new Date().toISOString()
      });
      setIsPickerOpen(false);
      // Profile will auto-refresh via AuthContext
    } catch (error) {
      console.error("Error setting location:", error);
    }
  };

  const handleSavePhoto = async (newUrl: string) => {
    if (!user) return;
    setSavingPhoto(true);
    try {
      // 1. Update user profile photo
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: newUrl,
        updatedAt: new Date().toISOString()
      });

      // 2. If user is a provider, update their provider photo as well
      if (providerId) {
        await updateDoc(doc(db, 'providers', providerId), {
          photoURL: newUrl,
          updatedAt: new Date().toISOString()
        });
      }

      setIsPhotoModalOpen(false);
    } catch (error) {
      console.error("Error updating profile photo:", error);
    } finally {
      setSavingPhoto(false);
    }
  };

  const isAdmin = user?.email === 'patrick.ferrareze@escola.pr.gov.br';

  // Build the list of menu items dynamically
  const MENU_ITEMS = [
    { 
      icon: <MapPin />, 
      title: "Minha Localização", 
      sub: profile?.location || "Defina sua cidade para ver os melhores perto de você", 
      onClick: () => setIsPickerOpen(true),
      color: "bg-green-50 text-green-500" 
    },
    { 
      icon: <Briefcase />, 
      title: isProvider ? "Editar Perfil Profissional" : "Seja um Prestador", 
      sub: isProvider ? "Atualize sua ficha" : "Cadastre seus serviços", 
      link: "/become-provider", 
      color: "bg-indigo-50 text-indigo-500" 
    },
    ...(isProvider ? [
      {
        icon: <CreditCard />,
        title: "Monetização & Planos",
        sub: providerPlan && providerPlan !== 'bronze' 
          ? `Plano ativo: ${providerPlan.toUpperCase()}` 
          : "Impulsione seus serviços de graça",
        link: "/premium-plans",
        color: "bg-amber-50 text-amber-500"
      }
    ] : []),
    { 
      icon: <TrendingUp />, 
      title: "Engajamento", 
      sub: "Estatísticas de cliques no contato", 
      onClick: () => setIsEngagementOpen(true), 
      color: "bg-emerald-50 text-emerald-500" 
    },
    { icon: <Star />, title: "Minhas Avaliações", sub: "Veja todas avaliações feitas", link: "/my-reviews", color: "bg-amber-50 text-amber-500" },
    { icon: <Heart />, title: "Prestadores Favoritos", sub: "Seus profissionais salvos", link: "/favorites", color: "bg-rose-50 text-rose-500" },
    ...(isAdmin ? [
      { 
        icon: <LayoutDashboard />, 
        title: "Painel de Administração", 
        sub: "Suporte, faturamento e prestadores", 
        link: "/admin", 
        color: "bg-slate-100 text-slate-800" 
      }
    ] : []),
    { icon: <HelpCircle />, title: "Ajuda e Suporte", sub: "Central de suporte técnico", link: "/support", color: "bg-teal-50 text-teal-500" },
  ];

  if (!profile) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Direct performance size warning for base64 storage limits
    if (file.size > 1048576) {
      setUploadError('Selecione uma imagem de até 1MB para melhor desempenho.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrlInput(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Falha ao processar arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    setUploadError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, envie apenas arquivos de imagem.');
      return;
    }

    if (file.size > 1048576) {
      setUploadError('Selecione uma imagem de até 1MB para melhor desempenho.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pb-32 bg-gray-50 min-h-screen text-left">
      <header className="bg-blue-600 pt-8 pb-16 px-6 rounded-b-[40px] shadow-lg text-white">
        <div className="flex justify-center items-center mb-8">
           <h1 className="text-xl font-black">Meu Perfil</h1>
        </div>

        <div className="flex flex-col items-center">
           <div 
             onClick={() => setIsPhotoModalOpen(true)}
             className="relative group cursor-pointer"
             title="Clique para alterar a foto"
           >
             <motion.img 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.name}`} 
               className="w-28 h-28 rounded-full border-4 border-white/30 shadow-2xl object-cover group-hover:brightness-90 transition-all duration-300"
             />
             <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <Camera className="text-white w-8 h-8" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center group-hover:scale-110 transition-transform">
               <Camera size={14} />
             </div>
           </div>
           <h2 className="mt-4 text-2xl font-black">{profile.name}</h2>
           <p className="text-white/70 text-sm">{profile.email}</p>
        </div>
      </header>

      <div className="px-6 -mt-8">
        <div className="bg-white rounded-3xl p-6 shadow-xl grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
             <div className={`text-2xl font-black text-blue-600 transition-all duration-300 ${statsLoading ? 'opacity-40 animate-pulse' : ''}`}>
               {statsLoading ? '...' : stats.reviewsCount}
             </div>
             <div className="text-xs font-bold text-gray-400">Avaliações</div>
          </div>
          <div className="text-center border-x border-gray-100">
             <div className={`text-2xl font-black text-blue-600 transition-all duration-300 ${statsLoading ? 'opacity-40 animate-pulse' : ''}`}>
               {statsLoading ? '...' : stats.favoritesCount}
              </div>
             <div className="text-xs font-bold text-gray-400">Favoritos</div>
          </div>
          <div className="text-center">
             <div className={`text-2xl font-black text-blue-600 transition-all duration-300 ${statsLoading ? 'opacity-40 animate-pulse' : ''}`}>
               {statsLoading ? '...' : (stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-')}
             </div>
             <div className="text-xs font-bold text-gray-400">Média</div>
          </div>
        </div>

        <div className="space-y-4">
          {MENU_ITEMS.map((item, i) => (
            <motion.div 
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if ('onClick' in item && item.onClick) {
                    item.onClick();
                } else if ('link' in item && item.link !== '#') {
                    navigate(item.link as string);
                }
              }}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-4">
                 <div className={`${item.color} p-4 rounded-2xl`}>
                    {item.icon}
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.sub}</p>
                 </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-8 bg-red-50 text-red-500 font-bold py-5 rounded-3xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          Sair da conta
        </button>
      </div>

      <LocationPicker 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialValue={profile.location}
        onSelect={setLocation}
      />

      <EngagementModal 
        isOpen={isEngagementOpen}
        onClose={() => setIsEngagementOpen(false)}
      />

      {/* Modal para Alterar Foto de Perfil */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-left"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-black text-gray-950">Alterar Foto de Perfil</h3>
                <p className="text-xs text-gray-400">Escolha uma foto real ou logotipo da sua empresa</p>
              </div>
              <button 
                onClick={() => {
                  setUploadError('');
                  setIsPhotoModalOpen(false);
                }}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              {/* Live Preview */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-bold text-gray-400 self-start">Visualização da foto</p>
                <img 
                  src={photoUrlInput || `https://ui-avatars.com/api/?name=${profile.name}`} 
                  alt="Preview" 
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-500/20 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.name}`;
                  }}
                />
              </div>

              {/* Error Alert if any */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {/* Native Premium File Selector with Drag and Drop area */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider block">Selecione seu Arquivo</label>
                
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragActive ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/10'}`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-3">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-xs font-black text-gray-800">Clique para selecionar foto</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[240px]">Ou arraste e solte o arquivo de imagem aqui (JPG, PNG de até 1MB)</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setUploadError('');
                  setIsPhotoModalOpen(false);
                }}
                className="flex-1 border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs font-black py-4 rounded-2xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSavePhoto(photoUrlInput)}
                disabled={savingPhoto || !photoUrlInput}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black py-4 rounded-2xl shadow transition-colors flex items-center justify-center gap-2"
              >
                {savingPhoto ? 'Salvando...' : 'Salvar Foto'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
