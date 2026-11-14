import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { flagOn } from "./flags";
import "./styles.css";

// The finance hub (mini project 1) loads only when its flag is on; with it off the alpha app is unchanged.
const HubApp = lazy(() => import("./hub/HubApp"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>{flagOn("hub") ? <Suspense fallback={null}><HubApp /></Suspense> : <App />}</StrictMode>,
);
