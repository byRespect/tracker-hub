import React from "react";
import { createRoot } from "react-dom/client";
import { createTracker } from "@tracker/core";
import App from "./App";

// Tracker'ı en erken noktada kuruyoruz; build öncesi DOM hazır olmalı.
const tracker = createTracker()
    .withConsoleLogging(true)
    .withNetworkLogging(true)
    .withDOMEventLogging(true)
    .withRRWebLogging(true)
    .withReportEndpoint('http://localhost:1337/sessions')
    .withUser({ id: 'user-123', name: 'Test User' })
    .withConsoleAutoReporting(["error"])
    .withLogRetention(5)
    .withFeatureFlags({ captureNetwork: true, captureRrweb: true });

tracker.build();
(window as any).__tracker__ = tracker;

const container = document.getElementById("root");
if (!container) {
    throw new Error("Root container missing in index.html");
}

createRoot(container).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
