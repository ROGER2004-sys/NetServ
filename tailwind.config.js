/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060d1f',
          800: '#0a1628',
          700: '#0f2040',
          600: '#152a54',
          500: '#1e3a6e',
        },
        accent: {
          green: '#22c55e',
          teal: '#14b8a6',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
