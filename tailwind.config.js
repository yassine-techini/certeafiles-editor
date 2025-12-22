/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Linear-style theme colors
        theme: {
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'bg-elevated': 'var(--bg-elevated)',
          'bg-hover': 'var(--bg-hover)',
          'bg-active': 'var(--bg-active)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          'text-muted': 'var(--text-muted)',
          'border-subtle': 'var(--border-subtle)',
          'border-default': 'var(--border-default)',
          'border-strong': 'var(--border-strong)',
        },
        // Accent colors (Linear purple)
        accent: {
          DEFAULT: '#5e5ce6',
          primary: '#5e5ce6',
          secondary: '#8b5cf6',
          tertiary: '#a78bfa',
          50: 'rgba(94, 92, 230, 0.05)',
          100: 'rgba(94, 92, 230, 0.1)',
          200: 'rgba(94, 92, 230, 0.2)',
          300: 'rgba(94, 92, 230, 0.3)',
          400: 'rgba(94, 92, 230, 0.4)',
          500: '#5e5ce6',
          600: '#4f4dd4',
          700: '#3f3dc2',
        },
        // Dark theme backgrounds
        dark: {
          900: '#0d0d0d',
          800: '#1a1a1a',
          700: '#262626',
          600: '#2a2a2a',
          500: '#333333',
          400: '#3d3d3d',
          300: '#525252',
          200: '#6b6b6b',
          100: '#a1a1a1',
        },
        // Slot type colors per constitution
        slot: {
          'dynamic-content': '#3B82F6', // Blue
          'at-fetcher': '#8B5CF6',      // Violet
          'donnee': '#22C55E',          // Green
          'ancre': '#F59E0B',           // Amber
          'section-speciale': '#EC4899', // Pink
          'commentaire': '#EF4444',     // Red
        },
        // Comment type colors
        comment: {
          remark: '#6B7280',
          question: '#3B82F6',
          suggestion: '#22C55E',
          correction: '#F59E0B',
          validation: '#10B981',
          blocker: '#EF4444',
        },
      },
      spacing: {
        // A4 dimensions at 96 DPI
        'a4-width': '794px',
        'a4-height': '1123px',
        'a4-landscape-width': '1123px',
        'a4-landscape-height': '794px',
        // Margins
        'folio-panel': '200px',
        'comment-panel': '320px',
      },
      fontFamily: {
        editor: ['Inter', 'system-ui', 'sans-serif'],
        document: ['Times New Roman', 'serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(94, 92, 230, 0.3)',
        'glow-lg': '0 0 30px rgba(94, 92, 230, 0.5)',
        'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'dark-lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'dark-xl': '0 20px 60px rgba(0, 0, 0, 0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-in-up': 'fadeInUp 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(94, 92, 230, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(94, 92, 230, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
