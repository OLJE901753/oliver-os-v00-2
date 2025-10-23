/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // CSS Variables for dynamic theming
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        // Blue Neon Theme Colors (inspired by the images)
        neon: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00D4FF', // Primary neon blue from images
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        electric: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00BFFF', // Electric blue
          600: '#0099CC',
          700: '#007399',
          800: '#005C73',
          900: '#004D5C',
        },
        holographic: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#A855F7', // Purple for holographic effects
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Keep existing colors for compatibility
        lime: {
          50: '#f0fff4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#32CD32',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00FFFF',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFA500',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-subtle': 'var(--gradient-subtle)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dot-pattern': 'radial-gradient(rgba(50, 205, 50, 0.1) 1px, transparent 1px)',
        'hero-pattern': 'linear-gradient(to bottom right, rgba(10, 10, 10, 0.9), rgba(18, 18, 18, 0.95))',
        'holographic': 'linear-gradient(45deg, rgba(50, 205, 50, 0.1), rgba(0, 255, 255, 0.1), rgba(50, 205, 50, 0.1))',
      },
      backgroundSize: {
        'dot-pattern': '20px 20px'
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
        'neon-lime': '0 0 20px rgba(50, 205, 50, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-amber': '0 0 20px rgba(255, 165, 0, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-electric': '0 0 20px rgba(0, 191, 255, 0.5)',
        'neon-holographic': '0 0 20px rgba(168, 85, 247, 0.5)',
        'holographic': '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 30px rgba(0, 191, 255, 0.1)',
        'wireframe': '0 0 15px rgba(0, 212, 255, 0.4), 0 0 30px rgba(0, 191, 255, 0.2)',
        'brain-glow': '0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(0, 191, 255, 0.3)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
        'blur-lg': 'blur(40px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'holographic': 'holographic 3s ease-in-out infinite',
        'liquid': 'liquid 4s ease-in-out infinite',
        'particle': 'particle 8s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(50, 205, 50, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(50, 205, 50, 0.8)' },
        },
        'neon-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(50, 205, 50, 0.5), 0 0 40px rgba(50, 205, 50, 0.3)',
            textShadow: '0 0 10px rgba(50, 205, 50, 0.8)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(50, 205, 50, 0.8), 0 0 60px rgba(50, 205, 50, 0.5)',
            textShadow: '0 0 20px rgba(50, 205, 50, 1)'
          },
        },
        holographic: {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
            filter: 'hue-rotate(0deg)'
          },
          '50%': { 
            backgroundPosition: '100% 50%',
            filter: 'hue-rotate(180deg)'
          },
        },
        liquid: {
          '0%, 100%': { 
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            transform: 'rotate(0deg)'
          },
          '50%': { 
            borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%',
            transform: 'rotate(180deg)'
          },
        },
        particle: {
          '0%': { 
            transform: 'translateY(100vh) translateX(0px)',
            opacity: '0'
          },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { 
            transform: 'translateY(-100vh) translateX(100px)',
            opacity: '0'
          },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        'slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' }
        },
        'scale-in': {
          'from': { transform: 'scale(0.95)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' }
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        orbitron: ['Orbitron', 'monospace'],
        futuristic: ['Orbitron', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
