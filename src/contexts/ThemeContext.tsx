/**
 * Theme Context - Multi-theme system for CerteaFiles Editor
 * Supports: Amethyst, Sapphire, Aqua, Emerald themes (each with dark/light variants)
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// Theme types
export type ThemeName = 'amethyst' | 'sapphire' | 'aqua' | 'emerald';
export type ThemeMode = 'dark' | 'light';

export interface ThemeConfig {
  name: ThemeName;
  mode: ThemeMode;
  label: string;
  description: string;
  accentColor: string;
}

// Available themes configuration
export const THEMES: Record<ThemeName, { label: string; description: string; accentColor: string }> = {
  amethyst: {
    label: 'Améthyste',
    description: 'Style moderne avec accents violets',
    accentColor: '#5e5ce6',
  },
  sapphire: {
    label: 'Saphir',
    description: 'Design épuré avec accents bleus',
    accentColor: '#1a73e8',
  },
  aqua: {
    label: 'Aqua',
    description: 'Minimaliste avec accents turquoise',
    accentColor: '#2eaadc',
  },
  emerald: {
    label: 'Émeraude',
    description: 'Professionnel avec accents verts',
    accentColor: '#2da44e',
  },
};

// Theme context type
interface ThemeContextType {
  themeName: ThemeName;
  themeMode: ThemeMode;
  themeKey: string;
  setThemeName: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  currentTheme: ThemeConfig;
  availableThemes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key
const THEME_STORAGE_KEY = 'certeafiles-theme';

interface StoredTheme {
  name: ThemeName;
  mode: ThemeMode;
}

// Get initial theme from localStorage or system preference
function getInitialTheme(): StoredTheme {
  if (typeof window === 'undefined') {
    return { name: 'amethyst', mode: 'dark' };
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredTheme;
      // Migrate old theme names to new names
      const nameMap: Record<string, ThemeName> = {
        'linear': 'amethyst',
        'google': 'sapphire',
        'notion': 'aqua',
        'github': 'emerald',
      };
      const migratedName = nameMap[parsed.name] || parsed.name;
      if (migratedName && parsed.mode && migratedName in THEMES) {
        return { name: migratedName as ThemeName, mode: parsed.mode };
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Check system preference for dark/light mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { name: 'amethyst', mode: prefersDark ? 'dark' : 'light' };
}

// Apply theme to document
function applyTheme(name: ThemeName, mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  const themeKey = `${name}-${mode}`;
  window.document.documentElement.setAttribute('data-theme', themeKey);

  // Also set color-scheme for native elements
  window.document.documentElement.style.colorScheme = mode;
}

// Theme Provider component
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme,
  defaultMode
}: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    const initial = getInitialTheme();
    return defaultTheme || initial.name;
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const initial = getInitialTheme();
    return defaultMode || initial.mode;
  });

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(themeName, themeMode);

    // Save to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ name: themeName, mode: themeMode }));
    } catch {
      // Ignore storage errors
    }
  }, [themeName, themeMode]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeModeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeModeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const themeKey = `${themeName}-${themeMode}`;

  const currentTheme: ThemeConfig = {
    name: themeName,
    mode: themeMode,
    ...THEMES[themeName],
  };

  const value: ThemeContextType = {
    themeName,
    themeMode,
    themeKey,
    setThemeName,
    setThemeMode,
    toggleThemeMode,
    currentTheme,
    availableThemes: THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export default theme for initialization before React hydration
export function initializeTheme(): void {
  const { name, mode } = getInitialTheme();
  applyTheme(name, mode);
}
