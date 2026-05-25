import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",  // path relativi — necessario per itch.io
  server: { port: 5173 },
  build: {
    // Splitta vendor (react/react-dom) dal codice app → migliore caching cross-deploy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
    // Alza la soglia warning: il main chunk app è ~450KB ed è inevitabile
    // senza un refactor pesante (tutto orchestrato da scratchlite.jsx)
    chunkSizeWarningLimit: 600,
  },
});
