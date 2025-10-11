import react from "@vitejs/plugin-react"
import path, { resolve } from "node:path"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron/simple"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: "electron/main.ts",
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, "electron/preload.js"),
      },
      // Ployfill the Electron and Node.js built-in modules for Renderer process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: {},
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        linkStats: resolve(__dirname, "linkStats.html"),
        aboutWindow: resolve(__dirname, "aboutWindow.html"),
        video: resolve(__dirname, "video.html"),
        ekfStatus: resolve(__dirname, "ekfStatus.html"),
        vibeStatus: resolve(__dirname, "vibeStatus.html"),
      },
    },
  },
})
