/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F0F',
        surface: '#1A1A1A',
        accent: '#FF5757',
        border: '#2A2A2A',
        secondary: '#888888',
      },
    },
  },
  plugins: [],
}
