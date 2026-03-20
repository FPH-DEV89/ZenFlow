'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 'fuchsia' | 'indigo' | 'emerald' | 'orange' | 'cyan' | 'rose';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  color: string;
  emoji: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'fuchsia', name: 'Fuchsia',  color: '#f425f4', emoji: '💜' },
  { id: 'indigo',  name: 'Indigo',   color: '#6366f1', emoji: '💙' },
  { id: 'emerald', name: 'Émeraude', color: '#10b981', emoji: '💚' },
  { id: 'orange',  name: 'Soleil',   color: '#f97316', emoji: '🧡' },
  { id: 'cyan',    name: 'Océan',    color: '#06b6d4', emoji: '🩵' },
  { id: 'rose',    name: 'Rose',     color: '#f43f5e', emoji: '❤️' },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  primaryColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'fuchsia',
  setTheme: () => {},
  primaryColor: '#f425f4',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('fuchsia');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('zenflow-theme') as ThemeId | null;
    if (saved && THEMES.some(t => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
    setMounted(true);
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem('zenflow-theme', id);
    document.documentElement.setAttribute('data-theme', id);
  };

  const primaryColor = THEMES.find(t => t.id === theme)?.color || '#f425f4';

  if (!mounted) {
    // Prevent flash: render children but with default fuchsia
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
