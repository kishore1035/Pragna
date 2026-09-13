/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        background: { DEFAULT: 'var(--background)' },
        foreground: { DEFAULT: 'var(--foreground)' },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          50: '#f7efd7',
          100: '#eedca0',
          400: '#e5c76b',
          500: '#d4af37',
          600: '#c39a20',
          700: '#b8860b',
        },
        gold: {
          50: '#fbf8ed',
          100: '#f7efd7',
          200: '#eedca0',
          300: '#e5c76b',
          400: '#ddb945',
          500: '#d4af37',
          600: '#c39a20',
          700: '#b8860b',
          800: '#926a0b',
          900: '#75540e',
        },
        surface: {
          DEFAULT: '#141414',
          subtle: '#1a1a1a',
          muted: '#222222',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        border: { DEFAULT: 'var(--border)' },
        input: { DEFAULT: 'var(--input)' },
        ring: { DEFAULT: 'var(--ring)' },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          border: 'var(--sidebar-border)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
        },
        'user-bubble': { DEFAULT: 'var(--user-bubble)' },
        'code-block': { DEFAULT: 'var(--code-bg)' },
      },
      boxShadow: {
        'premium-sm': '0 2px 8px rgba(0,0,0,0.28)',
        'premium-md': '0 6px 18px rgba(0,0,0,0.34)',
        'premium-lg': '0 12px 28px rgba(0,0,0,0.42)',
        'premium-hover': '0 20px 32px rgba(0,0,0,0.5)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.25)',
        'gold-sm': '0 2px 10px rgba(212, 175, 55, 0.15)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) - 0.25rem)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 0.25rem)',
        '2xl': 'calc(var(--radius) + 0.5rem)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Courier New', 'monospace'],
      },
      maxWidth: {
        'chat': '48rem',
      },
      animation: {
        'blink': 'blink 0.8s ease-in-out infinite',
        'thinking': 'thinking-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};