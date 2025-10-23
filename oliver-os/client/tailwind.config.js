/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#00FFFF',
        'cyber-magenta': '#FF00FF',
        'cyber-blue': '#4A00FF',
        'cyber-purple': '#B800FF',
        'cyber-green': '#00FF00',
        'neon-pink': '#FF1493',
        'electric-blue': '#00D4FF',
        'neon-orange': '#FF6600',
        'dark-base': '#000000',
        'dark-gradient': '#0A0A1A',
        'panel-dark': '#0D0D15',
        'text-white': '#FFFFFF',
        'text-gray': '#CCCCCC',
        'glow-white': '#FFFFFF',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scanlines': 'scanlines 0.1s linear infinite',
        'data-flow': 'data-flow 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px currentColor' },
          '50%': { boxShadow: '0 0 40px currentColor' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scanlines': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'data-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}