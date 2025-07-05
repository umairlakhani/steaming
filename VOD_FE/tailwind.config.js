/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{html,js}",
    "./src/app/*.{html,js}"
  ],
  theme: {
    colors: {
      white: '#FFFFFF',
      primary: '#811630',
      light_grey: '#e5e7eb',
      grey: '#E9E7EE',
      red: '#ef4444'
    },
    extend: {
      gridTemplateColumns: {
        // Simple 16 column grid
        'video_grid': 'repeat(auto-fit, minmax(300px, 0fr))',
      },
    },
  },
  plugins: [],
}
