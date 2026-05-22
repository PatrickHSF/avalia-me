import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell, Search, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import ProviderCard from '../components/ProviderCard';
import ReviewModal from '../components/ReviewModal';
import { useAuth } from '../lib/AuthContext';
import { useNotifications } from '../lib/NotificationContext';
import { seedProviders } from '../services/seed';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { CATEGORIES } from '../lib/categories';

const extractBasicCity = (locationStr: string | undefined): string => {
  if (!locationStr) return "";
  const BRAZILIAN_STATES = [
    'acre', 'ac', 'alagoas', 'al', 'amapá', 'ap', 'amazonas', 'am', 'bahia', 'ba', 'ceará', 'ce',
    'distrito federal', 'df', 'espírito santo', 'es', 'goiás', 'go', 'maranhão', 'ma', 'mato grosso', 'mt',
    'mato grosso do sul', 'ms', 'minas gerais', 'mg', 'pará', 'pa', 'paraíba', 'pb', 'paraná', 'pr',
    'pernambuco', 'pe', 'piauí', 'pi', 'rio de janeiro', 'rj', 'rio grande do norte', 'rn', 'rio grande do sul', 'rs',
    'rondônia', 'ro', 'roraima', 'rr', 'santa catarina', 'sc', 'são paulo', 'sp', 'sergipe', 'se', 'tocantins', 'to'
  ];

  const parts = locationStr.split(',').map(p => p.trim());
  
  // Find state index
  let stateIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    const lower = parts[i].toLowerCase();
    if (BRAZILIAN_STATES.includes(lower)) {
      stateIdx = i;
      break;
    }
  }
  
  if (stateIdx !== -1) {
    const precedingParts = parts.slice(0, stateIdx);
    const candidateCities = precedingParts.filter(part => {
      const lower = part.toLowerCase();
      if (
        lower.startsWith('rua ') || lower.startsWith('r.') ||
        lower.startsWith('av.') || lower.startsWith('avenida') || 
        lower.startsWith('travessa') || lower.startsWith('tv.') || 
        lower.startsWith('alameda') || lower.startsWith('al.') || 
        lower.startsWith('praça') || lower.startsWith('parque') || 
        lower.startsWith('rodovia') || lower.startsWith('rod.') ||
        lower.startsWith('beco') || lower.startsWith('condomínio') ||
        lower.startsWith('jardim') || lower.startsWith('jd.') ||
        lower.startsWith('bairro') || lower.startsWith('loteamento')
      ) return false;
      if (lower.includes('região') || lower.includes('microrregião') || lower.includes('mesorregião') || lower.includes('metropolitana')) return false;
      if (/^\d+/.test(lower) || /-\d+$/.test(lower)) return false;
      return true;
    });
    if (candidateCities.length > 0) {
      return candidateCities[candidateCities.length - 1].trim().toLowerCase();
    }
  }
  
  if (parts.length >= 2) {
    const firstLower = parts[0].toLowerCase();
    const isStreet = firstLower.startsWith('rua') || firstLower.startsWith('r.') || firstLower.startsWith('av') || firstLower.startsWith('travessa') || firstLower.startsWith('tv.') || firstLower.startsWith('alameda');
    const startIdx = isStreet ? 1 : 0;
    return parts[startIdx]?.trim().toLowerCase() || "";
  }
  
  return parts[0]?.trim().toLowerCase() || "";
};

