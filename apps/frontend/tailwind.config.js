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
      backgroundImage: {
        'gold-foil': 'linear-gradient(135deg, #C9A962 0%, #F5EDD8 50%, #C9A962 100%)',
        'pink-glow': 'radial-gradient(circle at center, rgba(232, 86, 108, 0.15) 0%, transparent 70%)',
        'sidebar-gradient': 'linear-gradient(180deg, #FAFAF9 0%, #F5F0EC 100%)',
        'hero-mesh': 'radial-gradient(at 20% 80%, rgba(232, 86, 108, 0.06) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(201, 169, 98, 0.06) 0%, transparent 50%)',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'card-lg': '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'fab': '0 4px 12px rgba(232, 86, 108, 0.4)',
        'marble': '0 10px 40px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.03)',
        'gold': '0 4px 16px rgba(201, 169, 98, 0.3)',
        'pink-glow': '0 0 40px rgba(232, 86, 108, 0.4)',
        'pink-glow-lg': '0 0 60px rgba(232, 86, 108, 0.6)',
        'sidebar': '1px 0 0 rgba(0,0,0,0.04), 4px 0 16px rgba(0,0,0,0.04)',
        'stat': 'inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 3px rgba(0,0,0,0.06)',
        'nav-active': 'inset 0 0 0 1px rgba(232, 86, 108, 0.12), 0 1px 3px rgba(232, 86, 108, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
