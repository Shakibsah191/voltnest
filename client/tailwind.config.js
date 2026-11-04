/**
 * VoltNest design tokens.
 * Change the brand colour here and the whole site follows.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1360px' },
    },
    extend: {
      colors: {
        brand: {
          50: '#EEF1FF',
          100: '#DDE3FF',
          200: '#BBC6FF',
          300: '#8FA0FB',
          400: '#5E73F2',
          500: '#2440E6', // primary accent: "volt cobalt"
          600: '#1A33C4',
          700: '#16299C',
          800: '#14247C',
          900: '#121E5C',
          DEFAULT: '#2440E6',
        },
        ink: {
          DEFAULT: '#1B2230', // main text
          muted: '#5B6475', // secondary text
          subtle: '#8A93A3', // hints, placeholders
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F7FA', // section backgrounds, image wells
          sunken: '#EDF0F5',
        },
        line: '#E3E7EE',
        sale: '#D92D20',
        success: '#12805C',
        warning: '#B54708',
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // type scale ≈ 1.2 ratio
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.3rem' }],
        base: ['1rem', { lineHeight: '1.55rem' }],
        lg: ['1.2rem', { lineHeight: '1.75rem' }],
        xl: ['1.44rem', { lineHeight: '2rem' }],
        '2xl': ['1.728rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        '3xl': ['2.074rem', { lineHeight: '2.5rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.488rem', { lineHeight: '2.9rem', letterSpacing: '-0.02em' }],
        '5xl': ['2.986rem', { lineHeight: '3.3rem', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        card: '14px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 34, 48, 0.06), 0 4px 16px rgba(27, 34, 48, 0.06)',
        pop: '0 12px 32px rgba(27, 34, 48, 0.14)',
      },
      spacing: {
        header: '4rem',
        section: '4.5rem',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'drop-in': { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'slide-in-left': 'slide-in-left 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 200ms ease-out',
        'drop-in': 'drop-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
