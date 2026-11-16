/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Grey & Burgundy Core Palette (Approved Design Direction)
        brand: {
          burgundy: "#873D50",
          burgundyHover: "#732F40",
          burgundyDark: "#5C2433",
          burgundyLight: "#F2E2E7",
          burgundy50: "#FAF2F5",
          charcoal: "#343239",
          charcoalHover: "#403D46",
          charcoalDark: "#26242A",
          charcoalLight: "#48444E",
          warmGrey: "#F5F3F2",
          warmGreyLight: "#FAF8F7",
          warmGreyBorder: "#E8E4E1",
          mutedGrey: "#57515A",
          mutedLight: "#8C8490",
        },
        // Institutional Forensic Semantic Status Colors
        status: {
          verified: "#087443",
          verifiedBg: "#EDFDF5",
          verifiedBorder: "#A6F4C5",
          critical: "#B42318",
          criticalBg: "#FEF3F2",
          criticalBorder: "#FECDCA",
          pending: "#986000",
          pendingBg: "#FEF6EE",
          pendingBorder: "#FEDF89",
          previous: "#6941C6",
          previousBg: "#F9F5FF",
          previousBorder: "#E9D7FE",
          archived: "#526171",
          archivedBg: "#F8F9FA",
          archivedBorder: "#EAECF0",
          progress: "#245FA5",
          progressBg: "#EFF8FF",
          progressBorder: "#B2DDFF"
        },
        // Unified legacy mapping re-anchored to the Warm Grey & Burgundy identity
        gov: {
          navy: "#343239",
          sidebar: "#343239",
          surface: "#FFFFFF",
          bg: "#F5F3F2",
          border: "#E8E4E1",
          borderDark: "#D6D0CD",
          primary: "#873D50",
          primaryHover: "#732F40",
          success: "#087443",
          successBg: "#EDFDF5",
          danger: "#B42318",
          dangerBg: "#FEF3F2",
          warning: "#986000",
          warningBg: "#FEF6EE",
          purple: "#6941C6",
          purpleBg: "#F9F5FF",
          text: "#343239",
          muted: "#57515A"
        }
      }
    },
  },
  plugins: [],
}
