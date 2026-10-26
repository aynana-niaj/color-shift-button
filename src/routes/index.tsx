import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colour Button" },
      { name: "description", content: "A button that changes colour every time you click it." },
      { property: "og:title", content: "Colour Button" },
      { property: "og:description", content: "A button that changes colour every time you click it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const COLOURS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Index() {
  const [i, setI] = useState(0);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <button
        onClick={() => setI((i + 1) % COLOURS.length)}
        style={{ backgroundColor: COLOURS[i] }}
        className="rounded-full px-10 py-5 text-xl font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
      >
        Click me
      </button>
    </main>
  );
}
