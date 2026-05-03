import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Arena palette
        'arena-navy': {
          950: 'hsl(222, 47%, 5%)',
          900: 'hsl(222, 47%, 8%)',
          800: 'hsl(222, 44%, 12%)',
          700: 'hsl(222, 40%, 18%)',
          600: 'hsl(222, 36%, 26%)',
        },
        'arena-cyan': {
          DEFAULT: 'hsl(185, 95%, 55%)',
          glow: 'hsl(185, 95%, 65%)',
          dim: 'hsl(185, 70%, 40%)',
        },
        'arena-violet': {
          DEFAULT: 'hsl(265, 90%, 62%)',
          glow: 'hsl(265, 90%, 72%)',
          dim: 'hsl(265, 60%, 45%)',
        },
        'arena-rose': {
          DEFAULT: 'hsl(340, 90%, 60%)',
          glow: 'hsl(340, 90%, 70%)',
          dim: 'hsl(340, 60%, 45%)',
        },
        'arena-gold': {
          DEFAULT: 'hsl(40, 95%, 60%)',
          glow: 'hsl(40, 95%, 70%)',
        },

        // Agent colors
        'agent-devil': '#EF4444',
        'agent-optimist': '#10B981',
        'agent-analyst': '#3B82F6',
        'agent-mediator': '#8B5CF6',

        // CSS variable-based colors for shadcn/ui compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px hsla(185, 95%, 55%, 0.15), 0 0 60px hsla(185, 95%, 55%, 0.05)',
        'glow-violet': '0 0 20px hsla(265, 90%, 62%, 0.15), 0 0 60px hsla(265, 90%, 62%, 0.05)',
        'glow-rose': '0 0 20px hsla(340, 90%, 60%, 0.15), 0 0 60px hsla(340, 90%, 60%, 0.05)',
        'glow-gold': '0 0 20px hsla(40, 95%, 60%, 0.15), 0 0 60px hsla(40, 95%, 60%, 0.05)',
        'glass': '0 8px 32px hsla(0, 0%, 0%, 0.3)',
        'glass-lg': '0 16px 48px hsla(0, 0%, 0%, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'floatSlow 6s ease-in-out infinite',
        'float-delayed': 'floatSlow 6s ease-in-out 2s infinite',
        'glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'orbit': 'orbit 1.5s linear infinite',
        'orbit-reverse': 'orbitReverse 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.4s ease-out forwards',
        'border-glow': 'borderGlow 4s ease-in-out infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        orbit: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        orbitReverse: {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'hsla(185, 95%, 55%, 0.3)' },
          '33%': { borderColor: 'hsla(265, 90%, 62%, 0.3)' },
          '66%': { borderColor: 'hsla(340, 90%, 60%, 0.3)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config

// Made with Bob
