/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'all': '0 0 10px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}