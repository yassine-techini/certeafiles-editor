/**
 * Theme Selector Component
 * Dropdown menu for selecting design themes and dark/light mode
 */

import { useState, useRef, useEffect } from 'react';
import { Palette, Sun, Moon, Check, ChevronDown } from 'lucide-react';
import { useTheme, type ThemeName, THEMES } from '../../contexts/ThemeContext';

interface ThemeSelectorProps {
  compact?: boolean;
}

export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { themeName, themeMode, setThemeName, toggleThemeMode, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const themeEntries = Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][];

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg
            bg-theme-bg-tertiary hover:bg-theme-bg-hover
            border border-theme-border-default
            transition-all duration-200"
          title="Changer de thème"
        >
          <Palette className="w-4 h-4 text-theme-text-secondary" />
          <div
            className="w-3 h-3 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: currentTheme.accentColor }}
          />
          <span className="text-xs font-medium text-theme-text-secondary hidden sm:inline">
            {currentTheme.label}
          </span>
          <ChevronDown className={`w-3 h-3 text-theme-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <ThemeDropdown
            themeEntries={themeEntries}
            themeName={themeName}
            themeMode={themeMode}
            setThemeName={setThemeName}
            toggleThemeMode={toggleThemeMode}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg
          bg-gradient-to-r from-indigo-500 to-purple-600
          hover:from-indigo-600 hover:to-purple-700
          text-white shadow-lg shadow-indigo-500/30
          transition-all duration-200 min-w-[180px]"
      >
        <Palette className="w-5 h-5 text-white/90" />
        <div className="flex flex-col items-start flex-1">
          <span className="text-sm font-medium text-white">
            {currentTheme.label}
          </span>
          <span className="text-xs text-white/70 capitalize">
            {themeMode} mode
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ThemeDropdown
          themeEntries={themeEntries}
          themeName={themeName}
          themeMode={themeMode}
          setThemeName={setThemeName}
          toggleThemeMode={toggleThemeMode}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface ThemeDropdownProps {
  themeEntries: [ThemeName, typeof THEMES[ThemeName]][];
  themeName: ThemeName;
  themeMode: 'dark' | 'light';
  setThemeName: (name: ThemeName) => void;
  toggleThemeMode: () => void;
  onClose: () => void;
}

function ThemeDropdown({
  themeEntries,
  themeName,
  themeMode,
  setThemeName,
  toggleThemeMode,
  onClose,
}: ThemeDropdownProps) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-72
        bg-theme-bg-elevated border border-theme-border-default
        rounded-xl shadow-lg overflow-hidden z-50
        animate-fade-in"
    >
      {/* Mode Toggle */}
      <div className="p-3 border-b border-theme-border-subtle">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-theme-text-secondary">Mode</span>
          <button
            onClick={toggleThemeMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-theme-bg-tertiary hover:bg-theme-bg-hover
              transition-all duration-200"
          >
            {themeMode === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-theme-text-secondary" />
                <span className="text-sm text-theme-text-primary">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-theme-text-primary">Light</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Theme Options */}
      <div className="p-2">
        <div className="text-xs font-medium text-theme-text-tertiary uppercase tracking-wider px-2 py-1.5">
          Themes
        </div>
        {themeEntries.map(([name, config]) => (
          <button
            key={name}
            onClick={() => {
              setThemeName(name);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${themeName === name
                ? 'bg-theme-bg-active'
                : 'hover:bg-theme-bg-hover'
              }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex-shrink-0 ${themeName === name ? 'ring-2 ring-offset-2 ring-offset-theme-bg-elevated' : ''}`}
              style={{
                backgroundColor: config.accentColor,
                boxShadow: themeName === name ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${config.accentColor}` : 'none',
              }}
            />
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-medium text-theme-text-primary">
                {config.label}
              </span>
              <span className="text-xs text-theme-text-tertiary truncate w-full text-left">
                {config.description}
              </span>
            </div>
            {themeName === name && (
              <Check className="w-4 h-4 text-accent-primary flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-theme-border-subtle bg-theme-bg-tertiary/50">
        <div className="flex items-center gap-2 text-xs text-theme-text-tertiary">
          <Palette className="w-3 h-3" />
          <span>Theme preference saved locally</span>
        </div>
      </div>
    </div>
  );
}

// Compact theme toggle button (for header)
export function ThemeModeToggle() {
  const { themeMode, toggleThemeMode } = useTheme();

  return (
    <button
      onClick={toggleThemeMode}
      className="p-2 rounded-lg hover:bg-theme-bg-hover transition-colors"
      title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {themeMode === 'dark' ? (
        <Sun className="w-4 h-4 text-theme-text-secondary hover:text-theme-text-primary" />
      ) : (
        <Moon className="w-4 h-4 text-theme-text-secondary hover:text-theme-text-primary" />
      )}
    </button>
  );
}

export default ThemeSelector;
