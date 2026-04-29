/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef8ff',
          100: '#d9eeff',
          200: '#bce2ff',
          300: '#8ed1ff',
          400: '#59b7fd',
          500: '#3b98f9',
          600: '#1f79ee',
          700: '#1862db',
          800: '#1a4fb1',
          900: '#1c448b',
          950: '#152b55',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        severity: {
          low:    '#10b981',
          medium: '#f59e0b',
          high:   '#ef4444',
        },
        surface: {
          DEFAULT: '#0d1117',
          card:    '#161b22',
          raised:  '#21262d',
          border:  '#30363d',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 152, 249, 0.25), transparent)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
      },
      boxShadow: {
        'glow-blue':   '0 0 30px rgba(59, 152, 249, 0.35)',
        'glow-cyan':   '0 0 20px rgba(34, 211, 238, 0.3)',
        'glow-red':    '0 0 20px rgba(239, 68, 68, 0.35)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.3)',
      },
      animation: {
        'scan-line':     'scanLine 2s linear infinite',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'shimmer':       'shimmer 2s infinite',
        'ping-slow':     'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        scanLine: {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
