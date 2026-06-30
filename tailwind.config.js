/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        exia: {
          obsidian: 'var(--bg)',
          navy:     'var(--surface)',
          surface:  'var(--card)',
          card:     'var(--card-raised)',
          elevated: 'var(--elevated)',
          border:   'var(--border)',
          muted:    'var(--muted)',
          cyan:     'var(--accent-cyan)',
          'cyan-dim':  'var(--accent-cyan-dim)',
          green:    'var(--accent-green)',
          amber:    'var(--accent-amber)',
          red:      'var(--accent-red)',
          'red-dim':   'var(--accent-red)', // Fallback to accent-red
          'text-primary':   'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted':     'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(34,211,238,0.12), 0 0 40px rgba(34,211,238,0.04)',
        'glow-green':   '0 0 20px rgba(16,185,129,0.12), 0 0 40px rgba(16,185,129,0.04)',
        'glow-amber':   '0 0 20px rgba(245,158,11,0.12), 0 0 40px rgba(245,158,11,0.04)',
        'glow-red':     '0 0 20px rgba(244,63,94,0.12), 0 0 40px rgba(244,63,94,0.04)',
        'card':         '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-md':      '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        'card-lg':      '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.09)',
        'card-hover':   '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.10)',
        'sidebar':      '1px 0 0 rgba(255,255,255,0.04)',
        // Light mode shadows
        'card-light':       '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        'card-md-light':    '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        'sidebar-light':    '1px 0 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E\")",
        'grid-lines': "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      },
      backgroundSize: { 'grid': '48px 48px' },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 1.5s infinite linear',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'count-up':   'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        glowPulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        countUp: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
