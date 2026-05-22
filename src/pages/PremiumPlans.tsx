import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { ArrowLeft, Sparkles, Shield, ChevronRight, Check, CreditCard, QrCode, AlertCircle, Award, BarChart3, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function PremiumPlans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Checkout states
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [pixStatus, setPixStatus] = useState<'idle' | 'generating' | 'code'>('idle');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [successUpgrade, setSuccessUpgrade] = useState(false);

  const PLANS = [
    {
      id: 'bronze',
      name: 'Bronze Standard',
      price: 'Grátis',
      sub: 'Para iniciantes na plataforma',
      color: 'border-gray-200 bg-white text-gray-800',
      badgeColor: 'bg-gray-100 text-gray-500',
      benefits: [
        'Listagem padrão nos resultados',
        'Contatos diretos por WhatsApp',
        'Avaliações públicas de clientes',
      ]
    },
    {
      id: 'prata',
      name: 'Prata Plus',
      price: 'R$ 9,90',
      period: '/mês',
      sub: 'Melhor custo benefício',
      color: 'border-blue-200 bg-blue-50/20 text-gray-800 ring-2 ring-blue-500/20',
      badgeColor: 'bg-blue-100 text-blue-600',
      benefits: [
        'Destaque intermediário de busca',
        'Selo Prata no perfil',
        'Acesso básico ao painel de engajamento',
        'Suporte prioritário via WhatsApp',
      ]
    },
    {
      id: 'ouro',
      name: 'Ouro Max Deluxe',
      price: 'R$ 14,90',
      period: '/mês',
      sub: 'Para líderes do mercado local',
      color: 'border-amber-200 bg-amber-50/30 text-gray-800 ring-4 ring-amber-500/30',
      badgeColor: 'bg-amber-100 text-amber-700',
      tag: '🔥 Recomendado',
      benefits: [
        'Topo absoluto dos resultados de busca',
        'Selo Ouro de recomendação especial',
        'Selo de VERIFICADO automático (Destaque)',
        'Notificações em tempo real no dashboard',
        'Painel avançado de visualização de cliques',
      ]
    }
  ];

  useEffect(() => {
    if (!user) return;

    // Check if the user is a provider
    async function loadProviderInfo() {
      try {
        const q = query(collection(db, 'providers'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setProvider({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error loading provider:", error);
      } finally {
        setFetching(false);
      }
    }

    // Load transactional history for receipts list
    const transQ = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeTrans = onSnapshot(transQ, (snapshot) => {
      const records: any[] = [];
      snapshot.forEach(docSnap => {
        records.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTransactions(records);
    });

    loadProviderInfo();
    return () => unsubscribeTrans();
  }, [user]);

  const handleSelectPlan = (plan: any) => {
    if (plan.id === 'bronze') {
      // Free option resets highlighted fields
      handleUpgradeToBronze();
      return;
    }
    setSelectedPlan(plan);
    setPaymentMethod(null);
    setPixStatus('idle');
  };

  const handleUpgradeToBronze = async () => {
    if (!provider) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'providers', provider.id), {
        featured: false,
        plan: 'bronze',
        updatedAt: new Date().toISOString()
      });
      setProvider(prev => ({ ...prev, featured: false, plan: 'bronze' }));
      alert("Seu perfil foi rebaixado para o plano Bronze Grátis com sucesso.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeSimulatedPayment = async () => {
    if (!provider || !selectedPlan || !user) return;
    setLoading(true);

    try {
      const amountValue = selectedPlan.id === 'ouro' ? 14.90 : 9.90;

      // 1. Create billing record
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        userName: user.displayName || 'Prestador',
        userEmail: user.email || '',
        providerId: provider.id,
        providerName: provider.name,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: amountValue,
        paymentMethod: paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito',
        status: 'Aprovado',
        createdAt: new Date().toISOString()
      });

      // 2. Upgrade Provider document
      await updateDoc(doc(db, 'providers', provider.id), {
        featured: true, // Will make "Patrocinado" or Ouro highlight visible
        plan: selectedPlan.id,
        hasPremiumBadge: true,
        updatedAt: new Date().toISOString()
      });

      // Update local state copy
      setProvider(prev => ({
        ...prev,
        featured: true,
        plan: selectedPlan.id,
        hasPremiumBadge: true
      }));

      setSuccessUpgrade(true);
      setTimeout(() => {
        setSuccessUpgrade(false);
        setSelectedPlan(null);
        setPaymentMethod(null);
      }, 3500);

    } catch (error) {
      console.error("Payment registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerPixGeneration = () => {
    setPixStatus('generating');
    setTimeout(() => {
      setPixStatus('code');
    }, 1500);
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not yet a service provider, navigate them toBecomeProvider page
  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12 text-left">
        <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg text-white flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black">Monetização</h1>
            <p className="text-white/80 text-sm">Seja contratado e impulsione ganhos</p>
          </div>
        </header>
        <main className="px-6 -mt-6">
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-gray-100 flex flex-col items-center">
            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center text-indigo-500 mb-6 font-rounded">
              <Award size={40} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Seja um Prestador Primeiro</h2>
            <p className="text-xs text-gray-400 max-w-xs mb-8">
              Para escolher planos premium de destaque, você precisa cadastrar o seu perfil profissional de serviços primeiro.
            </p>
            <button
              onClick={() => navigate('/become-provider')}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-sm shadow hover:bg-blue-700 transition-colors"
            >
              Cadastrar Meu Perfil Profissional
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen text-left relative">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Planos e Impulsões</h1>
          <p className="text-white/80 text-sm">Aumente seus contatos fechados</p>
        </div>
      </header>

      {/* Active plan status ticker */}
      <main className="px-6 -mt-6 space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Seu Plano Ativo</span>
            <h3 className="font-black text-xl text-gray-800 uppercase flex items-center gap-1.5 mt-0.5">
              {provider.plan === 'ouro' && <Award size={20} className="text-amber-500" />}
              {provider.plan === 'prata' && <Award size={20} className="text-blue-500" />}
              {provider.plan || 'Bronze (Grátis)'}
            </h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            provider.plan && provider.plan !== 'bronze' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {provider.plan && provider.plan !== 'bronze' ? 'Premium Ativo' : 'Grátis'}
          </span>
        </div>

        {/* List major features */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 px-1">Escolha Sua Escala</h2>
          <div className="space-y-4">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`p-6 rounded-[32px] border transition-all relative ${plan.color} ${
                  provider.plan === plan.id ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {plan.tag && (
                  <span className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-md">
                    {plan.tag}
                  </span>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${plan.badgeColor}`}>
                      {plan.id}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-xs text-gray-400 font-bold">{plan.period}</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4">{plan.sub}</p>

                <ul className="text-xs font-semibold text-gray-600 space-y-2 mb-6 divide-y divide-gray-50">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 pt-2">
                      <div className="w-4 h-4 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {provider.plan === plan.id ? (
                  <div className="w-full bg-green-500 text-white font-black py-4 rounded-xl text-xs text-center border-none shadow flex items-center justify-center gap-2">
                    <Check size={16} strokeWidth={3} />
                    Seu Plano Atual
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs text-center shadow transition-all"
                  >
                    {plan.id === 'bronze' ? 'Ativar Plano Grátis' : `Assinar ${plan.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checkout Modal Simulation */}
        <AnimatePresence>
          {selectedPlan && (
            <div className="fixed inset-0 z-[120] flex items-end justify-center p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !loading && setSelectedPlan(null)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
                className="relative bg-white w-full max-w-md rounded-t-[40px] px-6 pt-8 pb-10 shadow-2xl text-left border-t border-gray-100 z-50 overflow-y-auto max-h-[85vh]"
              >
                {/* Visual success upgrade layer */}
                {successUpgrade && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white rounded-t-[40px] flex flex-col items-center justify-center p-6 text-center z-50 animate-fade-in"
                  >
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 0 }}
                      className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4"
                    >
                      <Sparkles size={40} />
                    </motion.div>
                    <h3 className="text-2xl font-black text-gray-900">Parabéns!</h3>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Assinatura confirmada com sucesso! Seu perfil agora está no plano <strong className="text-amber-500 uppercase">{selectedPlan.id}</strong> com destaque instantâneo.
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Pagamento Simplificado</span>
                    <h3 className="font-black text-xl text-gray-900 mt-0.5">Finalizar Assinatura</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="text-gray-400 font-bold hover:text-gray-600"
                  >
                    Voltar
                  </button>
                </div>

                {/* Plan detail snippet */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{selectedPlan.name}</h4>
                    <p className="text-[10.5px] text-gray-400">Impulsionamento de visibilidade na plataforma</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-blue-600">{selectedPlan.price}</span>
                    <span className="text-[10px] text-gray-400">/mês</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-xs font-bold text-gray-400">Forma de Pagamento</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setPaymentMethod('pix'); triggerPixGeneration(); }}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-blue-500 bg-blue-50/30 text-blue-600'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <QrCode size={20} />
                      PIX Instantâneo
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 font-bold text-xs transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50/30 text-blue-600'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <CreditCard size={20} />
                      Cartão de Crédito
                    </button>
                  </div>

                  {/* PIX Option panel */}
                  {paymentMethod === 'pix' && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center space-y-3 animate-fade-in">
                      {pixStatus === 'generating' ? (
                        <div className="py-6 flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[11px] text-gray-400 font-bold">Criando código Copia e Cola...</span>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white p-3 rounded-xl shadow-xs border border-gray-100">
                            <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed rounded font-mono text-[10px]">
                              [ QR CODE COPIA ]
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 max-w-xs">
                              Escaneie o código acima ou copie a linha de pagamento Pix para finalizar no app do seu banco.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("00020101021126580014br.gov.bcb.pix0136avalia-me-pix-fake-key-554499952040000530398654041.505802BR5909AvaliaMe6009Parana62070503***6304");
                              alert("Código Copia e Cola PIX copiado com sucesso!");
                            }}
                            className="text-[10px] font-black text-blue-600 hover:underline animate-pulse"
                          >
                            Copiar Código PIX Copia e Cola
                          </button>
                          
                          <button
                            onClick={executeSimulatedPayment}
                            disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl text-xs shadow-md mt-2 transition-all"
                          >
                            {loading ? "Liberando..." : "Simular Pagamento Confirmado"}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Credit Card Option panel */}
                  {paymentMethod === 'card' && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Número do Cartão</label>
                        <input
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4444 4444 4444 4444"
                          className="w-full bg-white rounded-xl p-3 border border-gray-100 outline-none text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-400">Nome Impresso</label>
                        <input
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="EX: JOAO S SOUZA"
                          className="w-full bg-white rounded-xl p-3 border border-gray-100 outline-none text-xs font-semibold uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-gray-400 font-medium font-bold">Expiração</label>
                          <input
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/AA"
                            className="w-full bg-white rounded-xl p-3 border border-gray-100 outline-none text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-gray-400 font-medium font-bold">CVV</label>
                          <input
                            required
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full bg-white rounded-xl p-3 border border-gray-100 outline-none text-[11px] font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        onClick={executeSimulatedPayment}
                        disabled={loading || !cardNumber || !cardName}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl text-xs shadow-md mt-2 transition-all disabled:opacity-40"
                      >
                        {loading ? "Processando..." : `Confirmar Pagamento (${selectedPlan.price})`}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 justify-center text-[10px] text-gray-400 font-medium pt-2">
                    <Shield size={12} className="text-green-500" />
                    Pagamentos processados de forma criptografada e segura.
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Expense transactions history list */}
        {transactions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 px-1 flex items-center gap-2">
              <Receipt size={18} className="text-blue-500" />
              Histórico de Assinaturas
            </h2>

            <div className="space-y-2">
              {transactions.map((trans) => (
                <div key={trans.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs">{trans.planName}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(trans.createdAt).toLocaleDateString('pt-BR')} - {trans.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-green-600">R$ {parseFloat(trans.amount).toFixed(2)}</span>
                    <span className="block text-[8px] text-green-500 font-bold uppercase tracking-wider">{trans.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
