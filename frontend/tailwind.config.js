/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0B0F19",       // Deep cyber dark blue
          card: "#151B2C",     // Glass-like container color
          primary: "#00F0FF",  // Neon cyan
          secondary: "#9D4EDD",// Neon purple
          warning: "#FF0055",  // Tamper alert neon red
          success: "#00E676",  // Secured green
          text: "#F0F4F8",     // Sleek off-white text
          muted: "#6B7C96"     // Cool grey-blue muted text
        }
      }
    },
  },
  plugins: [],
}
