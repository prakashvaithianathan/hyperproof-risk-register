/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hyperproof: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          900: '#0c4a6e',
        },
        severity: {
          low: '#10b981',      // Emerald Green
          medium: '#f59e0b',   // Amber
          high: '#f97316',     // Vibrant Orange
          critical: '#ef4444', // Rose Red
        }
      },
    },
  },
  plugins: [],
}
