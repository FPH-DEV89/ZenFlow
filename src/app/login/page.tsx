'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError(null);
        // Show success message for registration
        alert('Vérifiez votre email pour confirmer votre compte !');
        setIsLogin(true);
        setIsLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f5f8] px-6 justify-center">
      {/* Logo & Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--theme-primary)] to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--theme-primary)]/30 rotate-12">
          <span className="text-white text-3xl font-black -rotate-12">Z</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">ZenFlow</h1>
        <p className="text-slate-500 mt-2 text-sm">Votre allié sérénité au quotidien</p>
      </motion.div>

      {/* Toggle Login / Register */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex bg-white rounded-2xl p-1.5 mb-8 shadow-sm border border-slate-100"
      >
        <button
          onClick={() => { setIsLogin(true); setError(null); }}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
            isLogin 
              ? "bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20" 
              : "text-slate-400"
          )}
        >
          Connexion
        </button>
        <button
          onClick={() => { setIsLogin(false); setError(null); }}
          className={cn(
            "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
            !isLogin 
              ? "bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/20" 
              : "text-slate-400"
          )}
        >
          Inscription
        </button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3"
        >
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Email */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Mail size={20} />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Adresse email"
            className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-slate-100 shadow-sm text-sm font-medium placeholder:text-slate-300 outline-none focus:border-[var(--theme-primary)]/50 focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-all"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock size={20} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full bg-white pl-12 pr-12 py-4 rounded-2xl border border-slate-100 shadow-sm text-sm font-medium placeholder:text-slate-300 outline-none focus:border-[var(--theme-primary)]/50 focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-all"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Forgot Password */}
        {isLogin && (
          <div className="text-right">
            <button type="button" className="text-[var(--theme-primary)] text-xs font-semibold">
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={isLoading || !email.trim() || !password.trim()}
          type="submit"
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all",
            email.trim() && password.trim() && !isLoading
              ? "bg-[var(--theme-primary)] shadow-[var(--theme-primary)]/30"
              : "bg-slate-300 shadow-none"
          )}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{isLogin ? 'Se connecter' : 'Créer mon compte'}</span>
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-slate-200"></div>
        <span className="text-xs text-slate-400 font-medium">ou continuer avec</span>
        <div className="flex-1 h-px bg-slate-200"></div>
      </div>

      {/* Social Login */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full bg-white py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center gap-3 font-semibold text-sm text-slate-700 hover:border-slate-200 transition-all"
      >
        <Chrome size={20} className="text-[var(--theme-primary)]" />
        <span>Google</span>
      </motion.button>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-8">
        En continuant, vous acceptez nos{' '}
        <span className="text-[var(--theme-primary)] font-medium">Conditions</span> et{' '}
        <span className="text-[var(--theme-primary)] font-medium">Politique de confidentialité</span>
      </p>
    </div>
  );
}
