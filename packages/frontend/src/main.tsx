import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DarkModeProvider } from "./context/DarkModeContext.js";
import { App } from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <DarkModeProvider>
      <App />
    </DarkModeProvider>
  </StrictMode>,
);
