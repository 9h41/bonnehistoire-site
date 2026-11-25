// Cloudflare Worker for newsletter / beta sign-ups (deploy from this folder with `cf deploy`).
// The static site itself is on GitHub Pages; only this relay runs on Cloudflare.
import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "bonnehistoire-newsletter",
    entrypoint: "./index.js",
    compatibilityDate: "2026-11-01",
    workersDev: false,
    domains: ["newsletter.bonnehistoire.fr"],
    env: {
      BREVO_LIST_ID: bindings.text("3"),
      BREVO_TEMPLATE_ID: bindings.text("1"),
      BREVO_API_KEY: bindings.secret(),
    },
  },
});
