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
          950: "#BA1B0B",
          900: "#D8210E",
          800: "#EC3623",
          700: "#E74C3C",
          600: "#EB6D60",
          500: "#EF7E73",
          400: "#F08C82",
          300: "#F1A7A0",
          200: "#F4B6B0",
          100: "#F2D2CF",
          50: "#F2E9E8",
          DEFAULT: '#E74C3C',  // falconred-700
        },
        falcongrey: {
          950: "#111313",
          900: "#171A1B",
          800: "#1C2021",
          700: "#32393A",
          600: "#434849",
          500: "#535D5F",
          400: "#727C7E",
          300: "#909B9D",
          200: "#A1ABAD",
          100: "#BCC5C7",
          50: "#DEE8EA",
          TRANSLUCENT: "#171a1bcc",  // falcongrey-900 at 80% transparency
          DEFAULT: '#1C2021',  // falcongrey-800
        },
      },
    },
  },
  plugins: [],
}
