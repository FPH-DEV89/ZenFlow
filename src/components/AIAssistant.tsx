'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Loader2, PlusCircle } from 'lucide-react';
import { Task, addTask } from '@/lib/db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant({ tasks, onTaskAdded }: { tasks: Task[], onTaskAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis Zenia. Comment puis-je t\'aider à alléger ta charge mentale aujourd\'hui ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAction = async (content: string) => {
    // Basic regex to detect [ACTION:ADD_TASK:{...}]
    const actionMatch = content.match(/\[ACTION:ADD_TASK:({.*?})\]/);
    if (actionMatch) {
      try {
        const taskData = JSON.parse(actionMatch[1]);
        await addTask({
          title: taskData.title,
          category: taskData.category || 'personal',
          priority: taskData.priority || 'medium'
        });
        onTaskAdded();
        return content.replace(actionMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse AI action", e);
      }
    }
    return content;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          tasks: tasks
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erreur serveur (${res.status})`);

      const cleanedContent = await handleAction(data.content);
      setMessages(prev => [...prev, { role: 'assistant', content: cleanedContent }]);
    } catch (error: any) {
      console.error("[ZENIA FRONTEND ERROR]", error);
      const errorMsg = error.message?.includes("401") 
        ? "Ta session semble avoir expiré. Essaie de te reconnecter. 🧘‍♂️" 
        : `Zenia a un petit souci technique : ${error.message || "Erreur inconnue"}.`;
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-200 z-40"
      >
        <Sparkles className="text-white w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed inset-x-4 bottom-24 top-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-purple-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-50 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-pink-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="text-purple-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Zenia</h3>
                  <p className="text-xs text-purple-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    En ligne & Zen
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-white border border-purple-50 text-gray-700 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-purple-50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                    <span className="text-xs text-gray-400 italic">Zenia réfléchit...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-gray-50/50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pose une question ou donne une tâche..."
                  className="w-full bg-white border border-purple-100 rounded-2xl py-4 px-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-4">
                ZenFlow AI peut faire des erreurs. Reste serein.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
