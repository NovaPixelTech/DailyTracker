import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// GitHub Pages serves 404.html for unknown paths, which redirects here with the
// original route in `__redirect`. Restore it so wouter can render that page
// instead of the dashboard.
const redirect = new URLSearchParams(window.location.search).get("__redirect");
if (redirect) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const target = `${base}${redirect.startsWith("/") ? redirect : `/${redirect}`}`;
  window.history.replaceState(null, "", target);
}

createRoot(document.getElementById("root")!).render(<App />);