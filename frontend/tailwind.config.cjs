// frontend/tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Define custom colors for different aspects of the theme
      colors: {
        // --- SOFTER / DARKER LIGHT THEME COLORS ---
        // Primary theme colors (Softer/Darker Light Theme)
        'theme-background': {
          DEFAULT: '#f1f5f9', // slate-100 - main bg, slightly darker than before
          'primary': '#f1f5f9', // slate-100
          'secondary': '#e2e8f0', // slate-200 - for cards, table headers
          'surface': '#f8fafc', // slate-50 - for table rows, surfaces needing high contrast *against* slate-100/200
          'card': '#e2e8f0',    // slate-200 - for card backgrounds
        },
        'theme-text': {
          DEFAULT: '#1e293b', // slate-800 - main text color, slightly darker than before
          'primary': '#1e293b', // slate-800
          'secondary': '#64748b', // slate-500 - for less important text like placeholders, labels (kept the same)
          'muted': '#94a3b8',  // slate-400 - for muted/disabled text (kept the same)
        },
        'theme-border': {
          DEFAULT: '#cbd5e1', // slate-300 - standard border color (kept the same)
          'light': '#e2e8f0', // slate-200 - lighter border (kept the same)
        },
        // Primary action color (keeping blue, but adjusting shades for soft theme)
        'theme-primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // blue-500 - vibrant primary (kept the same)
          600: '#2563eb', // blue-600 - hover state (kept the same)
          700: '#1d4ed8', // blue-700 - active/strong state (kept the same)
        },
        // Secondary action color (cyan adjusted for vibrancy on soft)
        'theme-secondary': {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4', // cyan-500 (kept the same)
          600: '#0891b2', // cyan-600 (kept the same)
          700: '#0e7490', // cyan-700 (kept the same)
        },
        // Accent color (keeping amber, good contrast on soft)
        'theme-accent': {
          400: '#fbbf24', // amber-400 - slightly lighter amber for accents/titles (kept the same)
          500: '#f59e0b', // amber-500 (kept the same)
        },
        // --- Keeping original slate/grays for compatibility if needed ---
        // slate: {
        //   50: '#f8fafc',
        //   100: '#f1f5f9',
        //   200: '#e2e8f0',
        //   300: '#cbd5e1',
        //   400: '#94a3b8',
        //   500: '#64748b',
        //   600: '#475569',
        //   700: '#334155',
        //   800: '#1e293b',
        //   900: '#0f172a',
        // },
      },
      // Optional: Define gradients used in your theme (using new soft theme colors)
      // backgroundImage: {
      //   'theme-gradient-main': 'linear-gradient(to bottom right, theme(colors.theme-background.primary), theme(colors.theme-background.secondary))',
      //   'theme-gradient-title': 'linear-gradient(to right, theme(colors.theme-accent.400), theme(colors.theme-primary.500))',
      // }
    },
  },
  plugins: [],
};
