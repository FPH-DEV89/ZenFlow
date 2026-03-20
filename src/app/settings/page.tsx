'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, BellRing, Bell, Volume2, Vibrate, Clock, Sun, Moon, UserPlus, CheckSquare, MessageSquare, ChevronRight, Edit2 } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { getUserSettings, updateUserSettings } from '@/lib/db';

export default function Settings() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState({
    pushEnabled: false,
    sounds: true,
    vibration: false,
    defaultReminder: 10,
    morningSummaryEnabled: true,
    morningSummaryTime: '08:00',
    eveningSummaryEnabled: false,
    eveningSummaryTime: '21:00',
    newTasks: true,
    completedTasks: true,
    comments: true,
  });

  const [showReminderPicker, setShowReminderPicker] = useState(false);

  // Load settings from DB and fallback to localStorage
  useEffect(() => {
    const loadSettings = async () => {
      // Local fallbacks
      const savedSettings = localStorage.getItem('zenflow_settings');
      let localState = {};
      if (savedSettings) {
        try {
          localState = JSON.parse(savedSettings);
        } catch (e) {
          console.error('Failed to parse saved settings', e);
        }
      }
      
      try {
        const dbSettings = await getUserSettings();
        setSettings(prev => ({ 
          ...prev, 
          ...localState,
          pushEnabled: dbSettings.push_enabled,
          sounds: dbSettings.sounds,
          defaultReminder: dbSettings.default_reminder,
          morningSummaryEnabled: dbSettings.morning_summary_enabled,
          morningSummaryTime: dbSettings.morning_summary_time,
          eveningSummaryEnabled: dbSettings.evening_summary_enabled,
          eveningSummaryTime: dbSettings.evening_summary_time,
        }));
      } catch (e) {
        console.error('No DB settings found or offline', e);
        setSettings(prev => ({ ...prev, ...localState }));
      } finally {
        setMounted(true);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('zenflow_settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  const updateSetting = async (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    const dbKeyMap: Record<string, string> = {
      pushEnabled: 'push_enabled',
      sounds: 'sounds',
      defaultReminder: 'default_reminder',
      morningSummaryEnabled: 'morning_summary_enabled',
      morningSummaryTime: 'morning_summary_time',
      eveningSummaryEnabled: 'evening_summary_enabled',
      eveningSummaryTime: 'evening_summary_time',
    };
    
    if (dbKeyMap[key as string]) {
      await updateUserSettings({ [dbKeyMap[key as string]]: value });
    }
  };

  if (!mounted) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-6 flex items-center justify-between border-b border-[#f425f4]/5">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-[#f425f4]/10 transition-all active:scale-90">
          <ArrowLeft size={24} className="text-slate-900" />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-center flex-1 bg-gradient-to-r from-slate-900 to-[#f425f4] bg-clip-text text-transparent italic">Zen Réglages</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 bg-[#fcfafc]">
        <div className="px-4 py-8">
          <div className="bg-gradient-to-br from-white to-[#f425f4]/5 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-xl shadow-purple-100/50 border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f425f4]/10 blur-[50px] rounded-full -mr-16 -mt-16"></div>
            <div className="w-20 h-20 rounded-3xl bg-[#f425f4] flex items-center justify-center text-white shadow-2xl shadow-purple-300 relative z-10 mb-4 transform -rotate-3">
              <BellRing size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Concentration Zen</h2>
            <p className="text-slate-500 text-sm max-w-[200px]">Votre temps est précieux. Gérez vos rappels avec soin.</p>
          </div>
        </div>

        <section className="px-4 mb-10">
          <h3 className="text-[#f425f4] font-black text-[10px] uppercase tracking-[0.2em] mb-4 px-4 opacity-50">Notifications & Sons</h3>
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[#f425f4]/5">
            <div className="flex items-center justify-between p-5 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#f425f4] flex items-center justify-center shadow-inner">
                  <Bell size={24} />
                </div>
                <span className="font-bold text-slate-800">Alertes Push</span>
              </div>
              <label className="relative flex h-[34px] w-[56px] cursor-pointer items-center rounded-full p-1 transition-all duration-300" style={{ backgroundColor: settings.pushEnabled ? '#f425f4' : '#e2e8f0' }}>
                <div className={`h-[26px] w-[26px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-spring ${settings.pushEnabled ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
                <input 
                  type="checkbox" 
                  className="invisible absolute"
                  checked={settings.pushEnabled}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      const { subscribeToPush } = await import('@/lib/push');
                      const success = await subscribeToPush();
                      if (success) {
                        updateSetting('pushEnabled', true);
                      }
                    } else {
                      updateSetting('pushEnabled', false);
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="p-4 bg-purple-50/20 border-b border-slate-50">
              <button 
                onClick={async () => {
                  const res = await fetch('/api/push/send', { method: 'POST' });
                  if (!res.ok) alert('Activez les notifications pour tester.');
                }}
                className="w-full py-3.5 bg-white border-2 border-purple-100 rounded-2xl text-[10px] font-black tracking-widest text-[#f425f4] hover:bg-white hover:shadow-lg active:scale-95 transition-all"
              >
                ENVOYER UN TEST
              </button>
            </div>

            <div className="flex items-center justify-between p-5 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#f425f4] flex items-center justify-center shadow-inner">
                  <Volume2 size={24} />
                </div>
                <span className="font-bold text-slate-800">Sons de l'app</span>
              </div>
              <label className="relative flex h-[34px] w-[56px] cursor-pointer items-center rounded-full p-1 transition-all duration-300" style={{ backgroundColor: settings.sounds ? '#f425f4' : '#e2e8f0' }}>
                <div className={`h-[26px] w-[26px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-spring ${settings.sounds ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
                <input type="checkbox" className="invisible absolute" checked={settings.sounds} onChange={(e) => updateSetting('sounds', e.target.checked)} />
              </label>
            </div>

            <div className="flex items-center justify-between p-5 opacity-30 grayscale cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                  <Vibrate size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Vibrations</span>
                  <span className="text-[10px] font-black tracking-tighter">BIENTÔT</span>
                </div>
              </div>
              <div className="h-[34px] w-[56px] rounded-full bg-slate-100"></div>
            </div>
          </div>
        </section>

        <section className="px-4 mb-10">
          <h3 className="text-[#f425f4] font-black text-[10px] uppercase tracking-[0.2em] mb-4 px-4 opacity-50">Timing & Rappels</h3>
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-[#f425f4]/5">
            {/* Default Reminder Picker */}
            <div 
              onClick={() => setShowReminderPicker(!showReminderPicker)}
              className="flex items-center justify-between p-5 border-b border-slate-50 cursor-pointer hover:bg-slate-50/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f425f4]/10 text-[#f425f4] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Rappel par défaut</span>
                  <span className="text-sm text-[#f425f4] font-black mt-0.5">{settings.defaultReminder} minutes avant</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Edit2 size={14} className="text-slate-300 group-hover:text-[#f425f4] transition-colors" />
                 <ChevronRight size={20} className={`text-slate-200 transition-all ${showReminderPicker ? 'rotate-90 text-[#f425f4]' : ''}`} />
              </div>
            </div>

            {showReminderPicker && (
              <div className="bg-slate-50/50 p-4 flex flex-wrap gap-2 justify-center border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {[5, 10, 15, 30, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => {
                      updateSetting('defaultReminder', min);
                      setShowReminderPicker(false);
                    }}
                    className={`h-12 w-16 flex items-center justify-center rounded-2xl text-xs font-black transition-all transform active:scale-90 ${settings.defaultReminder === min ? 'bg-[#f425f4] text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-500 border border-slate-100 hover:border-[#f425f4]/30'}`}
                  >
                    {min}M
                  </button>
                ))}
              </div>
            )}

            {/* Morning Summary */}
            <div className="flex items-center justify-between p-5 border-b border-slate-50 relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                  <Sun size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Résumé du matin</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm text-[#f425f4] font-black">{settings.morningSummaryTime}</span>
                    <Edit2 size={10} className="text-slate-300" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="time" 
                  className="absolute inset-x-0 top-0 bottom-0 opacity-0 cursor-pointer z-10 w-[75%]"
                  value={settings.morningSummaryTime}
                  onChange={(e) => updateSetting('morningSummaryTime', e.target.value)}
                />
                <label className="relative flex h-[34px] w-[56px] cursor-pointer items-center rounded-full p-1 transition-all duration-300 z-20" style={{ backgroundColor: settings.morningSummaryEnabled ? '#f425f4' : '#e2e8f0' }}>
                  <div className={`h-[26px] w-[26px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-spring ${settings.morningSummaryEnabled ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
                  <input type="checkbox" className="invisible absolute" checked={settings.morningSummaryEnabled} onChange={(e) => updateSetting('morningSummaryEnabled', e.target.checked)} />
                </label>
              </div>
            </div>

            {/* Evening Summary */}
            <div className="flex items-center justify-between p-5 relative overflow-hidden group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner group-hover:-rotate-12 transition-transform">
                  <Moon size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Bilan du soir</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm text-[#f425f4] font-black">{settings.eveningSummaryTime}</span>
                    <Edit2 size={10} className="text-slate-300" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="time" 
                  className="absolute inset-x-0 top-0 bottom-0 opacity-0 cursor-pointer z-10 w-[75%]"
                  value={settings.eveningSummaryTime}
                  onChange={(e) => updateSetting('eveningSummaryTime', e.target.value)}
                />
                <label className="relative flex h-[34px] w-[56px] cursor-pointer items-center rounded-full p-1 transition-all duration-300 z-20" style={{ backgroundColor: settings.eveningSummaryEnabled ? '#f425f4' : '#e2e8f0' }}>
                  <div className={`h-[26px] w-[26px] rounded-full bg-white shadow-md transform transition-transform duration-300 ease-spring ${settings.eveningSummaryEnabled ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
                  <input type="checkbox" className="invisible absolute" checked={settings.eveningSummaryEnabled} onChange={(e) => updateSetting('eveningSummaryEnabled', e.target.checked)} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 mb-20">
           <div className="flex items-center justify-between px-4 mb-4">
             <h3 className="text-[#f425f4] font-black text-[10px] uppercase tracking-[0.2em] mt-2">Partage & Équipe</h3>
             <span className="text-[10px] bg-[#f425f4] text-white px-2.5 py-1 rounded-full font-black tracking-tighter shadow-sm">NEW</span>
           </div>
           <Link href="/family" className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm p-5 flex items-center justify-between group hover:border-[#f425f4]/30 transition-all cursor-pointer">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 text-[#f425f4] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                 <UserPlus size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="font-bold text-slate-800">Mon Foyer partagé</span>
                 <span className="text-xs text-slate-500 mt-1">Gérer les membres et inviter</span>
               </div>
             </div>
             <ChevronRight size={20} className="text-slate-300 group-hover:text-[#f425f4] group-hover:translate-x-1 transition-all" />
           </Link>
        </section>
      </main>

      <BottomNav />
      <style jsx global>{`
        .ease-spring {
          transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </>
  );
}
