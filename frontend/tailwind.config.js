/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f5f0eb',
          100: '#e8ddd4',
          200: '#d4c2b0',
          300: '#b8a090',
          400: '#96796a',
          500: '#7a5c50',
          600: '#614540',
          700: '#4a3230',
          800: '#352320',
          900: '#1e1210',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf6ee',
          200: '#f4ecdc',
          300: '#ecdfc8',
          400: '#e0cfaf',
          500: '#d4bc92',
        },
        accent: {
          DEFAULT: '#c4622d',
          hover: '#a84f22',
          light: '#f0d4c4',
        }
      },
    },
  },
  plugins: [],
};
