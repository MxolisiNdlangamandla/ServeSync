/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  safelist: [
    'bg-emerald-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-emerald-500/10',
    'bg-amber-500/10',
    'bg-red-500/10',
    'text-emerald-600',
    'text-amber-600',
    'text-red-600',
    'border-emerald-500/30',
    'border-amber-500/30',
    'border-red-500/30'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e2d4d',
        accent: '#f97316',
        sidebar: '#1a2540',
        muted: '#f1f5f9',
        'border-color': '#e2e8f0'
      },
      borderRadius: {
        xl: '0.75rem'
      },
      width: {
        sidebar: '240px'
      }
    }
  },
  plugins: []
};
