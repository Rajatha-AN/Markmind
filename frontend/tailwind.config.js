/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#080b14',
        card: 'rgba(255,255,255,0.04)',
        border: 'rgba(139,92,246,0.2)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
