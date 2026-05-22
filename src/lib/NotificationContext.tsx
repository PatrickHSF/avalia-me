import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, MessageCircle, Info, Bell, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';

interface ReviewReminder {
  id: string;
  providerId: string;
  providerName: string;
  photoURL?: string;
  timestamp: number;
}

interface NotificationContextType {
  reminders: ReviewReminder[];
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  addReminder: (providerId: string, providerName: string, photoURL?: string) => void;
  removeReminder: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<ReviewReminder[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [reviewingReminder, setReviewingReminder] = useState<ReviewReminder | null>(null);
  const navigate = useNavigate();

  // Load from session storage to persist across refreshes in current session
  useEffect(() => {
    const saved = sessionStorage.getItem('review_reminders');
    if (saved) {
      try {
        setReminders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse reminders", e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('review_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = useCallback((providerId: string, providerName: string, photoURL?: string) => {
    // Avoid duplicates for the same provider in a short time
    setReminders(prev => {
      const exists = prev.find(r => r.providerId === providerId);
      if (exists) return prev;
      
      const newReminder = {
        id: Math.random().toString(36).substr(2, 9),
        providerId,
        providerName,
        photoURL,
        timestamp: Date.now()
      };
      return [newReminder, ...prev];
    });
  }, []);

  const removeReminder = (id: string) => {
    setReminders(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ reminders, isPanelOpen, setIsPanelOpen, addReminder, removeReminder }}>
      {children}
      
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] z-[201] shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-center p-4">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>
              
              <div className="px-6 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Notificações</h2>
                  <p className="text-gray-500 text-sm">Contatos recentes</p>
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="p-3 bg-gray-100 rounded-full text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8">
                {reminders.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Bell size={40} />
                    </div>
                    <p className="text-gray-500 font-medium italic">Nenhuma notificação por enquanto</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-50 p-5 rounded-[28px] border border-gray-100"
                      >
                        <div className="flex gap-4 mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                            {reminder.photoURL ? (
                              <img src={reminder.photoURL} alt={reminder.providerName} className="w-full h-full object-cover rounded-2xl shadow-sm" />
                            ) : (
                              <MessageCircle size={24} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 group">
                              Você clicou em <span className="text-blue-600">{reminder.providerName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
                              Avalie este serviço!
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => {
                              setReviewingReminder(reminder);
                            }}
                            className="flex items-center justify-center gap-2 py-3 bg-yellow-400 text-white rounded-2xl font-black shadow-lg shadow-yellow-200 active:scale-[0.98] transition-all"
                          >
                            <Star size={18} fill="currentColor" />
                            Avaliar
                          </button>
                          <button 
                            onClick={() => removeReminder(reminder.id)}
                            className="flex items-center justify-center gap-2 py-3 bg-white text-red-500 border-2 border-red-50 rounded-2xl font-bold hover:bg-red-50 active:scale-[0.98] transition-all"
                          >
                            <Trash2 size={18} />
                            Não contratei
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {reviewingReminder && (
        <ReviewModal 
          isOpen={!!reviewingReminder}
          onClose={() => {
            if (reviewingReminder) {
              removeReminder(reviewingReminder.id);
            }
            setReviewingReminder(null);
            setIsPanelOpen(false);
          }}
          provider={{
            id: reviewingReminder.providerId,
            name: reviewingReminder.providerName,
            photoURL: reviewingReminder.photoURL
          }}
        />
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
