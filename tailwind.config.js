/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
    },
  },
  plugins: [],
}
