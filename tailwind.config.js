/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F2',
        surface: '#FFFFFF',
        'surface-subtle': '#F5F5F2',
        primary: {
          DEFAULT: '#315C4C',
          hover: '#26483B',
          light: '#DDE7DF',
        },
        charcoal: {
          DEFAULT: '#171918',
          muted: '#737773',
          dark: '#181C1A',
        },
        border: '#E4E6E2',
        critical: {
          DEFAULT: '#B8463B',
          subtle: '#FAF0EF',
        },
        warning: {
          DEFAULT: '#C58B36',
          subtle: '#FAF5ED',
        },
        sage: '#DDE7DF',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

