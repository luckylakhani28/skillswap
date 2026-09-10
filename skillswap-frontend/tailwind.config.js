/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // The signature two-tone system: what you teach vs. what you learn.
        teach: { DEFAULT: '#7C3AED', soft: '#EDE9FE', ink: '#4C1D95' },
        learn: { DEFAULT: '#0D9488', soft: '#CCFBF1', ink: '#134E4A' },
        ink: '#0B0F14',
        surface: {
          light: '#F5F6F8',
          dark: '#0E1217',
          card: '#151A21',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,15,20,0.04), 0 8px 24px -12px rgba(11,15,20,0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up 0.4s ease-out both' },
    },
  },
  plugins: [],
};
