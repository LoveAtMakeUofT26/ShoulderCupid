/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cupid: {
          50: '#FFEAED',
          100: '#FFD5DA',
          200: '#FFABB5',
          300: '#F5A3B1',
          400: '#F07A8C',
          500: '#E8566C',
          600: '#D14459',
          700: '#B33347',
          800: '#8C2636',
          900: '#661A26',
        },
        gold: {
          50: '#F5EDD8',
          100: '#EDE0C0',
          200: '#E0CDA0',
          300: '#D4BA80',
          400: '#C9A962',
          500: '#B8944D',
          600: '#9A7A3D',
          700: '#7C602E',
          800: '#5E4720',
          900: '#402F12',
        },
        marble: {
          50: '#FAF7F5',
          100: '#F5F0EC',
          200: '#EDE5DE',
          300: '#E0D5CC',
          400: '#D0C2B5',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'fab': '0 4px 12px rgba(232, 86, 108, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
