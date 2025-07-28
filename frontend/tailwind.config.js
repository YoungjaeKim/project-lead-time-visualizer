/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'elevation-4': '0 2px 4px 0 rgba(0, 0, 0, 0.14), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
        'elevation-8': '0 2px 8px 0 rgba(0, 0, 0, 0.14), 0 1px 4px 0 rgba(0, 0, 0, 0.12)',
        'elevation-16': '0 4px 16px 0 rgba(0, 0, 0, 0.14), 0 2px 4px 0 rgba(0, 0, 0, 0.12)',
        'elevation-64': '0 16px 64px 0 rgba(0, 0, 0, 0.14), 0 4px 16px 0 rgba(0, 0, 0, 0.12)',
      },
      colors: {
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        blue: {
          600: '#2563eb',
          700: '#1d4ed8',
        },
        green: {
          600: '#16a34a',
          700: '#15803d',
        },
        purple: {
          600: '#9333ea',
          700: '#7c3aed',
        },
        orange: {
          600: '#ea580c',
          700: '#c2410c',
        },
        red: {
          50: '#fef2f2',
          200: '#fecaca',
          600: '#dc2626',
          800: '#991b1b',
        },
      },
    },
  },
  plugins: [],
}