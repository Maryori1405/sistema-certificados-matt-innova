// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#090E17',
          sidebar: '#0C1322',
          blue: '#1E56FF',
          blueHover: '#1746D4',
          accent: '#2563EB',
          success: '#10B981',
          danger: '#EF4444',
          surface: '#F8FAFC',
        }
      }
    },
  },
  plugins: [],
}