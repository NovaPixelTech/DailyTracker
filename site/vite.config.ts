import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs/promises";
import path from "path";

/** `BASE_PATH` lets a project-pages deployment ("/RepoName/") and a user-pages
 * deployment ("/") share this config. Defaults to the site root. */
const base = process.env.BASE_PATH ?? "/";

/**
 * GitHub Pages has no rewrite rules, so any deep link like `/history` would 404.
 * It does serve a custom `404.html`, which is used here to bounce the request to
 * the SPA entrypoint while preserving the original route.
 */
function pagesFallback(): Plugin {
  return {
    name: "github-pages-fallback",
    apply: "build",
    async closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "dist");
      const basePath = base.endsWith("/") ? base : `${base}/`;

      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting</title>
    <script>
      (function () {
        var base = ${JSON.stringify(basePath)};
        var l = window.location;
        var route = l.pathname.slice(base.length) + l.search + l.hash;
        l.replace(base + "index.html?__redirect=" + encodeURIComponent(route));
      })();
    </script>
  </head>
  <body></body>
</html>
`;

      await fs.writeFile(path.join(outDir, "404.html"), html, "utf8");
      // Without this, Jekyll strips directories beginning with an underscore.
      await fs.writeFile(path.join(outDir, ".nojekyll"), "", "utf8");
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), pagesFallback()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "wouter"],
          charts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});