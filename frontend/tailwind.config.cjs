// frontend/tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Define custom colors for different aspects of the theme
      colors: {
        // Primary theme colors (dark theme as requested)
        'theme-background': {
          DEFAULT: '#0f172a', // slate-900 - main bg gradient start
          'primary': '#0f172a', // slate-900
          'secondary': '#1e293b', // slate-800 - for surfaces like table headers, maybe inputs
          'surface': '#1e293b', // slate-800 - for surfaces like table rows bg-white/5
          'card': '#1e293b',    // slate-800 - for card backgrounds like bg-gray-800/50
        },
        'theme-text': {
          DEFAULT: '#f1f5f9', // slate-100 - main text color
          'primary': '#f1f5f9', // slate-100
          'secondary': '#94a3b8', // slate-400 - for less important text like placeholders
          'muted': '#64748b',  // slate-500 - for muted text
        },
        'theme-border': {
          DEFAULT: '#334155', // slate-700 - for borders like border-gray-700
          'light': '#475569', // slate-600
        },
        // Primary and secondary action colors (keeping existing ones like blue/cyan)
        'theme-primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
          700: '#1d4ed8', // blue-700
        },
        'theme-secondary': {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4', // cyan-500
          600: '#0891b2', // cyan-600
          700: '#0e7490', // cyan-700
        },
        'theme-accent': {
          400: '#f59e0b', // amber-500 (from gradient in titles)
          500: '#f59e0b', // amber-500
        },
        // Keeping original slate/grays for compatibility if needed
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
      // Optional: Define gradients used in your theme
      // backgroundImage: {
      //   'theme-gradient-main': 'linear-gradient(to bottom right, theme(colors.theme-background.primary), theme(colors.theme-background.secondary), theme(colors.theme-background.DEFAULT))',
      //   'theme-gradient-title': 'linear-gradient(to right, theme(colors.theme-accent.400), theme(colors.theme-primary.500))',
      // }
    },
  },
  plugins: [],
};
