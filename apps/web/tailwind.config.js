/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        status: {
          received: {
            50: '#f9fafb',
            100: '#f3f4f6',
            800: '#374151',
          },
          accessioned: {
            50: '#eef2ff',
            100: '#e0e7ff',
            800: '#3730a3',
          },
          extraction: {
            50: '#eff6ff',
            100: '#dbeafe',
            800: '#1e40af',
          },
          'dna-ready': {
            50: '#ecfdf5',
            100: '#d1fae5',
            800: '#065f46',
          },
          plated: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            800: '#0c4a6e',
          },
          genotyped: {
            50: '#faf5ff',
            100: '#f3e8ff',
            800: '#581c87',
          },
          'hold-qa': {
            50: '#fff1f2',
            100: '#ffe4e6',
            800: '#9f1239',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class',
}