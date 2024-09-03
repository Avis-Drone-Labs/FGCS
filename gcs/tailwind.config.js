/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        falconred: {
          100: '#E74C3C',
          80: '#EB6D60',
          60: '#F08C82',
          DEFAULT: '#E74C3C',
        },
        falcongrey: {
          120: '#171A1B',
          100: '#1C2021',
          80: '#32393A',
          60: '#535D5F',
          DEFAULT: '#1C2021',
        },
      },
    },
  },
  plugins: [],
}
