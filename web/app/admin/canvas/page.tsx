import { CanvasView } from "./canvas-view";

export default async function CanvasPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  let graphData = { connections: [], positions: [], execStats: [] };
  try {
    const res = await fetch(`${apiBase}/api/canvas/graph`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      graphData = await res.json();
    }
  } catch {
    // Canvas will render with empty data
  }

  return (
    <div className="-mx-6 -mt-8" style={{ width: "100vw", height: "calc(100vh - 56px)" }}>
      <CanvasView initialGraph={graphData} apiBase={apiBase} />
    </div>
  );
}
