/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        cinema: {
          bg: 'rgb(var(--cinema-bg) / <alpha-value>)',
          surface: 'rgb(var(--cinema-surface) / <alpha-value>)',
          card: 'rgb(var(--cinema-card) / <alpha-value>)',
          border: 'var(--cinema-border-color)',
          borderHover: 'var(--cinema-border-hover)',
          red: '#E50914',
          redHover: '#C10710',
          gold: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
};
