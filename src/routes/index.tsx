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

  // Previous logic: step to the next colour in order (0 -> 1 -> 2 -> 3 -> 4 -> 0 ...).
  // Kept here for reference in case we ever want the ordered cycle back:
  //   const next = () => setI((i + 1) % COLOURS.length);

  const next = () => setI(Math.floor(Math.random() * COLOURS.length));

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <button
        onClick={next}
        style={{ backgroundColor: COLOURS[i] }}
        className="rounded-full px-10 py-5 text-xl font-semibold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
      >
        Click me
      </button>
    </main>
  );
}
