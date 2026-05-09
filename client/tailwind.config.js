/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#FFF3ED",
          100: "#FFE4D0",
          200: "#FFC8A1",
          300: "#FFA572",
          400: "#FF7F43",
          500: "#FF5F1F",
          600: "#F04A10",
          700: "#C73A0C",
          800: "#9E2F0D",
          900: "#7D280E",
          950: "#431208",
        },
      },
    },
  },
  plugins: [],
};
