/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'slate-940': 'rgb(24 41 59)',
        red: {
          50: '#fdf2f2',
          100: '#fae1e2',
          200: '#f4c3c6',
          300: '#ee989d',
          400: '#e46067',
          500: '#da1a22',
          600: '#d00007',
          700: '#a80006',
          800: '#8c0409',
          900: '#74090c',
          950: '#3f0003',
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '3rem',
          xl: '4rem',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        jersey: ['"Jersey 10"', 'sans-serif'],
        opensans: ['Open Sans', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
