import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Click the Dot" },
      { name: "description", content: "Click the dot as many times as you can in 20 seconds." },
      { property: "og:title", content: "Click the Dot" },
      { property: "og:description", content: "Click the dot as many times as you can in 20 seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const GAME_SECONDS = 20;
const DOT_SIZE = 56; // px

type Phase = "idle" | "playing" | "over";

// Random spot as a fraction (0–1) of the space left over after the dot's own size,
// so the dot can never poke outside the game area.
const randomSpot = () => ({ x: Math.random(), y: Math.random() });

function Index() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [dot, setDot] = useState({ x: 0.5, y: 0.5 });

  // Countdown: ticks once per second while playing, ends the game at zero.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setDot(randomSpot());
    setPhase("playing");
  };

  const hitDot = () => {
    if (phase !== "playing") return;
    setScore((s) => s + 1);
    setDot(randomSpot());
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Click the <span style={{ color: "var(--chart-1)" }}>Dot</span>
      </h1>

      {/* Hidden once the game is over: the score screen below already shows the result. */}
      {phase !== "over" && (
        <div className="flex w-full max-w-xl justify-between rounded-full bg-muted px-6 py-3 text-lg font-semibold text-foreground">
          <span>⏱ {timeLeft}s</span>
          <span>⭐ {score}</span>
        </div>
      )}

      {/* Fixed game area */}
      <div className="relative aspect-square w-full max-w-xl overflow-hidden rounded-3xl border-4 border-dashed border-border bg-card shadow-lg">
        {phase === "playing" && (
          <button
            aria-label="Dot"
            onClick={hitDot}
            className="absolute rounded-full shadow-md transition-transform hover:scale-110 active:scale-90"
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              left: `calc((100% - ${DOT_SIZE}px) * ${dot.x})`,
              top: `calc((100% - ${DOT_SIZE}px) * ${dot.y})`,
              backgroundColor: "var(--chart-1)",
            }}
          />
        )}

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-muted-foreground">Click the dot as many times as you can in {GAME_SECONDS} seconds.</p>
            <button
              onClick={start}
              className="rounded-full bg-primary px-10 py-4 text-xl font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Start
            </button>
          </div>
        )}

        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-xl text-muted-foreground">Time's up!</p>
            <p className="text-6xl font-extrabold text-foreground">{score}</p>
            <p className="text-muted-foreground">{score === 1 ? "dot" : "dots"} clicked</p>
            <button
              onClick={start}
              className="mt-2 rounded-full bg-primary px-10 py-4 text-xl font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
