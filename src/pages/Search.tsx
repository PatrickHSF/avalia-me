import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search as SearchIcon, MapPin, Grid, List as ListIcon, Bell } from 'lucide-react';
import { motion } from 'motion/react';
import ProviderCard from '../components/ProviderCard';
import ReviewModal from '../components/ReviewModal';
import { useNotifications } from '../lib/NotificationContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
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

export default function Search() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get('category');
  const initialFeatured = searchParams.get('featured') === 'true';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [isFeaturedFilter, setIsFeaturedFilter] = useState(initialFeatured);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const { reminders, setIsPanelOpen } = useNotifications();

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    setIsFeaturedFilter(searchParams.get('featured') === 'true');
  }, [searchParams]);

  useEffect(() => {
    async function search() {
      setLoading(true);
      let q = query(collection(db, 'providers'));
      
      if (selectedCategory) {
        q = query(collection(db, 'providers'), where('category', '==', selectedCategory));
      }

      const snapshot = await getDocs(q);
      const results: any[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.whatsappVerified === true);
      
      let filteredResults = results;
      if (isFeaturedFilter) {
        filteredResults = results.filter((p: any) => p.featured === true);
      }
      
      if (searchTerm) {
        filteredResults = filteredResults.filter((p: any) => 
          (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
          (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      }

      const userCity = extractBasicCity(profile?.location);
      if (userCity) {
        filteredResults = filteredResults.filter((p: any) => extractBasicCity(p.location) === userCity);
      }
      
      // Sort results: featured (patrocinados) first, then by rating descending
      filteredResults.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
      
      setProviders(filteredResults);
      setLoading(false);
    }
    search();
  }, [searchTerm, selectedCategory, isFeaturedFilter, profile]);

  return (
    <div className="pb-24">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg sticky top-0 z-40">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-white">Buscar</h1>
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
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-xl">
          <SearchIcon className="text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar prestadores ou serviços..."
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 text-lg"
          />
        </div>
      </header>

      <main className="px-6 mt-8">
        {!searchTerm && !selectedCategory && !isFeaturedFilter && (
          <div className="mb-8">
            <h3 className="text-xl font-black text-gray-950 mb-4 flex items-center justify-between">
              <span>Categorias</span>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                {CATEGORIES.length} disponíveis
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 6)).map((cat, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setShowAllCategories(false);
                  }}
                  className="bg-white p-4 py-5 rounded-[24px] flex flex-col items-center shadow-sm border border-gray-100 hover:border-blue-200 transition-all select-none min-h-[110px] justify-center"
                >
                  <span className="text-3xl mb-2">{cat.icon}</span>
                  <span className="text-[11px] font-extrabold text-gray-700 leading-tight text-center break-words w-full">
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full mt-4 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 font-extrabold p-4 rounded-2xl text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm"
            >
              {showAllCategories ? (
                <>
                  <span>⬆️</span> Recolher categorias
                </>
              ) : (
                <>
                  <span>✨</span> Ver todas as {CATEGORIES.length} categorias
                </>
              )}
            </button>
          </div>
        )}

        {loading ? (
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-40 bg-gray-200 rounded-3xl animate-pulse"></div>
               ))}
             </div>
        ) : (
          <>
            {/* Case 1: Active query or selected category or featured filter */}
            {(searchTerm || selectedCategory || isFeaturedFilter) ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {isFeaturedFilter 
                      ? 'Destaques em Alta' 
                      : selectedCategory 
                        ? `Resultados para ${selectedCategory}` 
                        : 'Resultados da busca'}
                  </h3>
                  <button 
                    onClick={() => { 
                      setSelectedCategory(null); 
                      setSearchTerm(''); 
                      setSearchParams({});
                    }}
                    className="text-blue-600 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-xl transition-all"
                  >
                    Limpar
                  </button>
                </div>

                <div className="space-y-4">
                  {providers.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} onReview={() => setSelectedProvider(provider)} />
                  ))}
                  {providers.length === 0 && (
                    <div className="text-center py-20 px-4 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                      <SearchIcon className="text-gray-300 mx-auto mb-4" size={64} />
                      <h4 className="text-lg font-black text-gray-900 leading-tight">
                        {profile?.location ? "Não achamos nenhum prestador em sua cidade :(" : "Nenhum resultado encontrado"}
                      </h4>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                        {profile?.location 
                          ? "Tente verificar outra localização no seu perfil e volte para buscar!" 
                          : "Tente buscar por outro termo ou categoria."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Case 2: default landing layout showing "Em Alta" & "Melhores Avaliados" separately */
              <div className="space-y-10">
                {/* Em Alta Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-1.5">
                        <span>🔥</span> Em Alta
                      </h2>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">Parceiros em destaque patrocinado</p>
                    </div>
                  </div>

                  {providers.filter((p: any) => p.featured === true).length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[32px] p-8 text-center select-none">
                      <p className="text-gray-500 text-sm font-semibold mb-3">Anuncie aqui para seu perfil ficar em alta!</p>
                      <button 
                        onClick={() => navigate('/become-provider')}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-3 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Tornar-se parceiro patrocinado
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {providers.filter((p: any) => p.featured === true).map(provider => (
                        <ProviderCard key={provider.id} provider={provider} onReview={() => setSelectedProvider(provider)} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Melhores Avaliados Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-tight flex items-center gap-1.5">
                        <span>🏆</span> Melhores Avaliados
                      </h2>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">Profissionais mais bem votados</p>
                    </div>
                  </div>

                  {[...providers].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).length === 0 ? (
                    <div className="text-center py-10 bg-gray-50/55 border border-dashed border-gray-200 rounded-[32px]">
                      <p className="text-gray-550 text-sm italic font-medium">Nenhum prestador encontrado em sua região</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...providers].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 10).map(provider => (
                        <ProviderCard key={provider.id} provider={provider} onReview={() => setSelectedProvider(provider)} hideSponsoredBadge={true} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
