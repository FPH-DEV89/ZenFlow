'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, MoreVertical, PlusCircle, Briefcase, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getAllTasks, type Task } from '@/lib/db';

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  useEffect(() => {
    getAllTasks().then(setTasks);
  }, []);

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const emptySlots = Array.from({ length: firstDayOfMonth });
  const daySlots = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDateStr = useMemo(() => {
    const y = currentYear;
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentYear, currentMonth, selectedDay]);

  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completed && t.due_date === selectedDateStr)
      .sort((a, b) => {
        if (!a.due_time) return -1;
        if (!b.due_time) return 1;
        return a.due_time.localeCompare(b.due_time);
      });
  }, [tasks, selectedDateStr]);

  const daysWithTasks = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed && t.due_date);
    const days = new Set<string>();
    activeTasks.forEach(t => {
      if (t.due_date) days.add(t.due_date);
    });
    return days;
  }, [tasks]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const isToday = (day: number) => {
    return day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
  };

  const categoryStyle = (cat: string) => {
    if (cat === 'work') return { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-600', label: 'Travail', icon: <Briefcase size={20} /> };
    if (cat === 'shared') return { border: 'border-teal-400', bg: 'bg-teal-100', text: 'text-teal-600', label: 'Partagé', icon: <Users size={20} /> };
    return { border: 'border-[#f425f4]', bg: 'bg-[#f425f4]/10', text: 'text-[#f425f4]', label: 'Personnel', icon: <Heart size={20} /> };
  };

  return (
    <>
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-sm text-[#f425f4] font-medium">{MOIS[currentMonth]} {currentYear}</p>
        </div>
        <button className="w-12 h-12 rounded-full bg-[#f425f4]/10 flex items-center justify-center text-[#f425f4]">
          <Search size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#f425f4]/5">
            <div className="flex items-center justify-between mb-4 px-2">
              <button onClick={prevMonth} className="p-2 hover:bg-[#f425f4]/5 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <h2 className="text-lg font-semibold">{MOIS[currentMonth]}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-[#f425f4]/5 rounded-full transition-colors">
                <ChevronRight size={20} className="text-slate-600" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 text-center mb-2">
              {JOURS.map((day, i) => (
                <span key={i} className="text-xs font-bold text-slate-400 uppercase">{day.charAt(0)}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-1">
              {emptySlots.map((_, i) => (
                <div key={`e${i}`} className="h-10"></div>
              ))}
              {daySlots.map((day) => (
                <button 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="h-10 flex flex-col items-center justify-center relative"
                >
                  {isToday(day) ? (
                    <>
                      <div className="absolute inset-1 bg-[#f425f4] rounded-full"></div>
                      <span className="text-sm font-bold text-white relative z-10">{day}</span>
                    </>
                  ) : (
                    <span className={`text-sm font-medium ${selectedDay === day && !isToday(day) ? 'text-[#f425f4] font-bold' : ''}`}>
                      {day}
                    </span>
                  )}
                  {selectedDay === day && !isToday(day) && (
                    <div className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#f425f4]"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Événements du jour</h3>
            <span className="text-[#f425f4] text-sm font-semibold">{todayTasks.length} tâche{todayTasks.length > 1 ? 's' : ''}</span>
          </div>

          {todayTasks.length === 0 && (
            <p className="text-center text-slate-400 mt-4">Journée libre, profitez-en ! ☀️</p>
          )}

          {todayTasks.map((task, i) => {
            const style = categoryStyle(task.category);
            const timeStr = task.due_time || '--:--';
            let ampm = '';
            if (task.due_time) {
               const hours = parseInt(task.due_time.split(':')[0], 10);
               ampm = !isNaN(hours) ? (hours >= 12 ? 'PM' : 'AM') : '';
            }

            return (
              <div key={task.id || i} className="flex gap-4">
                <div className="w-16 flex flex-col items-center pt-2">
                  <span className="text-sm font-bold">{timeStr}</span>
                  <span className="text-xs text-slate-400">{ampm}</span>
                </div>
                <div className={`flex-1 bg-white p-4 rounded-xl border-l-4 ${style.border} shadow-sm`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-900">{task.title}</h4>
                    <MoreVertical size={16} className="text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {task.priority === 'high' ? '🔥 Urgence' : task.priority === 'low' ? '🌱 Optionnel' : '⚡ Normal'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded-full ${style.bg} text-[10px] font-bold ${style.text} uppercase`}>{style.label}</div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link href="/new-task" className="flex gap-4">
            <div className="w-16 flex flex-col items-center pt-2">
              <span className="text-sm font-bold text-slate-300">--:--</span>
            </div>
            <div className="flex-1 border-2 border-dashed border-slate-200 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-[#f425f4]/50 hover:text-[#f425f4] transition-colors cursor-pointer">
              <PlusCircle size={20} />
              <span className="text-sm font-medium">Ajouter une tâche</span>
            </div>
          </Link>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
