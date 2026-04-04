/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background layers
        bg: {
          base: '#0f1117',
          card: '#1a1d27',
          hover: '#252836',
          active: '#2d3145',
        },
        // Market direction
        bull: {
          DEFAULT: '#22c55e',
          dim: '#16a34a',
          bg: 'rgba(34,197,94,0.08)',
        },
        bear: {
          DEFAULT: '#ef4444',
          dim: '#dc2626',
          bg: 'rgba(239,68,68,0.08)',
        },
        // UI accents
        accent: {
          DEFAULT: '#6366f1',
          dim: '#4f52c5',
          bg: 'rgba(99,102,241,0.1)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          bg: 'rgba(245,158,11,0.08)',
        },
        danger: {
          DEFAULT: '#dc2626',
          bg: 'rgba(220,38,38,0.08)',
        },
        // Text
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        // Borders
        border: {
          DEFAULT: '#2d3748',
          light: '#374151',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
