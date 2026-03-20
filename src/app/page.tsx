'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Briefcase, Check, Trash2, LogOut, Star, Edit2, Repeat } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { getAllTasks, toggleTaskCompletion, deleteTask, type Task } from '@/lib/db';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AIAssistant from '@/components/AIAssistant';
import confetti from 'canvas-confetti';

const categories = [
  { id: 'all', name: 'Toutes', color: 'bg-purple-100 text-purple-600' },
  { id: 'work', name: 'Travail', color: 'bg-blue-100 text-blue-600' },
  { id: 'personal', name: 'Personnel', color: 'bg-pink-100 text-pink-600' },
  { id: 'shared', name: 'Partagé', color: 'bg-emerald-100 text-emerald-600' },
];

/* ─── Swipeable Task Card ─────────────────────────────────────────────── */
function SwipeableTaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: (id: number, status: boolean) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}) {
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && !task.completed) {
      setSwiped('right');
      setTimeout(() => onToggle(task.id!, task.completed), 300);
    } else if (info.offset.x < -threshold) {
      setSwiped('left');
      setTimeout(() => onDelete(task.id!), 300);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      {/* Background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-8 rounded-[2rem]"
        style={{ background: swiped === 'left' ? '#fee2e2' : swiped === 'right' ? '#d1fae5' : '#f1f5f9' }}>
        <span className="text-emerald-500 font-bold text-sm">✓ Terminée</span>
        <span className="text-red-500 font-bold text-sm">✕ Supprimer</span>
      </div>
      
      {/* Foreground card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        animate={swiped === 'right' ? { x: 400, opacity: 0 } : swiped === 'left' ? { x: -400, opacity: 0 } : { x: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        className="group flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-shadow duration-300 cursor-grab active:cursor-grabbing relative z-10"
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          task.category === 'work' ? 'bg-blue-50' : 
          task.category === 'personal' ? 'bg-pink-50' : 'bg-emerald-50'
        }`}>
          <Briefcase className={`w-6 h-6 stroke-[2.5px] ${
            task.category === 'work' ? 'text-blue-500' : 
            task.category === 'personal' ? 'text-pink-500' : 'text-emerald-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-gray-800 truncate text-base ${task.completed ? 'line-through text-gray-300' : ''}`}>
            {task.title}
          </h4>
          <p className="text-xs text-gray-400 flex items-center gap-2 mt-1 font-semibold">
            {task.priority === 'high' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {task.priority === 'medium' && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
            <span className="uppercase tracking-wider">{task.priority === 'high' ? 'URGENT' : task.priority}</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full" />
            <span className="uppercase tracking-wider">{categories.find(c => c.id === task.category)?.name}</span>
            {task.recurrence && (
              <>
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <Repeat size={12} className="text-indigo-500" />
                <span className="text-indigo-500 font-bold lowercase tracking-normal">
                  {task.recurrence === 'daily' ? 'chaque jour' : task.recurrence === 'weekly' ? 'toutes les sem.' : 'chaque mois'}
                </span>
              </>
            )}
          </p>
          
          {task.subtasks_total ? task.subtasks_total > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Check size={10} className="text-emerald-500" /> 
                  {Math.round((task.subtasks_completed! / task.subtasks_total!) * 100)}%
                </span>
                <span>{task.subtasks_completed}/{task.subtasks_total} étapes</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(task.subtasks_completed! / task.subtasks_total!) * 100}%` }}
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(task.id!, task.completed); }}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              task.completed 
              ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200' 
              : 'border-purple-100 hover:border-purple-400 bg-slate-50/50'
            }`}
          >
            {task.completed && <Check className="text-white w-5 h-5 stroke-[3px]" />}
          </button>
          {!task.completed && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(task.id!); }}
              className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-300 hover:text-blue-500 hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id!); }}
            className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const prevAllCompletedRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    const data = await getAllTasks();
    setTasks(data);
    setIsLoadingTasks(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchTasks();
      }
    };
    checkUser();
  }, [router]);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    await toggleTaskCompletion(id, currentStatus);
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    fetchTasks();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 🎉 Confetti celebration when ALL tasks are completed
  useEffect(() => {
    if (tasks.length === 0) return;
    const allCompleted = tasks.every(t => t.completed);
    if (allCompleted && !prevAllCompletedRef.current) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#f425f4', '#ec4899', '#22c55e', '#fbbf24']
      });
    }
    prevAllCompletedRef.current = allCompleted;
  }, [tasks]);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filter);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100;
  
  const mentalLoadText = progress === 100 
    ? "est légère aujourd'hui" 
    : progress > 50 
    ? "est sous contrôle" 
    : "est un peu lourde...";

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-10 border-b border-gray-100">
        <button 
          onClick={handleLogout}
          className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors"
        >
          <LogOut className="text-purple-600 w-5 h-5" />
        </button>
        <span className="font-bold text-gray-800 tracking-tight text-lg">ZenFlow</span>
        <div className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white shadow-sm overflow-hidden">
          <img src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User" />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 pb-32">
        {/* Mental Load Progress */}
        <section className="flex flex-col items-center space-y-6 pt-4 bg-white rounded-[2.5rem] p-8 shadow-sm border border-purple-50">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-purple-50"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="74"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={465}
                initial={{ strokeDashoffset: 465 }}
                animate={{ strokeDashoffset: 465 - (465 * progress) / 100 }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="text-purple-600"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-800 tracking-tighter">{progress}%</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Zen</span>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 leading-tight">
              Bonjour, votre charge mentale <br /> <span className="text-purple-600 underline decoration-purple-100 underline-offset-4">{mentalLoadText}</span>
            </h2>
            <p className="text-gray-400 text-sm mt-3 font-medium">
              Il vous reste {tasks.filter(t => !t.completed).length} tâche{tasks.filter(t => !t.completed).length > 1 ? 's' : ''} pour aujourd&apos;hui
            </p>
          </div>
        </section>

        {/* Categories / Filters */}
        <section>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`flex-none px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                  filter === cat.id 
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-100' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-purple-200 hover:text-purple-400 transition-all'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Task List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Tâches à venir</h3>
            <button 
              onClick={() => fetchTasks()}
              className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
            >
              VOIR TOUT
            </button>
          </div>

          <div className="space-y-4">
            {isLoadingTasks ? (
              // ── Skeleton Loaders ──
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100" />
                </div>
              ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <SwipeableTaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={(id: number) => router.push(`/edit-task/${id}`)}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-purple-50">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="text-purple-300 w-10 h-10" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">Tout est en ordre</h4>
                <p className="text-gray-400 text-sm font-medium">Aucune tâche en vue, respirez ! ✨</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating AI Assistant */}
      <AIAssistant tasks={tasks} onTaskAdded={fetchTasks} />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
