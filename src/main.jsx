import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import "./styles.css";

const root = document.getElementById("root");

function showBootError(error) {
  if (!root) return;
  const message = error instanceof Error ? error.message : String(error);
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#fff;color:#17221b;font-family:Inter,system-ui,sans-serif">
      <section style="width:min(620px,100%);border:1px solid #dfe7e1;border-radius:18px;padding:28px;box-shadow:0 16px 50px rgba(25,55,35,.08)">
        <div style="font-size:13px;font-weight:800;letter-spacing:.08em;color:#2b7a4b;text-transform:uppercase">Convert3D</div>
        <h1 style="margin:10px 0 8px;font-size:28px">The app could not start</h1>
        <p style="margin:0;color:#5e6c63;line-height:1.6">A browser runtime error prevented the interface from loading. Reload the page once to retry.</p>
        <pre style="white-space:pre-wrap;overflow:auto;margin-top:18px;padding:14px;border-radius:10px;background:#f6f8f6;color:#334239;font-size:12px">${message.replace(/[<>&"]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[s]))}</pre>
      </section>
    </main>`;
}

if (!root) {
  throw new Error("Convert3D root element was not found.");
}

import("./App.jsx")
  .then(({default: App}) => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  })
  .catch(showBootError);

window.addEventListener("error", event => {
  if (event.error) showBootError(event.error);
});
window.addEventListener("unhandledrejection", event => {
  if (event.reason) showBootError(event.reason);
});
