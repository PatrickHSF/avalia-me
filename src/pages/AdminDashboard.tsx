import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import { ArrowLeft, Landmark, MessageSquare, ShieldAlert, BadgeCheck, CheckCircle2, TrendingUp, AlertTriangle, Play, HelpCircle, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'finance' | 'tickets' | 'providers'>('finance');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === 'patrick.ferrareze@escola.pr.gov.br';

  // States
  const [providers, setProviders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalClicksCount, setTotalClicksCount] = useState(0);

  // Stats
  const [totals, setTotals] = useState({
    subscriptionRevenue: 0,
    simulatedAdRevenue: 0,
    totalProviders: 0,
    pendingTickets: 0
  });

  // Response typing state
  const [respondingToTicketId, setRespondingToTicketId] = useState<string | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    // 1. Listen to Providers list
    const unsubscribeProviders = onSnapshot(collection(db, 'providers'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProviders(list);
    });

    // 2. Listen to Support tickets (all of them!)
    const unsubscribeTickets = onSnapshot(
      query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setTickets(list);
      }
    );

    // 3. Listen to Transactions
    const unsubscribeTrans = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTransactions(list);
    });

    // 4. Load click counts to calculate AdMob mock revenue
    async function getClicksData() {
      try {
        const clicksSnap = await getDocs(collection(db, 'provider_clicks'));
        setTotalClicksCount(clicksSnap.size);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    getClicksData();

    return () => {
      unsubscribeProviders();
      unsubscribeTickets();
      unsubscribeTrans();
    };
  }, []);

  // Compute calculated metrics
  useEffect(() => {
    const subRevenue = transactions.reduce((acc, current) => acc + (parseFloat(current.amount) || 0), 0);
    const mockAdRevenue = totalClicksCount * 0.15; // R$ 0.15 per whatsapp click
    const unresolvedCount = tickets.filter(t => t.status === 'Aberto' || t.status === 'Em Análise').length;

    setTotals({
      subscriptionRevenue: subRevenue,
      simulatedAdRevenue: mockAdRevenue,
      totalProviders: providers.length,
      pendingTickets: unresolvedCount
    });
  }, [providers, tickets, transactions, totalClicksCount]);

  // Toggle provider flags administrators can edit
  const toggleProviderVerified = async (id: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'providers', id), {
        isVerified: !currentVal,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleProviderFeatured = async (id: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'providers', id), {
        featured: !currentVal,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendTicketResponse = async (ticketId: string) => {
    if (!adminResponseText.trim()) return;
    setIsSubmittingResponse(true);
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        adminResponse: adminResponseText,
        status: 'Respondido',
        updatedAt: new Date().toISOString()
      });
      setRespondingToTicketId(null);
      setAdminResponseText('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: 'Resolvido',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-xl font-black text-gray-950 mb-2">Acesso Restrito</h2>
        <p className="text-xs text-gray-400 max-w-xs mb-6">
          Desculpe, você não tem privilégios administrativos para visualizar as estatísticas e gerenciar o suporte executivo deste app.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="bg-blue-600 text-white text-xs font-black px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow"
        >
          Voltar ao Meu Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-100 min-h-screen text-left">
      <header className="bg-slate-900 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg text-white flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="bg-white/10 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Server size={22} className="text-blue-400" />
            Painel Executivo
          </h1>
          <p className="text-slate-400 text-xs">Administração & Suporte Geral</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 -mt-6">
        <div className="bg-white rounded-3xl p-1.5 shadow-md flex gap-1 border border-gray-100">
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all ${
              activeTab === 'finance' ? 'bg-slate-900 text-white shadow' : 'text-gray-400 hover:text-gray-800'
            }`}
          >
            Acompanhamento Financeiro
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all relative ${
              activeTab === 'tickets' ? 'bg-slate-900 text-white shadow' : 'text-gray-400 hover:text-gray-800'
            }`}
          >
            Tickets
            {totals.pendingTickets > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totals.pendingTickets}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 py-3 text-xs font-black rounded-2xl transition-all ${
              activeTab === 'providers' ? 'bg-slate-900 text-white shadow' : 'text-gray-400 hover:text-gray-800'
            }`}
          >
            Prestadores
          </button>
        </div>
      </div>

      <main className="px-6 mt-6 space-y-6">
        {/* Quick Bento Stats Panel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl shadow-xs border border-gray-100">
            <TrendingUp size={16} className="text-emerald-500 mb-1" />
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Receita Assinaturas</span>
            <span className="text-xl font-black text-gray-800">R$ {totals.subscriptionRevenue.toFixed(2)}</span>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-xs border border-gray-100">
            <Landmark size={16} className="text-blue-500 mb-1" />
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Receita AdMob Estimada</span>
            <span className="text-xl font-black text-gray-800">R$ {totals.simulatedAdRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* FINANCIAL SUMMARY VIEW */}
        {activeTab === 'finance' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 space-y-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-indigo-500" />
                Como Monetizamos o Aplicativo?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Temos duas grandes fontes de geração de caixa estruturadas em tempo real:
              </p>
              <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 pt-1">
                <li><strong>Anúncios por Clique (AdMob/Ads)</strong>: Cada vez que um cliente clica no botão "Contato" do prestador no aplicativo, registramos o clique. Simulamos um split de <strong>R$ 0.15 por clique</strong> de faturamento de anúncio de rede parceira.</li>
                <li><strong>Assinatura Mensal (SaaS Pró)</strong>: Os planos de destaque Prata (R$ 29,90) e Ouro (R$ 59,90) contratados de forma virtual alimentam o caixa geral da startup.</li>
              </ul>
            </div>

            {/* List financial transactions */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-sm px-1">Registros de Transações Recebidas</h3>
              {transactions.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center text-gray-400 text-xs border border-gray-100">
                  Nenhum plano premium foi assinado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((trans) => (
                    <div key={trans.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800">{trans.providerName}</h4>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Plano: <span className="font-bold text-blue-600">{trans.planName}</span> • {trans.paymentMethod}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          Comprado por: {trans.userEmail}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-green-600 block">R$ {parseFloat(trans.amount).toFixed(2)}</span>
                        <span className="text-[8px] bg-green-50 text-green-600 font-extrabold px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Aprovado</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMER SUPPORT TICKETS VIEW */}
        {activeTab === 'tickets' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-gray-700 text-sm px-1 flex items-center gap-1.5">
              <MessageSquare size={16} />
              Tickets abertos por Clientes
            </h3>

            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center text-gray-400 text-xs border border-gray-100">
                Nenhum chamado de suporte registrado.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        ticket.type === 'bug' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {ticket.type === 'bug' ? 'Bug / Erro' : 'Ajuda / Dúvida'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        ticket.status === 'Resolvido' ? 'bg-green-50 text-green-600' :
                        ticket.status === 'Respondido' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-gray-800 text-sm">{ticket.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
                      
                      <div className="mt-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-[10px] text-gray-400 space-y-0.5">
                        <p><strong>Remetente:</strong> {ticket.userName} ({ticket.userEmail})</p>
                        <p><strong>Aberto em:</strong> {new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>

                    {ticket.adminResponse && (
                      <div className="bg-blue-50/40 p-3 rounded-2xl border border-blue-100">
                        <p className="text-[9px] font-black text-blue-600 uppercase">Sua Resposta Enviada:</p>
                        <p className="text-xs text-gray-700 italic mt-0.5">"{ticket.adminResponse}"</p>
                      </div>
                    )}

                    {/* Admin Actions */}
                    <div className="flex gap-2 pt-1 border-t border-gray-50">
                      {ticket.status !== 'Resolvido' && (
                        <button
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 size={14} />
                          Resolver Chamado
                        </button>
                      )}
                      
                      {respondingToTicketId !== ticket.id ? (
                        <button
                          onClick={() => {
                            setRespondingToTicketId(ticket.id);
                            setAdminResponseText(ticket.adminResponse || '');
                          }}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold py-2.5 rounded-xl transition-all"
                        >
                          {ticket.adminResponse ? 'Alterar Resposta' : 'Responder'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setRespondingToTicketId(null)}
                          className="flex-1 text-gray-400 text-xs hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    {respondingToTicketId === ticket.id && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 animate-fade-in">
                        <textarea
                          rows={3}
                          value={adminResponseText}
                          onChange={(e) => setAdminResponseText(e.target.value)}
                          placeholder="Digite aqui a resposta para o prestador/cliente..."
                          className="w-full text-xs bg-gray-50 p-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-600 border border-gray-100 font-medium"
                        />
                        <button
                          onClick={() => handleSendTicketResponse(ticket.id)}
                          disabled={isSubmittingResponse || !adminResponseText.trim()}
                          className="w-full bg-blue-600 text-white text-xs font-black py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40"
                        >
                          {isSubmittingResponse ? 'Salvando...' : 'Gravar Resposta'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROVIDER STUFF & APPROVAL TICKETS VIEW */}
        {activeTab === 'providers' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-bold text-gray-700 text-sm px-1 flex items-center gap-1.5">
              <BadgeCheck size={16} className="text-blue-500" />
              Diretório Administrativo de Prestadores
            </h3>

            {providers.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center text-gray-400 text-xs border border-gray-100">
                Nenhum prestador cadastrado no sistema.
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((prov) => (
                  <div key={prov.id} className="bg-white p-4 rounded-3xl border border-gray-100 space-y-3 text-xs">
                    <div className="flex gap-3">
                      <img 
                        src={prov.photoURL || `https://ui-avatars.com/api/?name=${prov.name}`} 
                        className="w-12 h-12 rounded-xl object-cover" 
                      />
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                          {prov.name}
                          {prov.isVerified && <BadgeCheck size={15} className="text-blue-500 shrink-0" />}
                        </h4>
                        <p className="text-gray-400">{prov.category || 'Prestador'}</p>
                        <p className="text-[10px] text-gray-400 italic">WhatsApp: {prov.whatsapp}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold block">Plano Atual</span>
                        <span className="font-black text-gray-700 uppercase">{prov.plan || 'Bronze (Grátis)'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold block">Localização</span>
                        <span className="font-black text-gray-700 truncate block max-w-[120px]">{prov.location || 'Não definido'}</span>
                      </div>
                    </div>

                    {/* Admin Toggles */}
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => toggleProviderVerified(prov.id, !!prov.isVerified)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                          prov.isVerified 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {prov.isVerified ? '✓ Verificado' : 'Aprovar Verificado'}
                      </button>
                      
                      <button
                        onClick={() => toggleProviderFeatured(prov.id, !!prov.featured)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                          prov.featured 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {prov.featured ? '★ Em Destaque' : 'Destacar Perfil'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
