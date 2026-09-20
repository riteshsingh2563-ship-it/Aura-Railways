import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          dark: '#030712',
          surface: '#0a0f1d',
          card: '#0f172a',
          glass: 'rgba(15, 23, 42, 0.75)',
          'glass-light': 'rgba(30, 41, 59, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-highlight': 'rgba(56, 189, 248, 0.3)',
          cyan: '#38bdf8',
          blue: '#3b82f6',
          teal: '#14b8a6',
          accent: '#06b6d4',
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
          muted: '#94a3b8',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
