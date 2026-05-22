import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ArrowLeft, MessageSquare, AlertTriangle, HelpCircle, ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Como funciona o Avalia-me?",
    answer: "O Avalia-me é uma plataforma que conecta clientes a prestadores de serviços locais confiáveis. Os clientes encontram profissionais qualificados e podem contratá-los via WhatsApp, além de deixar avaliações reais sobre a experiência."
  },
  {
    question: "Como posso destacar o meu perfil profissional?",
    answer: "Você pode assinar um dos nossos planos Premium (Prata ou Ouro). O plano Ouro garante o selo de Destaque, posicionamento no topo do ranking das buscas, mais cliques no contato e acompanhamento de estatísticas de engajamento."
  },
  {
    question: "O selo de verificado é pago?",
    answer: "Não! O selo de verificado é uma garantia de autenticidade dada gratuitamente pela equipe do Avalia-me após a equipe administrativa verificar seus documentos ou portfólio para evitar perfis falsos."
  },
  {
    question: "Como posso reportar um bug ou abuso?",
    answer: "Você pode registrar um ticket diretamente nesta página selecionando a categoria 'Relatar Bug' ou 'Denunciar Perfil'. Nós analisamos todos os envios em menos de 24 horas úteis."
  },
];

export default function SupportTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Form state
  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load user's active tickets
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData: any[] = [];
      snapshot.forEach((doc) => {
        ticketsData.push({ id: doc.id, ...doc.data() });
      });
      setTickets(ticketsData);
    }, (error) => {
      console.error("Error loading tickets: ", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: user.uid,
        userName: user.displayName || "Usuário do App",
        userEmail: user.email || "",
        type,
        title,
        description,
        status: 'Aberto', // Aberto, Em Análise, Respondido, Resolvido
        adminResponse: '',
        createdAt: new Date().toISOString()
      });

      setTitle('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen text-left">
      <header className="bg-blue-600 pt-8 pb-12 px-6 rounded-b-[40px] shadow-lg text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="bg-white/20 p-2 rounded-xl">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black">Central de Ajuda</h1>
          <p className="text-white/80 text-sm">Suporte & perguntas frequentes</p>
        </div>
      </header>

      <main className="px-6 -mt-6 space-y-6">
        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-blue-600" />
            Perguntas Frequentes
          </h2>
          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-left py-1 text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  <span>{faq.question}</span>
                  {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            Relatar Erro ou Pedir Ajuda
          </h2>

          {success ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-50 rounded-2xl p-4 text-center border border-green-100 mb-4 text-green-700 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Ticket enviado com sucesso! Respondemos em até 24h.
            </motion.div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Tipo de Solicitação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    type === 'bug'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <AlertTriangle size={14} />
                  Bug / Erro
                </button>
                <button
                  type="button"
                  onClick={() => setType('duvida')}
                  className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    type === 'duvida'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <HelpCircle size={14} />
                  Outro / Ajuda
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Assunto</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Erro ao alterar minha foto"
                className="w-full bg-gray-50 rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-600 border border-gray-100 text-sm font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Descrição Detalhada</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o que aconteceu ou qual é a sua dúvida..."
                className="w-full bg-gray-50 rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-600 border border-gray-100 text-sm font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-sm shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </form>
        </div>

        {/* Existing tickets list */}
        {tickets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
              <Clock size={20} className="text-blue-600" />
              Seus Atendimentos
            </h2>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      ticket.type === 'bug' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {ticket.type === 'bug' ? 'Bug / Erro' : 'Dúvida / Ajuda'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      ticket.status === 'Resolvido' ? 'bg-green-50 text-green-600' :
                      ticket.status === 'Respondido' ? 'bg-indigo-50 text-indigo-600' :
                      ticket.status === 'Em Análise' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{ticket.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{ticket.description}</p>
                  </div>

                  {ticket.adminResponse ? (
                    <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 mt-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase">Resposta do Suporte:</p>
                      <p className="text-xs text-gray-700 mt-1 italic">"{ticket.adminResponse}"</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Aguardando análise da nossa equipe de suporte...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