export default function Home() {
  const [featuredProviders, setFeaturedProviders] = useState<any[]>([]);
  const [topRatedProviders, setTopRatedProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const { profile } = useAuth();
  const { reminders, setIsPanelOpen } = useNotifications();
  const navigate = useNavigate();

  // Onboarding animated splash screen states
  const [showSplash, setShowSplash] = useState(() => {
    const wasShown = (window as any).__splash_shown;
    return !wasShown;
  });
  const [badgeGlow, setBadgeGlow] = useState(false);
  const [showSplashText, setShowSplashText] = useState(false);
  const [splashFadeOut, setSplashFadeOut] = useState(false);

  useEffect(() => {
    if (!showSplash) return;

    // Trigger seal shine/glow at 850ms
    const glowTimer = setTimeout(() => {
      setBadgeGlow(true);
    }, 850);

    // Slide seal left and show text typing container at 1800ms
    const textTimer = setTimeout(() => {
      setShowSplashText(true);
    }, 1800);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(textTimer);
    };
  }, [showSplash]);

  useEffect(() => {
    if (showSplashText) {
      // Elegant, super fluid timing: 680ms for characters stagger reveal + 1200ms viewing pause
      const fadeTimer = setTimeout(() => {
        setSplashFadeOut(true);
        
        const exitTimer = setTimeout(() => {
          (window as any).__splash_shown = true;
          setShowSplash(false);
        }, 600);
      }, 1880);

      return () => {
        clearTimeout(fadeTimer);
      };
    }
  }, [showSplashText]);

  // Native-feeling drag to scroll logic for mouse/trackpad users on desktop
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [dragged, setDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setDragged(false);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setDragged(true);
    }
    el.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCategoryClick = (catName: string) => {
    if (dragged) return;
    navigate(`/search?category=${encodeURIComponent(catName)}`);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await seedProviders();
      
      try {
        const q = query(collection(db, 'providers'), orderBy('rating', 'desc'), limit(40));
        const snapshot = await getDocs(q);
        const allProviders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const userCity = extractBasicCity(profile?.location);

        const featured = allProviders.filter((p: any) => p.featured === true);
        const topRated = allProviders;

        if (userCity) {
          const localFeatured = featured.filter((p: any) => extractBasicCity(p.location) === userCity);
          setFeaturedProviders(localFeatured);

          const localTopRated = topRated.filter((p: any) => extractBasicCity(p.location) === userCity);
          setTopRatedProviders(localTopRated.slice(0, 10));
        } else {
          setFeaturedProviders(featured);
          setTopRatedProviders(topRated.slice(0, 10));
        }
      } catch (error) {
        console.error("Error loading providers:", error);
        const qBasic = query(collection(db, 'providers'), limit(20));
        const snapshot = await getDocs(qBasic);
        const allProviders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const userCity = extractBasicCity(profile?.location);
        const featured = allProviders.filter((p: any) => p.featured === true);
        const topRated = allProviders;
        
        if (userCity) {
          setFeaturedProviders(featured.filter((p: any) => extractBasicCity(p.location) === userCity));
          setTopRatedProviders(topRated.filter((p: any) => extractBasicCity(p.location) === userCity).slice(0, 10));
        } else {
          setFeaturedProviders(featured);
          setTopRatedProviders(topRated.slice(0, 10));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  const getFormattedCity = () => {
    if (!profile?.location) return "sua região";
    
    const BRAZILIAN_STATES: { [key: string]: string } = {
      'acre': 'Acre', 'ac': 'Acre',
      'alagoas': 'Alagoas', 'al': 'Alagoas',
      'amapá': 'Amapá', 'ap': 'Amapá',
      'amazonas': 'Amazonas', 'am': 'Amazonas',
      'bahia': 'Bahia', 'ba': 'Bahia',
      'ceará': 'Ceará', 'ce': 'Ceará',
      'distrito federal': 'Distrito Federal', 'df': 'Distrito Federal',
      'espírito santo': 'Espírito Santo', 'es': 'Espírito Santo',
      'goiás': 'Goiás', 'go': 'Goiás',
      'maranhão': 'Maranhão', 'ma': 'Maranhão',
      'mato grosso': 'Mato Grosso', 'mt': 'Mato Grosso',
      'mato grosso do sul': 'Mato Grosso do Sul', 'ms': 'Mato Grosso do Sul',
      'minas gerais': 'Minas Gerais', 'mg': 'Minas Gerais',
      'pará': 'Pará', 'pa': 'Pará',
      'paraíba': 'Paraíba', 'pb': 'Paraíba',
      'paraná': 'Paraná', 'pr': 'Paraná',
      'pernambuco': 'Pernambuco', 'pe': 'Pernambuco',
      'piauí': 'Piauí', 'pi': 'Piauí',
      'rio de janeiro': 'Rio de Janeiro', 'rj': 'Rio de Janeiro',
      'rio grande do norte': 'Rio Grande do Norte', 'rn': 'Rio Grande do Norte',
      'rio grande do sul': 'Rio Grande do Sul', 'rs': 'Rio Grande do Sul',
      'rondônia': 'Rondônia', 'ro': 'Rondônia',
      'roraima': 'Roraima', 'rr': 'Roraima',
      'santa catarina': 'Santa Catarina', 'sc': 'Santa Catarina',
      'são paulo': 'São Paulo', 'sp': 'São Paulo',
      'sergipe': 'Sergipe', 'se': 'Sergipe',
      'tocantins': 'Tocantins', 'to': 'Tocantins'
    };

    const parts = profile.location.split(',').map(p => p.trim());
    
    // 1. Find state
    let foundState = "";
    let stateIdx = -1;
    for (let i = 0; i < parts.length; i++) {
      const lower = parts[i].toLowerCase();
      if (BRAZILIAN_STATES[lower]) {
        foundState = BRAZILIAN_STATES[lower];
        stateIdx = i;
        break;
      }
    }
    
    if (stateIdx !== -1) {
      // 2. The city is one of the parts preceding the state
      const precedingParts = parts.slice(0, stateIdx);
      
      const candidateCities = precedingParts.filter(part => {
        const lower = part.toLowerCase();
        
        // Exclude street prefixes
        if (
          lower.startsWith('rua ') || 
          lower.startsWith('r.') ||
          lower.startsWith('av.') || 
          lower.startsWith('avenida') || 
          lower.startsWith('travessa') || 
          lower.startsWith('tv.') || 
          lower.startsWith('alameda') || 
          lower.startsWith('al.') || 
          lower.startsWith('praça') || 
          lower.startsWith('parque') || 
          lower.startsWith('rodovia') || 
          lower.startsWith('rod.') ||
          lower.startsWith('beco') ||
          lower.startsWith('condomínio') ||
          lower.startsWith('jardim') ||
          lower.startsWith('jd.') ||
          lower.startsWith('bairro') ||
          lower.startsWith('loteamento')
        ) return false;
        
        // Exclude statistical regions
        if (
          lower.includes('região') || 
          lower.includes('microrregião') || 
          lower.includes('mesorregião') || 
          lower.includes('metropolitana')
        ) return false;
        
        // Exclude numeric / postal codes
        if (/^\d+/.test(lower) || /-\d+$/.test(lower)) return false;
        
        return true;
      });
      
      if (candidateCities.length > 0) {
        const city = candidateCities[candidateCities.length - 1];
        return `${city}, ${foundState}`;
      }
    }
    
    // Fallback if state is not found
    if (parts.length >= 2) {
      const firstLower = parts[0].toLowerCase();
      const isStreet = firstLower.startsWith('rua') || firstLower.startsWith('r.') || firstLower.startsWith('av') || firstLower.startsWith('travessa') || firstLower.startsWith('tv.') || firstLower.startsWith('alameda');
      const startIdx = isStreet ? 1 : 0;
      
      const city = parts[startIdx];
      const state = parts[startIdx + 1] || '';
      if (state) {
        const stateKey = state.toLowerCase();
        const displayState = BRAZILIAN_STATES[stateKey] || state;
        return `${city}, ${displayState}`;
      }
      return city;
    }
    
    return profile.location;
  };

  const userCityName = getFormattedCity();

  return (
    <div className="pb-24">
      {showSplash && (
        <motion.div
          animate={{ opacity: splashFadeOut ? 0 : 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-blue-600 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle radial background pulse to elevate the visual elegance */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Golden/White animated shine waves behind the seal */}
          {badgeGlow && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0.7 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute w-32 h-32 bg-white/25 rounded-full filter blur-md"
            />
          )}

          {/* Logo container matching real horizontal layout */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="flex items-center gap-1.5 flex-nowrap z-10 select-none pb-12"
          >
            {/* The Verified Seal */}
            <motion.div
              layout
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ 
                scale: badgeGlow ? [1.15, 1.25, 1.2] : 1.2, 
                opacity: 1, 
                rotate: 0 
              }}
              transition={{ 
                type: "spring", 
                stiffness: 140, 
                damping: 10,
                scale: { duration: 0.3 }
              }}
              className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.25)] shrink-0"
            >
              <svg 
                viewBox="0 0 100 100" 
                className="w-7 h-7" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Custom scalloped outer verified seal path matching Logo.tsx exactly */}
                <path 
                  d="M50 8
                     C44.5 8 40.5 13 36 15
                     C31.5 17 26 16.5 22.5 20
                     C19 23.5 19.5 29 17.5 33.5
                     C15.5 38 10.5 42 10.5 47.5
                     C10.5 53 15.5 57 17.5 61.5
                     C19.5 66 19 71.5 22.5 75
                     C26 78.5 31.5 78 36 80
                     C40.5 82 44.5 87 50 87
                     C55.5 87 59.5 82 64 80
                     C68.5 78 74 78.5 77.5 75
                     C81 71.5 80.5 66 82.5 61.5
                     C84.5 57 89.5 53 89.5 47.5
                     C89.5 42 84.5 38 82.5 33.5
                     C80.5 29 81 23.5 77.5 20
                     C74 16.5 68.5 17 64 15
                     C59.5 13 55.5 8 50 8 Z"
                  className="fill-blue-600"
                />
                
                {/* Checkmark drawing in with a pulse and solid stroke */}
                <motion.path 
                  d="M30 48 L44 62 L70 32" 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  className="stroke-white" 
                  strokeWidth="11" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </motion.div>

            {/* Typed Text content alongside slide */}
            {showSplashText && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="font-rounded font-extrabold text-3xl text-white whitespace-nowrap tracking-tight ml-1.5 flex items-center select-none"
              >
                {"Avalia-me".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 3, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.22,
                      delay: index * 0.05, // Silky smooth staggered entrance
                      ease: [0.215, 0.610, 0.355, 1.000], // Smooth cubic bezier easeOut
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
                
                {/* High fidelity typing keyboard indicator blinker with motion opacity animation */}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                  className="inline-block w-1 h-6 bg-white ml-1.5 rounded-sm"
                />
              </motion.span>
            )}
          </motion.div>
          
          {/* Subtle elegant subtitle fading in at the bottom representing trustworthy reviews */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: showSplashText ? 0.85 : 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="absolute bottom-16 text-white/70 font-sans tracking-wide text-sm text-center"
          >
            Seu selo de confiança para contratação local.
          </motion.p>
        </motion.div>
      )}
      {/* Header */}
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="text-white hover:text-white transition-all transform active:scale-95 relative"
          >
            <Bell size={28} />
            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full border-2 border-blue-600 flex items-center justify-center text-[10px] font-black text-white px-1">
                {reminders.length}
              </span>
            )}
          </button>
        </div>
        
        <p className="text-white/80 text-sm mb-6">Encontre, contrate e avalie os melhores de {userCityName}</p>

        <div 
          onClick={() => navigate('/search')}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xl cursor-pointer"
        >
          <Search className="text-gray-400" size={20} />
          <span className="flex-1 text-gray-400 text-lg">Buscar prestadores ou serviços...</span>
        </div>
      </header>

      {/* Categories */}
      <section className="px-6 mt-6 select-none">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-black text-gray-900 leading-tight">Categorias</h3>
          <button 
            onClick={() => navigate('/search')}
            className="text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-all"
          >
            Ver todas
          </button>
        </div>
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
        >
          {CATEGORIES.slice(0, 10).map((cat, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: dragged ? 1 : 0.95 }}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-white px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm whitespace-nowrap font-bold text-gray-750 border border-gray-100 hover:shadow-md transition-all shrink-0"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm">{cat.name}</span>
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: dragged ? 1 : 0.95 }}
            onClick={() => !dragged && navigate('/search')}
            className="bg-blue-50 text-blue-600 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm whitespace-nowrap font-extrabold border border-blue-100 hover:shadow-md transition-all shrink-0"
          >
            <span className="text-sm">✨ Ver todas ({CATEGORIES.length})</span>
          </motion.button>
        </div>
      </section>

      {/* Content */}
      <main className="px-6 mt-6 space-y-10">
        {!loading && featuredProviders.length === 0 && topRatedProviders.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 border border-blue-100 rounded-[32px] p-8 text-center shadow-sm select-none py-14">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin size={40} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-gray-950 mb-2">Sem Prestadores Locais</h3>
            <p className="text-gray-600 text-sm font-semibold max-w-sm mx-auto mb-6 leading-relaxed">
              Não achamos nenhum prestador em sua cidade ({userCityName}) :(
            </p>
            <button 
              onClick={() => navigate('/become-provider')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-4 rounded-2xl shadow-md transition-all active:scale-95 text-sm"
            >
              Seja o primeiro prestador aqui!
            </button>
          </div>
        ) : (
          <>
            {/* Em Alta Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-1.5">
                    <span>🔥</span> Em Alta
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">Parceiros em destaque patrocinado</p>
                </div>
                <button 
                  onClick={() => navigate('/search?featured=true')} 
                  className="text-blue-600 font-black text-sm"
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-44 bg-gray-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : featuredProviders.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[32px] p-8 text-center select-none">
                  <p className="text-gray-500 text-sm font-semibold mb-3">Anuncie aqui para seu perfil ficar em alta!</p>
                  <button 
                    onClick={() => navigate('/become-provider')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-3 rounded-full shadow-md transition-all active:scale-95"
                  >
                    Tornar-se parceiro patrocinado
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredProviders.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} onReview={() => setSelectedProvider(provider)} />
                  ))}
                </div>
              )}
            </div>

            {/* Melhores Avaliados Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-1.5">
                    <span>🥇</span> Melhores Avaliados
                  </h2>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">Profissionais mais bem votados</p>
                </div>
                <button 
                  onClick={() => navigate('/search')} 
                  className="text-blue-600 font-bold text-sm"
                >
                  Ver todos
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-gray-200 rounded-3xl animate-pulse"></div>
                  ))}
                </div>
              ) : topRatedProviders.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Search size={40} />
                  </div>
                  <p className="text-gray-500 font-medium italic">Nenhum prestador encontrado no momento</p>
                  <button 
                    onClick={() => navigate('/search')}
                    className="mt-4 text-blue-600 font-bold"
                  >
                    Explorar categorias
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {topRatedProviders.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} onReview={() => setSelectedProvider(provider)} hideSponsoredBadge={true} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {selectedProvider && (
        <ReviewModal 
          provider={selectedProvider} 
          isOpen={!!selectedProvider} 
          onClose={() => setSelectedProvider(null)} 
        />
      )}
    </div>
  );
}
