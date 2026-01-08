/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'traj': {
          'bg': '#1a1a2e',
          'surface': '#16213e',
          'primary': '#0f3460',
          'accent': '#e94560',
          'source1': '#e94560',
          'source2': '#f39c12',
          'source3': '#2ecc71',
          'source4': '#3498db',
          'source5': '#9b59b6',
          'source6': '#1abc9c',
          'source7': '#e67e22',
          'source8': '#95a5a6',
        }
      }
    },
  },
  plugins: [],
}
