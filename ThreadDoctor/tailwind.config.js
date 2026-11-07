/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0B0D12',
          panel: '#121620',
          raised: '#171C28',
          hover: '#1E2533',
        },
        border: {
          subtle: '#252B38',
          DEFAULT: '#252B38',
          strong: '#333B4D',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C4FF0',
          muted: '#5B3DA8',
          soft: '#2A1F4A',
        },
        success: {
          DEFAULT: '#34D399',
          muted: '#1F6B54',
        },
        warning: {
          DEFAULT: '#FBBF24',
          muted: '#7A5A12',
        },
        danger: {
          DEFAULT: '#F87171',
          muted: '#7A2A2A',
        },
        muted: {
          DEFAULT: '#7B8499',
          light: '#9AA4BD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(139,92,246,0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(139,92,246,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(139,92,246,0)' },
        },
        dash: {
          to: { strokeDashoffset: '-20' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.5s infinite',
        dash: 'dash 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
