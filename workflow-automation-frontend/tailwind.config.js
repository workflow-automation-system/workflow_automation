/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
      },
      colors: {
        'ghost-white': '#F6F5FA',
        'alice-blue': '#E2E8F0',
        'honeydew': '#D0FFA4',
        'eerie-black': '#292D32',
        'soft-vanilla': '#D0FFA4',
        'surface': '#FAFAFB',
        'surface-hover': '#F0F0F2',
        'border-subtle': '#E8E8EC',
        'text-primary': '#292D32',
        'text-secondary': '#5C5C5C',
        'text-muted': '#8A8A8A',
        'success': '#D0FFA4',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 16px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card': '0 2px 12px rgba(33, 33, 33, 0.04)',
      },
    },
  },
  plugins: [],
};
