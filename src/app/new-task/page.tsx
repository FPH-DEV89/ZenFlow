'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Calendar, Clock, Flag, Hash, Plus, Trash2, CheckCircle2, Bell, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { addTask, getUserGroups, Group } from '@/lib/db';

type Priority = 'low' | 'medium' | 'high';
type Category = 'work' | 'personal' | 'shared';
type Recurrence = 'daily' | 'weekly' | 'monthly' | 'none';

export default function NewTask() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('personal');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderOffset, setReminderOffset] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  // Auto-focus on load for zero friction
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    
    const loadGroups = async () => {
      const groups = await getUserGroups();
      setUserGroups(groups);
      if (groups.length > 0) setGroupId(groups[0].id);
    };
    loadGroups();
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await addTask({
        title: taskName.trim(),
        priority,
        category,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        group_id: category === 'shared' ? groupId : undefined,
        recurrence: recurrence === 'none' ? undefined : recurrence,
        reminder_offset: reminderOffset,
      }, subtasks);
      // Redirect back home on success
      router.push('/');
    } catch (error) {
      console.error('Failed to add task:', error);
      setIsSubmitting(false); // only reset on fail, redirect clears the component
    }
  };

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
          <span className="font-semibold text-slate-400 text-sm">Nouvelle Tâche</span>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Main Input Area (Largest Element) */}
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

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4 mb-auto">
            
            {/* Category Selector */}
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
              
              {category === 'shared' && (
                <div className="mt-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                   {userGroups.length > 0 ? (
                      <span className="text-[10px] bg-teal-50 text-teal-600 font-bold px-2 py-1 rounded truncate w-full">
                        Foyer: {userGroups.find(g => g.id === groupId)?.name || 'Défaut'}
                      </span>
                   ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded truncate w-full">
                        ⚠️ Vous n'avez pas encore de Foyer
                      </span>
                   )}
                </div>
              )}
            </div>

            {/* Priority Selector */}
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
                 <p className="text-xs text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Date cible</p>
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
                 <p className="text-xs text-slate-400 font-medium">Heure cible</p>
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

            {/* Reminder Selector */}
            <div className="col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Bell size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Rappel</span>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 0, label: "À l'heure" },
                  { value: 15, label: "15 min avant" },
                  { value: 60, label: "1h avant" }
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReminderOffset(r.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                      reminderOffset === r.value 
                        ? "bg-amber-100 text-amber-600 border-amber-200 ring-2 ring-amber-200"
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurrence Selector */}
            <div className="col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Hash size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Récurrence (Répétition)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['none', 'daily', 'weekly', 'monthly'] as Recurrence[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRecurrence(r)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border",
                      recurrence === r 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                        : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
                    )}
                  >
                    {r === 'none' ? 'Jamais' : r === 'daily' ? 'Quotidienne' : r === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Sous-tâches ({subtasks.length})</span>
                </div>
                
                <button
                  type="button"
                  onClick={async () => {
                    if (!taskName.trim() || isGeneratingSubtasks) return;
                    setIsGeneratingSubtasks(true);
                    try {
                      const res = await fetch('/api/ai/subtasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: taskName })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.subtasks && Array.isArray(data.subtasks)) {
                          setSubtasks(prev => [...prev, ...data.subtasks]);
                        }
                      }
                    } catch (e) {
                      console.error('Failed to generate subtasks:', e);
                    } finally {
                      setIsGeneratingSubtasks(false);
                    }
                  }}
                  disabled={!taskName.trim() || isGeneratingSubtasks}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm",
                    !taskName.trim()
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-[var(--theme-primary)] text-white hover:opacity-90 active:scale-95"
                  )}
                >
                  {isGeneratingSubtasks ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {isGeneratingSubtasks ? "Découpage..." : "Magie IA"}
                </button>
              </div>
              
              <div className="space-y-2">
                <AnimatePresence>
                  {subtasks.map((st, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group"
                    >
                      <span className="text-sm text-slate-700 font-medium truncate flex-1">{st}</span>
                      <button 
                        type="button" 
                        onClick={() => setSubtasks(prev => prev.filter((_, i) => i !== index))}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSubtaskTitle.trim()) {
                        setSubtasks(prev => [...prev, newSubtaskTitle.trim()]);
                        setNewSubtaskTitle('');
                      }
                    }
                  }}
                  placeholder="Ajouter une étape..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubtaskTitle.trim()) {
                      setSubtasks(prev => [...prev, newSubtaskTitle.trim()]);
                      setNewSubtaskTitle('');
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[var(--theme-primary)] hover:text-white transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={!taskName.trim() || isSubmitting}
            type="submit"
            className={cn(
               "mt-8 w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all",
               taskName.trim() && !isSubmitting
                 ? "bg-[var(--theme-primary)] shadow-[var(--theme-primary)]/30" 
                 : "bg-slate-300 shadow-none"
             )}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={20} />
                <span>Créer la tâche</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
