'use client';

import { useState, useEffect, useMemo } from 'react';
import { FolderOpen, UserPlus, Briefcase, Heart, Users, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getAllTasks, type Task } from '@/lib/db';

export default function Projects() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getAllTasks().then(setTasks);
  }, []);

  // Group tasks by category
  const workTasks = useMemo(() => tasks.filter(t => t.category === 'work'), [tasks]);
  const personalTasks = useMemo(() => tasks.filter(t => t.category === 'personal'), [tasks]);
  const sharedTasks = useMemo(() => tasks.filter(t => t.category === 'shared'), [tasks]);

  const projectCards = [
    { name: 'Travail', tasks: workTasks, img: 'work', gradient: 'from-purple-400/20 to-[var(--theme-primary)]/20', color: 'text-purple-600' },
    { name: 'Personnel', tasks: personalTasks, img: 'personal', gradient: 'from-[var(--theme-primary)]/20 to-pink-400/20', color: 'text-pink-600' },
    { name: 'Partagé', tasks: sharedTasks, img: 'shared', gradient: 'from-teal-400/20 to-blue-400/20', color: 'text-teal-600' },
  ];

  return (
    <>
      <header className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--theme-primary)]/10 p-2 rounded">
            <FolderOpen size={24} className="text-[var(--theme-primary)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
        </div>
        <button className="bg-[var(--theme-primary)] text-white p-2 rounded-full shadow-lg shadow-[var(--theme-primary)]/20 flex items-center justify-center">
          <UserPlus size={20} />
        </button>
      </header>

      <section className="mt-4">
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Mes Catégories</h2>
        </div>
        
        <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x no-scrollbar">
          {projectCards.map((proj) => (
            <div key={proj.name} className="min-w-[160px] flex-shrink-0 snap-start group">
              <div className={`relative aspect-square rounded-lg mb-3 overflow-hidden bg-gradient-to-br ${proj.gradient}`}>
                <Image src={`https://picsum.photos/seed/${proj.img}/300/300`} alt={proj.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                {proj.tasks.length > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
                    <span className="text-[10px] font-bold text-[var(--theme-primary)] uppercase">{proj.tasks.filter(t => !t.completed).length} actif{proj.tasks.filter(t => !t.completed).length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <p className="font-bold text-sm">{proj.name}</p>
              <p className="text-xs text-slate-500">{proj.tasks.length} tâche{proj.tasks.length > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 flex-1 px-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Toutes mes Tâches</h2>
        </div>

        <div className="space-y-4">
          {tasks.filter(t => !t.completed).length === 0 && (
            <p className="text-center text-slate-400 mt-4">Aucune tâche en cours. Zen ! 🧘</p>
          )}

          {tasks.filter(t => !t.completed).map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg flex items-center gap-4 border border-[var(--theme-primary)]/5 shadow-sm">
              <div className={`p-2 rounded-full ${
                task.category === 'work' ? 'bg-purple-100 text-purple-600' : 
                task.category === 'shared' ? 'bg-teal-100 text-teal-600' : 
                'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
              }`}>
                {task.category === 'work' ? <Briefcase size={20} /> : 
                 task.category === 'shared' ? <Users size={20} /> : <Heart size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{task.title}</h3>
                <p className="text-xs text-slate-500">
                  {task.category === 'work' ? 'Travail' : task.category === 'shared' ? 'Partagé' : 'Personnel'}
                  {task.due_date && ` • ${new Date(task.due_date).toLocaleDateString()}`}
                  {task.due_time && ` ${task.due_time}`}
                </p>
              </div>
              {task.priority === 'high' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Urgent</span>}
              {task.priority === 'medium' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Moyen</span>}
              {task.priority === 'low' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Faible</span>}
            </div>
          ))}

          {tasks.filter(t => t.completed).map((task) => (
            <div key={task.id} className="bg-white p-4 rounded-lg flex items-center gap-4 border border-[var(--theme-primary)]/5 shadow-sm opacity-60">
              <div className="bg-slate-100 text-slate-500 p-2 rounded-full">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1 line-through">
                <h3 className="text-sm font-semibold">{task.title}</h3>
                <p className="text-xs text-slate-500">
                  {task.category === 'work' ? 'Travail' : task.category === 'shared' ? 'Partagé' : 'Personnel'} • Terminé
                </p>
              </div>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Fait</span>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-[var(--theme-primary)] to-purple-600 rounded-lg p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">Agrandissez votre équipe</h3>
          <p className="text-sm text-white/80 mb-4">Collaborez mieux en invitant vos proches à vos projets.</p>
          <Link href="/family" className="inline-block bg-white text-[var(--theme-primary)] font-bold px-6 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors">
            Inviter des amis
          </Link>
        </div>
      </section>

      <BottomNav />
    </>
  );
}
