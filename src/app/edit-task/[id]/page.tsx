'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Clock, Flag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

import { getTask, updateTask } from '@/lib/db';

type Priority = 'low' | 'medium' | 'high';
type Category = 'work' | 'personal' | 'shared';

export default function EditTask() {
  const router = useRouter();
  const params = useParams();
  const taskId = parseInt(params.id as string, 10);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('personal');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTask() {
      if (isNaN(taskId)) {
        router.push('/');
        return;
      }
      const task = await getTask(taskId);
      if (task) {
        setTaskName(task.title);
        setPriority(task.priority);
        setCategory(task.category);
        setDueDate(task.due_date || '');
        setDueTime(task.due_time || '');
      } else {
        router.push('/');
      }
      setIsLoading(false);
    }
    loadTask();
  }, [taskId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await updateTask(taskId, {
        title: taskName.trim(),
        priority,
        category,
        due_date: dueDate || null,
        due_time: dueTime || null,
      } as any);
      router.push('/');
    } catch (error) {
      console.error('Failed to update task:', error);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex-1 px-6 pt-12 flex h-full bg-[#f8f5f8] items-center justify-center">Loading...</div>;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 px-6 pt-12 pb-24 flex flex-col h-full bg-[#f8f5f8]"
      >
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm"
          >
            <X size={20} />
          </button>
          <span className="font-semibold text-slate-400 text-sm">Modifier la tâche</span>
          <div className="w-10"></div>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="mb-10">
            <input
              ref={inputRef}
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Qu'avez-vous en tête ?"
              className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-300 text-slate-800"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-auto">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Hash size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Catégorie</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['personal', 'work', 'shared'] as Category[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200",
                      category === c 
                        ? (c === 'personal' ? 'bg-pink-100 text-pink-600' : 
                           c === 'work' ? 'bg-purple-100 text-purple-600' : 
                           'bg-teal-100 text-teal-600')
                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {c === 'personal' ? 'Perso' : c === 'work' ? 'Pro' : 'Partagé'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Flag size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Priorité</span>
              </div>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 gap-1",
                      priority === p 
                        ? (p === 'high' ? 'bg-red-100 text-red-600 ring-2 ring-red-200' : 
                           p === 'medium' ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-200' : 
                           'bg-green-100 text-green-600 ring-2 ring-green-200')
                        : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                    )}
                  >
                    <Flag size={14} className={priority === p ? 'fill-current' : ''} />
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {p === 'high' ? 'Urgent' : p === 'medium' ? 'Médium' : 'Faible'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Date & Time Selectors */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 relative cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden">
               <div className="min-w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                 <Calendar size={18} />
               </div>
               <div className="flex-1 w-full relative">
                 <p className="text-xs text-slate-400 font-medium">Date</p>
                 <input 
                   type="date"
                   value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                 />
                 <div className="text-sm font-semibold text-slate-700">
                   {dueDate || 'Sélectionner'}
                 </div>
               </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 relative cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden">
               <div className="min-w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                 <Clock size={18} />
               </div>
               <div className="flex-1 w-full relative">
                 <p className="text-xs text-slate-400 font-medium">Heure</p>
                 <input 
                   type="time"
                   value={dueTime}
                   onChange={(e) => setDueTime(e.target.value)}
                   className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                 />
                 <div className="text-sm font-semibold text-slate-700">
                   {dueTime || 'Sélectionner'}
                 </div>
               </div>
            </div>
            
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!taskName.trim() || isSubmitting}
            type="submit"
            className={cn(
               "mt-8 w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all",
               taskName.trim() && !isSubmitting
                 ? "bg-slate-800 shadow-slate-800/20" 
                 : "bg-slate-300 shadow-none"
             )}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                <span>Enregistrer</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
