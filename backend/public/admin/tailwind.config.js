// Local build config for the admin panel's CSS — deliberately not the CDN
// script (helmet's default CSP script-src 'self' blocks external scripts
// and the CDN's inline <script> config, so the runtime-JS Tailwind CDN
// never actually loaded). This builds a plain, same-origin stylesheet
// instead, which needs no CSP changes at all.
export default {
  // Relative to the CLI's cwd (backend/, per package.json's build:admin-css
  // script), not relative to this config file. app.js is just the entry
  // point now — the actual markup/classes live under functions/*.js.
  content: ["./public/admin/index.html", "./public/admin/app.js", "./public/admin/functions/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdeced",
          100: "#fbd8da",
          500: "#e63946",
          600: "#d62839",
          700: "#b8202f",
        },
      },
    },
  },
  plugins: [],
};
