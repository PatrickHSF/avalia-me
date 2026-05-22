import { useState, useEffect } from 'react';
import { X, TrendingUp, Sparkles, Phone, CheckCircle2, Award, Flame, Zap, ArrowRight, RefreshCw, Lock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EngagementModal({ isOpen, onClose }: EngagementModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<any[]>([]);
  const [clicksLoading, setClicksLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'semanal' | 'mensal' | 'anual'>('semanal');
  const [showHowToIncrease, setShowHowToIncrease] = useState(false);
  const [activating, setActivating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => {
    if (!isOpen || !user) {
      setProvider(null);
      setShowHowToIncrease(false);
      setSuccessMsg('');
      return;
    }
    
    async function loadProvider() {
      setLoading(true);
      try {
        const q = query(collection(db, 'providers'), where('userId', '==', user?.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProvider({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setProvider(null);
        }
      } catch (error) {
        console.error("Error loading provider for engagement:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProvider();
  }, [isOpen, user]);

  useEffect(() => {
    if (!provider?.id) return;
    
    async function loadClicks() {
      setClicksLoading(true);
      try {
        const q = query(
          collection(db, 'provider_clicks'),
          where('providerId', '==', provider.id)
        );
        const snapshot = await getDocs(q);
        const clicksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClicks(clicksData);
      } catch (error) {
        console.error("Error loading clicks:", error);
      } finally {
        setClicksLoading(false);
      }
    }
    
    loadClicks();
  }, [provider]);

  // Generate beautiful, professional demo clicks so the dashboard is instantly filled
  const getDemoClicks = () => {
    const list = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // 8 clicks in the last 7 days
    for (let i = 0; i < 8; i++) {
      const clickTime = now - (Math.random() * 6 * oneDay);
      list.push({
        id: `demo-w-${i}`,
        timestamp: clickTime,
        createdAt: new Date(clickTime).toISOString()
      });
    }
    // 16 clicks in the other 23 days of the month
    for (let i = 0; i < 16; i++) {
      const clickTime = now - (7 * oneDay + Math.random() * 22 * oneDay);
      list.push({
        id: `demo-m-${i}`,
        timestamp: clickTime,
        createdAt: new Date(clickTime).toISOString()
      });
    }
    // 118 clicks in the other 335 days of the year
    for (let i = 0; i < 118; i++) {
      const clickTime = now - (30 * oneDay + Math.random() * 334 * oneDay);
      list.push({
        id: `demo-y-${i}`,
        timestamp: clickTime,
        createdAt: new Date(clickTime).toISOString()
      });
    }
    return list;
  };

  const getFilteredClicksCount = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Merge real clicks with demo clicks if real clicks are 0
    const activeClicksList = clicks.length > 0 ? clicks : getDemoClicks();
    
    // Force weekly if they are on Prata plan
    const activeFilter = (provider?.plan === 'prata') ? 'semanal' : timeFilter;
    
    return activeClicksList.filter((click: any) => {
      const clickTime = click.timestamp || new Date(click.createdAt).getTime();
      if (activeFilter === 'semanal') {
        return now - clickTime <= 7 * oneDay;
      } else if (activeFilter === 'mensal') {
        return now - clickTime <= 30 * oneDay;
      } else {
        return now - clickTime <= 365 * oneDay;
      }
    }).length;
  };

  const currentPlan = provider?.plan || 'bronze';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 text-left">
          {/* Overlay click closes modal */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-6 pb-20 sm:p-8 sm:pb-12 shadow-2xl overflow-y-auto overscroll-y-contain max-h-[85vh] z-10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw size={40} className="text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Verificando dados de correspondência...</p>
              </div>
            ) : !provider ? (
              /* No provider profile found */
              <div className="text-center py-8">
                <TrendingUp size={64} className="text-blue-500 bg-blue-50 p-4 rounded-3xl mx-auto mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-4">Métricas de Engajamento</h2>
                <p className="text-gray-600 font-semibold mb-8 leading-relaxed">
                  Ops! Você ainda não possui um perfil de prestador de serviços.
                  Essa área exibe o número de clientes que clicaram em seu botão de contato para solicitar orçamentos!
                </p>
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/become-provider');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95"
                >
                  Tornar-se um Prestador
                </button>
              </div>
            ) : currentPlan === 'bronze' ? (
              /* Bronze Plan / No Active premium tier: Locked State */
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 text-amber-500 p-3 rounded-2xl">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Engajamento</h2>
                    <p className="text-xs font-bold text-gray-400">Recurso Premium</p>
                  </div>
                </div>

                <p className="text-gray-500 text-sm font-semibold leading-relaxed">
                  O painel de cliques de contatos, interesse e impulsionamentos é exclusivo para profissionais nos planos **Prata Plus** e **Ouro Max**.
                </p>

                {/* Locked Preview Element with blur */}
                <div className="relative border border-gray-100 p-6 rounded-[32px] bg-gray-50/50 overflow-hidden select-none">
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-blue-600 text-white p-3.5 rounded-full shadow-lg mb-2">
                      <Zap size={24} className="animate-pulse" />
                    </div>
                    <span className="text-sm font-black text-gray-900">Métricas de Cliques Bloqueadas</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Plano Atual: Bronze Standard (Grátis)</span>
                  </div>
                  <div className="opacity-30 space-y-4">
                    <div className="flex justify-between bg-white p-1.5 rounded-xl border">
                      <div className="bg-gray-100 flex-1 h-8 rounded-lg" />
                      <div className="flex-1 h-8" />
                      <div className="flex-1 h-8" />
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl text-center">
                      <p className="text-xs font-bold text-emerald-600">Cliques no Contato</p>
                      <div className="text-4xl font-extrabold mt-1">48</div>
                      <p className="text-[10px] text-emerald-800/80">Clientes interessados nos últimos 7 dias</p>
                    </div>
                  </div>
                </div>

                {/* Benefits lock comparison */}
                <div className="space-y-3.5 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Por que obter acesso ao engajamento?</h4>
                  <div className="space-y-3">
                    <div className="flex gap-2.5 text-xs font-semibold text-gray-650 items-center">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                      <span>Veja em tempo real quantos clientes clicaram no WhatsApp.</span>
                    </div>
                    <div className="flex gap-2.5 text-xs font-semibold text-gray-650 items-center">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                      <span>Saber a popularidade e os picos de busca.</span>
                    </div>
                    <div className="flex gap-2.5 text-xs font-semibold text-gray-650 items-center">
                      <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                      <span>Receber o selo de recomendação intermedia ou topo.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/premium');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] duration-200"
                  >
                    <span>Fazer Upgrade do Plano</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full border border-gray-200 text-gray-500 font-bold py-4 rounded-2xl text-xs text-center hover:bg-gray-50 transition-colors"
                  >
                    Continuar no Bronze Grátis
                  </button>
                </div>
              </div>
            ) : (
              /* Provider Profile Found on active premium tier (Prata / Ouro) */
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-50 text-emerald-500 p-3 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Engajamento</h2>
                    <p className="text-xs font-bold text-gray-400 capitalize">Plano {currentPlan} de {provider.name}</p>
                  </div>
                </div>

                {/* Subtitle/Overview */}
                <p className="text-gray-500 text-sm font-semibold mb-6 leading-relaxed">
                  Monitore o interesse dos clientes em seu serviço através do total de cliques para seu WhatsApp de contato.
                </p>

                {/* Filter Tabs - Grayed out for Prata Basic access */}
                {currentPlan === 'prata' ? (
                  <div className="space-y-2 mb-6">
                    <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100 select-none opacity-85">
                      <button className="flex-1 py-2 text-xs font-black bg-white text-gray-900 shadow-sm rounded-xl transition-all capitalize">
                        Semanal
                      </button>
                      <button 
                        disabled
                        onClick={() => alert("Assine o Ouro Max para períodos maiores!")}
                        className="flex-1 py-2 text-xs font-black text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        Mensal <Lock size={12} className="text-gray-300" />
                      </button>
                      <button 
                        disabled
                        className="flex-1 py-2 text-xs font-black text-gray-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        Anual <Lock size={12} className="text-gray-300" />
                      </button>
                    </div>
                    <div className="bg-amber-50 text-amber-800 text-[10.5px] font-bold p-2.5 rounded-xl border border-amber-100 flex items-center gap-1.5 leading-normal">
                      <Shield size={14} className="text-amber-500 shrink-0" />
                      <span>Filtros Mensal e Anual exclusivos da assinatura <strong>Ouro Max Deluxe</strong>.</span>
                    </div>
                  </div>
                ) : (
                  /* Full access for Ouro Deluxe */
                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 mb-6">
                    {(['semanal', 'mensal', 'anual'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all capitalize ${
                          timeFilter === filter 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}

                {/* Click Metrics Counter */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/70 p-6 rounded-[32px] text-center mb-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp size={96} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-2">Cliques no Contato</p>
                  <motion.div 
                    key={timeFilter}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-black text-gray-950 mb-2"
                  >
                    {getFilteredClicksCount()}
                  </motion.div>
                  <p className="text-xs font-semibold text-emerald-800/80">
                    {currentPlan === 'prata' || timeFilter === 'semanal' 
                      ? "Clientes interessados nos últimos 7 dias" 
                      : timeFilter === 'mensal' 
                        ? "Clientes interessados nos últimos 30 dias" 
                        : "Clientes interessados nos últimos 12 meses"
                    }
                  </p>
                  {clicks.length === 0 && (
                    <div className="mt-3 inline-block bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold">
                      💡 Visualização demonstrativa de novo prestador
                    </div>
                  )}
                </div>

                {/* Banner message according to visual status & features of plan */}
                {currentPlan === 'prata' ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-[32px] p-6 space-y-4">
                    <div className="flex items-start gap-2.5">
                      <Zap className="text-blue-500 mt-1 shrink-0" size={18} fill="currentColor" />
                      <div>
                        <h4 className="text-xs font-black text-blue-950">Destaque Intermediário Ativo</h4>
                        <p className="text-[11px] text-blue-800/85 mt-1 leading-relaxed">
                          Seu perfil já está posicionado muito acima da listagem geral gratuita! Para garantir o <strong>topo do pódio absoluto</strong> e atendimento prioritário com o selo Ouro, faça um upgrade simples.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/premium');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                    >
                      <span>Quero Destaque Ouro Max (R$ 14,90/mês)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  /* Ouro Deluxe Status */
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-[32px] p-6">
                    <div className="flex gap-2.5 items-start">
                      <Award className="text-amber-500 mt-0.5 shrink-0 animate-bounce" size={24} fill="currentColor" />
                      <div>
                        <h3 className="text-sm font-black text-gray-950">Assinatura Ouro Max Deluxe ativa!</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Seu perfil está configurado com <strong>Destaque Absoluto</strong> no topo da página e busca prioritária automática para os clientes na plataforma!
                        </p>
                        <div className="mt-3.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                          <CheckCircle2 size={12} className="text-amber-600" /> Topo Absoluto Ativo
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
