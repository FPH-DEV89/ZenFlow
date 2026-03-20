'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, UserPlus, Copy, Home as HomeIcon, CheckCircle2, Share2 } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { createGroup, getUserGroups, Group } from '@/lib/db';
import { createClient } from '@/lib/supabase';

export default function FamilyPage() {
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const userGroups = await getUserGroups();
    setGroups(userGroups);
    
    if (userGroups.length > 0) {
      // Pour ce MVP, on prend le premier groupe de l'utilisateur (généralement son foyer)
      const groupId = userGroups[0].id;
      const supabase = createClient();
      
      // On récupère les membres. Dans un cas réel, il faudrait aussi récupérer les emails depuis auth.users (via un RPC ou via l'API Admin admin)
      // Mais on peut au moins avoir le nombre et le rôle
      const { data } = await supabase.from('group_members').select('*').eq('group_id', groupId);
      setMembers(data || []);
    }
    
    setIsLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setIsCreating(true);
    const newGroup = await createGroup(groupName);
    if (newGroup) {
      setGroups([...groups, newGroup]);
      await fetchData();
    }
    setIsCreating(false);
    setGroupName('');
  };

  const copyMagicLink = (groupId: string) => {
    const link = `${window.location.origin}/join?code=${groupId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(''), 3000);
    
    // Si l'API Share native est dispo (mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins mon foyer sur ZenFlow',
        text: "Clique sur ce lien magique pour qu'on partage nos tâches !",
        url: link,
      }).catch(console.error);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl px-4 py-6 flex items-center justify-between border-b border-[var(--theme-primary)]/5">
        <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-[var(--theme-primary)]/10 transition-all active:scale-90">
          <ArrowLeft size={24} className="text-slate-900" />
        </Link>
        <h1 className="text-xl font-black tracking-tight text-center flex-1 bg-gradient-to-r from-slate-900 to-[var(--theme-primary)] bg-clip-text text-transparent italic">Mon Foyer</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 bg-[#fcfafc] px-4 py-6">
        
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[var(--theme-primary)]/5 text-center max-w-sm mx-auto mt-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[var(--theme-primary)]/10 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <HomeIcon size={40} className="text-[var(--theme-primary)]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Créer un Foyer</h2>
            <p className="text-slate-500 text-sm mb-8">Partagez vos tâches avec votre famille ou vos colocataires pour réduire la charge mentale à plusieurs.</p>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input 
                type="text" 
                placeholder="Nom du foyer (ex: Maison 🏡)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-primary)]/50 focus:bg-white transition-all text-center"
                required
              />
              <button 
                type="submit" 
                disabled={isCreating || !groupName.trim()}
                className="w-full bg-[var(--theme-primary)] text-white font-black text-sm tracking-widest uppercase rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-[#d820d8] active:scale-95 transition-all shadow-xl shadow-[var(--theme-primary)]/30 disabled:opacity-50 disabled:active:scale-100"
              >
                {isCreating ? 'Création...' : (
                  <>
                    CRÉER <UserPlus size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group details (taking the first group as primary) */}
            <div className="bg-gradient-to-br from-[var(--theme-primary)] to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 opacity-10">
                 <Users size={150} />
               </div>
               <div className="relative z-10 w-full">
                  <span className="text-xs font-black tracking-widest opacity-80 uppercase">Foyer Partagé</span>
                  <h2 className="text-3xl font-black mt-1 mb-6 truncate">{groups[0].name}</h2>
                  
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md mb-6 border border-white/20">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">Membres ({members.length})</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {members.map((member, i) => (
                           <div key={i} className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-white/40 flex items-center justify-center text-[8px] uppercase">{member.role === 'admin' ? '👑' : '👤'}</span>
                              Membre
                           </div>
                        ))}
                     </div>
                  </div>

                  <button 
                    onClick={() => copyMagicLink(groups[0].id)}
                    className="w-full bg-white text-[var(--theme-primary)] font-black text-sm tracking-widest uppercase rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-lg shadow-black/10"
                  >
                    {copiedLink ? (
                       <>COPIÉ <CheckCircle2 size={18} /></>
                    ) : (
                       <>INVITER <Share2 size={18} /></>
                    )}
                  </button>
                  <p className="text-[10px] text-center mt-3 opacity-60 font-medium">Partagez ce lien magique pour inviter vos proches.</p>
               </div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
               <h3 className="text-[var(--theme-primary)] font-black text-[10px] uppercase tracking-[0.2em] mb-4 opacity-50">Information</h3>
               <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  Désormais, lors de la création d'une tâche, vous pourrez choisir de la laisser **Personnelle** ou de l'attribuer au foyer **{groups[0].name}**.
               </p>
               <p className="text-sm font-medium text-slate-600 leading-relaxed mt-4">
                  Les tâches du foyer sont visibles, modifiables et cochables par tous les membres.
               </p>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  );
}
