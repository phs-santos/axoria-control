import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  devServer: {
    port: 3002 // Substitua pela porta desejada (ex: 8080)
  },

  // Nuxt 4 structure
  future: {
    compatibilityVersion: 4,
  },

  // Disable experimental app manifest for better stability in dev
  experimental: {
    appManifest: false,
  },

  css: ["~/assets/styles.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  // Absolute path aliases
  alias: {
    "@": fileURLToPath(new URL("./app", import.meta.url)),
    "~": fileURLToPath(new URL("./app", import.meta.url)),
  },
});
