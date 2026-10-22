import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.25rem' }, screens: { '2xl': '1240px' } },
    extend: {
      colors: {
        cream: { DEFAULT: '#fbf6ee', 100: '#f4ebdc', 200: '#eadcc4' },
        ink: { DEFAULT: '#2a1d17', 600: '#5a4a40', 400: '#8a7a6e' },
        line: '#e6dac7',
        // Primary: marigold yellow. Use brand-700 for text/links on light backgrounds (AA contrast).
        brand: { DEFAULT: '#f2b91d', 50: '#fff8e1', 100: '#fdedb5', 600: '#d99e0b', 700: '#8f6508', 900: '#5e4205' },
        gold: { DEFAULT: '#b07a12', 300: '#f5c94a', 700: '#8a5e0c' },
        success: '#2f8a57',
        danger: '#c0392b',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(42,29,23,.06), 0 6px 22px rgba(42,29,23,.07)',
        lift: '0 18px 50px rgba(42,29,23,.16)',
      },
      borderRadius: { xl2: '1.375rem' },
      keyframes: {
        pop: { from: { transform: 'scale(.96)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        fadeUp: { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: { pop: 'pop .2s ease', fadeUp: 'fadeUp .3s ease' },
    },
  },
  plugins: [],
};

export default config;
