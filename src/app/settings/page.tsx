'use client';

import { ArrowLeft, BellRing, Bell, Volume2, Vibrate, Clock, Sun, Moon, UserPlus, CheckSquare, MessageSquare, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function Settings() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-[#f8f5f8]/80 backdrop-blur-md px-4 py-6 flex items-center justify-between border-b border-[#f425f4]/10">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f425f4]/10 transition-colors">
          <ArrowLeft size={24} className="text-slate-900" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-center flex-1">Paramètres de Notifications</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-6">
          <div className="bg-gradient-to-r from-[#f425f4]/20 to-[#f425f4]/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f425f4] flex items-center justify-center text-white">
              <BellRing size={24} />
            </div>
            <div>
              <h2 className="font-semibold">ZenFlow Focus</h2>
              <p className="text-sm opacity-70">Gérez vos interruptions intelligemment.</p>
            </div>
          </div>
        </div>

        <section className="px-4 mb-8">
          <h3 className="text-[#f425f4] font-bold text-sm uppercase tracking-widest mb-4 px-2">Alertes Générales</h3>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#f425f4]/5">
            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <span className="font-medium">Notifications Push</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Volume2 size={20} />
                </div>
                <span className="font-medium">Sons</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Vibrate size={20} />
                </div>
                <span className="font-medium">Vibration</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" />
              </label>
            </div>
          </div>
        </section>

        <section className="px-4 mb-8">
          <h3 className="text-[#f425f4] font-bold text-sm uppercase tracking-widest mb-4 px-2">Rappels de Tâches</h3>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#f425f4]/5">
            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Rappel par défaut</span>
                  <span className="text-xs opacity-60 text-slate-500">10 minutes avant</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </div>

            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Sun size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Résumé du matin</span>
                  <span className="text-xs opacity-60 text-slate-500">Reçu à 08:00</span>
                </div>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <Moon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Bilan du soir</span>
                  <span className="text-xs opacity-60 text-slate-500">Reçu à 21:00</span>
                </div>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" />
              </label>
            </div>
          </div>
        </section>

        <section className="px-4 mb-8">
          <h3 className="text-[#f425f4] font-bold text-sm uppercase tracking-widest mb-4 px-2">Tâches Partagées</h3>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#f425f4]/5">
            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <span className="font-medium">Nouvelles tâches</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-[#f425f4]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <CheckSquare size={20} />
                </div>
                <span className="font-medium">Tâches terminées</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <span className="font-medium">Commentaires</span>
              </div>
              <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#f425f4] transition-all">
                <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                <input type="checkbox" className="invisible absolute" defaultChecked />
              </label>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  );
}
