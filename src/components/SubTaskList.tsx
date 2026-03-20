'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getSubTasks, addSubTask, toggleSubTask, deleteSubTask, type SubTask } from '@/lib/db';

interface SubTaskListProps {
  taskId: number;
  taskTitle?: string;
  onProgressChange?: (progress: number) => void;
  compact?: boolean;
}

export default function SubTaskList({ taskId, taskTitle, onProgressChange, compact }: SubTaskListProps) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  const fetchSubTasks = async () => {
    const data = await getSubTasks(taskId);
    setSubtasks(data);
    setIsLoading(false);
    
    if (onProgressChange) {
      const completed = data.filter(s => s.completed).length;
      const progress = data.length > 0 ? Math.round((completed / data.length) * 100) : 0;
      onProgressChange(progress);
    }
  };

  useEffect(() => {
    fetchSubTasks();
  }, [taskId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addSubTask(taskId, newTitle.trim());
    setNewTitle('');
    fetchSubTasks();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleSubTask(id, current);
    fetchSubTasks();
  };

  const handleDelete = async (id: string) => {
    await deleteSubTask(id);
    fetchSubTasks();
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sous-tâches</h4>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {subtasks.filter(s => s.completed).length}/{subtasks.length}
            </span>
          </div>
          
          {taskTitle && (
            <button
              type="button"
              onClick={async () => {
                if (isGeneratingSubtasks) return;
                setIsGeneratingSubtasks(true);
                try {
                  const res = await fetch('/api/ai/subtasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: taskTitle })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.subtasks && Array.isArray(data.subtasks)) {
                      // Save each generated subtask to DB
                      for (const title of data.subtasks) {
                        await addSubTask(taskId, title);
                      }
                      fetchSubTasks();
                    }
                  }
                } catch (e) {
                  console.error('Failed to generate subtasks:', e);
                } finally {
                  setIsGeneratingSubtasks(false);
                }
              }}
              disabled={isGeneratingSubtasks}
              className={cn(
                 "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm",
                 "bg-gradient-to-r from-purple-500 to-[var(--theme-primary)] text-white hover:opacity-90 active:scale-95"
              )}
            >
              {isGeneratingSubtasks ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGeneratingSubtasks ? "Découpage..." : "Magie IA"}
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {subtasks.map((st) => (
          <motion.div
            key={st.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={cn(
              "group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm",
              compact && "p-2 gap-2 border-slate-50"
            )}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleToggle(st.id, st.completed); }}
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                st.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-200",
                compact && "w-5 h-5 rounded-md"
              )}
            >
              {st.completed && <Check size={compact ? 12 : 14} className="text-white stroke-[3px]" />}
            </button>
            <span className={cn(
              "flex-1 text-sm font-medium transition-all truncate",
              st.completed ? "text-slate-300 line-through" : "text-slate-700",
              compact && "text-xs"
            )}>
              {st.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(st.id); }}
              className={cn(
                "opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all",
                compact && "p-1"
              )}
            >
              <Trash2 size={compact ? 12 : 14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <form 
        onSubmit={handleAdd} 
        className={cn("relative mt-2", compact && "mt-1")}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Ajouter une étape..."
          className={cn(
            "w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-4 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all",
            compact && "py-2 text-xs rounded-lg"
          )}
        />
        <button
          type="submit"
          className={cn(
            "absolute right-2 top-1.5 w-9 h-9 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-600 shadow-sm",
            compact && "w-7 h-7 top-1 right-1"
          )}
        >
          <Plus size={compact ? 16 : 18} />
        </button>
      </form>
    </div>
  );
}
