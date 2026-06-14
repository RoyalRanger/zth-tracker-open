/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#030712',
          secondary: '#0a0f1e',
          card: '#0d1526',
        },
        cyan: {
          DEFAULT: '#00d4ff',
          dim: 'rgba(0,212,255,0.12)',
          glow: 'rgba(0,212,255,0.25)',
        },
        purple: {
          DEFAULT: '#a78bfa',
          dim: 'rgba(167,139,250,0.12)',
          glow: 'rgba(167,139,250,0.25)',
        },
        green: {
          DEFAULT: '#34d399',
          dim: 'rgba(52,211,153,0.12)',
          glow: 'rgba(52,211,153,0.25)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          cyan: 'rgba(0,212,255,0.2)',
          purple: 'rgba(167,139,250,0.2)',
          green: 'rgba(52,211,153,0.2)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
