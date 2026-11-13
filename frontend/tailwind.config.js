/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0F172A",      // Deep authoritative slate-navy
          sidebar: "#1E293B",   // Formal navigation sidebar
          surface: "#FFFFFF",   // Crisp white card surfaces
          bg: "#F8FAFC",        // Clean slate-50 background
          border: "#E2E8F0",    // Subtle clean border
          borderDark: "#CBD5E1",
          primary: "#1E40AF",   // Formal institutional navy blue
          primaryHover: "#1D4ED8",
          success: "#047857",   // Official verified green
          successBg: "#ECFDF5",
          danger: "#B91C1C",    // Official tamper warning red
          dangerBg: "#FEF2F2",
          warning: "#B45309",
          warningBg: "#FFFBEB",
          purple: "#6D28D9",
          purpleBg: "#F5F3FF",
          text: "#0F172A",      // High contrast deep slate text
          muted: "#475569"      // Crisp muted slate
        }
      }
    },
  },
  plugins: [],
}
