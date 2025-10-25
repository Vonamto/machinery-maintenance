// frontend/tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Define custom colors for different aspects of the theme
      colors: {
        // --- LIGHT THEME COLORS ---
        // Primary theme colors (Modern Light Theme)
        'theme-background': {
          DEFAULT: '#f8fafc', // slate-50 - main bg, very light
          'primary': '#f8fafc', // slate-50
          'secondary': '#f1f5f9', // slate-100 - slightly darker for cards, table headers
          'surface': '#ffffff', // white - for table rows, surfaces needing high contrast
          'card': '#f1f5f9',    // slate-100 - for card backgrounds
        },
        'theme-text': {
          DEFAULT: '#0f172a', // slate-900 - main text color, very dark
          'primary': '#0f172a', // slate-900
          'secondary': '#64748b', // slate-500 - for less important text like placeholders, labels
          'muted': '#94a3b8',  // slate-400 - for muted/disabled text
        },
        'theme-border': {
          DEFAULT: '#cbd5e1', // slate-300 - standard border color
          'light': '#e2e8f0', // slate-200 - lighter border
        },
        // Primary action color (keeping blue, but adjusting shades for light theme)
        'theme-primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // blue-500 - vibrant primary
          600: '#2563eb', // blue-600 - hover state
          700: '#1d4ed8', // blue-700 - active/strong state
        },
        // Secondary action color (cyan adjusted for vibrancy on light)
        'theme-secondary': {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4', // cyan-500
          600: '#0891b2', // cyan-600
          700: '#0e7490', // cyan-700
        },
        // Accent color (keeping amber, good contrast on light)
        'theme-accent': {
          400: '#fbbf24', // amber-400 - slightly lighter amber for accents/titles
          500: '#f59e0b', // amber-500
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
      // Optional: Define gradients used in your theme (using new light theme colors)
      // backgroundImage: {
      //   'theme-gradient-main': 'linear-gradient(to bottom right, theme(colors.theme-background.primary), theme(colors.theme-background.secondary))',
      //   'theme-gradient-title': 'linear-gradient(to right, theme(colors.theme-accent.400), theme(colors.theme-primary.500))',
      // }
    },
  },
  plugins: [],
};
