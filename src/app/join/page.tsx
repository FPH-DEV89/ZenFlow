'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Users, Loader2, CheckCircle2 } from 'lucide-react';

function JoinContent() {
  const searchParams = useSearchParams();
  const code = searchParams?.get('code');
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'confirm' | 'joined' | 'error'>('loading');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    checkAuthAndGroup();
  }, [code]);

  const checkAuthAndGroup = async () => {
    if (!code) {
      setStatus('error');
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Si non connecté, on redirige vers le login avec l'intention de rejoindre juste après (si on avait codé cette logique complète)
      // Pour faire simple ici on redirige et on espère qu'ils reviendront sur le lien, ou on force le login.
      router.push('/login');
      return;
    }

    setUserId(user.id);

    // On montre directement l'écran de confirmation car récupérer le nom de la maison nécessiterait de contourner le RLS en lecture aussi
    setStatus('confirm');
  };

  const handleJoin = async () => {
    setStatus('loading');
    
    try {
      const res = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: code, userId })
      });

      if (res.ok) {
        setStatus('joined');
        setTimeout(() => {
          router.push('/family');
        }, 2000);
      } else {
         setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <Loader2 className="animate-spin text-[#f425f4] mx-auto" size={48} />;
  }

  if (status === 'error') {
     return <div className="text-center text-rose-500 font-bold">Lien d'invitation invalide ou expiré... Assurez-vous d'avoir cliqué sur le bon lien.</div>;
  }

  if (status === 'joined') {
     return (
       <div className="text-center flex flex-col items-center py-6">
         <CheckCircle2 size={64} className="text-emerald-500 mb-4 animate-in zoom-in" />
         <h2 className="text-2xl font-black text-slate-900">C'est fait !</h2>
         <p className="text-slate-500 mt-2 font-medium">Vous avez rejoint le foyer avec succès.</p>
       </div>
     );
  }

  return (
    <div className="text-center flex flex-col items-center w-full max-w-sm">
      <div className="w-24 h-24 bg-gradient-to-br from-fuchsia-100 to-purple-200 rounded-[2rem] flex items-center justify-center text-[#f425f4] mb-8 shadow-inner shadow-white/50 transform -rotate-3">
        <Users size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-3">Rejoindre le foyer</h2>
      <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm">
        Vous avez été invité(e) à partager un foyer d'organisation. Les tâches crées pour ce foyer seront visibles et modifiables par tout le monde.
      </p>
      
      <button 
         onClick={handleJoin}
         className="w-full bg-[#f425f4] text-white font-black text-sm tracking-widest uppercase rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-[#d820d8] active:scale-95 transition-all shadow-xl shadow-[#f425f4]/30"
      >
        ACCEPTER L'INVITATION
      </button>
      <button 
         onClick={() => router.push('/')}
         className="w-full mt-6 text-slate-400 font-bold text-[10px] tracking-widest uppercase hover:text-slate-600 transition-colors"
      >
        NON, RETOURNER À L'ACCUEIL
      </button>
    </div>
  );
}

export default function JoinPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#fcfafc] to-purple-50/50">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-purple-900/5 border border-white">
        <Suspense fallback={<Loader2 className="animate-spin text-[#f425f4] mx-auto" size={48} />}>
          <JoinContent />
        </Suspense>
      </div>
    </main>
  );
}
