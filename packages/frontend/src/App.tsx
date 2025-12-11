import { useEffect, useMemo, useState } from "react";
import type { SessionReport } from "@tracker/core";

export default function App() {
    const [ready, setReady] = useState(false);
    const [lastReport, setLastReport] = useState<SessionReport | null>(null);

    // main.tsx içinde tracker kuruluyor; burada sadece hazır bilgisi işliyoruz.
    const tracker = useMemo(() => (window as any).__tracker__ as any, []);

    useEffect(() => {
        setReady(true);
    }, []);

    const triggerWarn = () => console.warn("Demo warn", { ts: Date.now() });
    const triggerError = () => console.error("Demo error", new Error("demo"));
    const triggerManualReport = () => {
        const report = (window as any).reportSession?.();
        if (report) setLastReport(report as SessionReport);
    };

    return (
        <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "24px", maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ marginBottom: 8 }}>tracker-hub demo</h1>
            <p style={{ marginTop: 0, color: "#444" }}>
                Core SDK burada çalışıyor. Console/network/DOM olaylarını toplayıp session raporu üretebilirsiniz.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <button onClick={triggerWarn} disabled={!ready}>
                    Console warn
                </button>
                <button onClick={triggerError} disabled={!ready}>
                    Console error
                </button>
                <button onClick={triggerManualReport} disabled={!ready}>
                    Manual session report
                </button>
            </div>

            <div style={{ marginTop: 20, padding: 12, border: "1px solid #ddd", borderRadius: 8, background: "#fafafa" }}>
                <strong>SDK status:</strong> {ready ? "hazır" : "başlatılıyor..."}
            </div>

            {lastReport && (
                <div style={{ marginTop: 16 }}>
                    <strong>Son session report</strong>
                    <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, overflow: "auto" }}>
{JSON.stringify(lastReport, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
