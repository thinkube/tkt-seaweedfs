import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TkThemeProvider } from "thinkube-style/components/theme";
import { App } from "./App";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TkThemeProvider defaultTheme="system">
      <App />
    </TkThemeProvider>
  </StrictMode>,
);
