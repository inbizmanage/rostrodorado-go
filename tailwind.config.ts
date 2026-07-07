import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C6A87C',
          light: '#E5D6C0',
          dark: '#856b46',
        },
        base: {
          DEFAULT: '#F9F8F6',
          white: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#111111',
          light: '#4A4A4A',
        },
        taupe: '#635c57',
      },
      fontFamily: {
        serif: ['"Montserrat"', 'sans-serif'],
        sans: ['"Montserrat"', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.25em',
      }
    }
  },
  plugins: [],
} satisfies Config
