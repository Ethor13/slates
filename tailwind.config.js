/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "min-w-[10rem]",
    "min-w-[20rem]",
    "min-w-[30rem]",
    "min-w-[40rem]",
    "min-w-[50rem]",
  ],
  theme: {
    extend: {
      boxShadow: {
        'all': '0 0 10px 0 rgba(0, 0, 0, 0.15)',
      },
      colors: {
        'slate-light': '#68afde',
        'slate-medium': '#6a86d1',
        'slate-deep': '#244396',
      },
    },
  },
  plugins: [],
}