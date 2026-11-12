import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pop The Dot" },
      { name: "description", content: "Pop as many dots as you can in 20 seconds." },
      { property: "og:title", content: "Pop The Dot" },
      { property: "og:description", content: "Pop as many dots as you can in 20 seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const GAME_SECONDS = 20;
const READY_SECONDS = 3;
const DOT_SIZE = 56; // px

type Phase = "idle" | "ready" | "playing" | "over";
type Pop = { id: number; x: number; y: number };

// Random spot as a fraction (0–1) of the space left over after the dot's own size,
// so the dot can never poke outside the game area.
const randomSpot = () => ({ x: Math.random(), y: Math.random() });

// Start/score screens use a coloured background; ready/play use white.
const isColoured = (p: Phase) => p === "idle" || p === "over";

// ---------- Sound (generated with the Web Audio API, no files needed) ----------
let ctx: AudioContext | null = null;
const audio = () => (ctx ??= new AudioContext());
// Sound is a bonus: if the browser blocks it, the game must still work.
const safe = (fn: () => void) => {
  try {
    fn();
  } catch {
    /* ignore sound errors */
  }
};

function playPop() {
  const ac = audio();
  const t = ac.currentTime;
  // Short noise burst = the "snap" of bubble wrap
  const buf = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const ng = ac.createGain();
  ng.gain.value = 0.5;
  noise.connect(ng).connect(ac.destination);
  noise.start(t);
  // Quick falling tone = the bubbly "plop"
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.16);
}

// Simple looping, bouncy background tune. Returns a stop function.
function startMusic() {
  const ac = audio();
  const notes = [523, 659, 784, 659, 587, 698, 880, 698];
  const master = ac.createGain();
  master.gain.value = 0.08;
  master.connect(ac.destination);
  let step = 0;
  const play = () => {
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = notes[step++ % notes.length] ?? 523;
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.22);
  };
  play();
  const id = setInterval(play, 250);
  return () => {
    clearInterval(id);
    master.disconnect();
  };
}

function Index() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [readyLeft, setReadyLeft] = useState(READY_SECONDS);
  const [dot, setDot] = useState({ x: 0.5, y: 0.5 });
  const [dotKey, setDotKey] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const [sweepKey, setSweepKey] = useState(0);
  const prevColoured = useRef(true);
  const areaRef = useRef<HTMLDivElement>(null);

  // Trigger the radial colour sweep whenever the background colour changes.
  useEffect(() => {
    if (isColoured(phase) !== prevColoured.current) {
      prevColoured.current = isColoured(phase);
      setSweepKey((k) => k + 1);
    }
  }, [phase]);

  // "Get ready" loader: 3, 2, 1… then play.
  useEffect(() => {
    if (phase !== "ready") return;
    const id = setInterval(() => {
      setReadyLeft((r) => {
        if (r <= 1) {
          setPhase("playing");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Countdown: ticks once per second while playing, ends the game at zero.
  useEffect(() => {
    if (phase !== "playing") return;
    let stopMusic = () => {};
    safe(() => (stopMusic = startMusic()));
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(id);
      safe(stopMusic);
    };
  }, [phase]);

  const start = () => {
    safe(() => void audio().resume().catch(() => {}));
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setReadyLeft(READY_SECONDS);
    setDot(randomSpot());
    setPops([]);
    setPhase("ready");
  };

  const hitDot = () => {
    if (phase !== "playing") return;
    const area = areaRef.current;
    if (area) {
      const free = area.clientWidth - DOT_SIZE;
      const p = {
        id: Date.now() + Math.random(),
        x: free * dot.x + DOT_SIZE / 2,
        y: (area.clientHeight - DOT_SIZE) * dot.y + DOT_SIZE / 2,
      };
      setPops((ps) => [...ps, p]);
      setTimeout(() => setPops((ps) => ps.filter((q) => q.id !== p.id)), 500);
    }
    safe(playPop);
    setScore((s) => s + 1);
    setDot(randomSpot());
    setDotKey((k) => k + 1);
  };

  const coloured = isColoured(phase);
  const pct = timeLeft / GAME_SECONDS;
  const barColour = pct > 0.5 ? "var(--timer-ok)" : pct > 0.25 ? "var(--timer-warn)" : "var(--timer-danger)";

  const bigButton =
    "rounded-full bg-pop-foreground px-10 py-4 text-2xl font-semibold text-pop shadow-lg transition-transform hover:scale-105 active:scale-95";

  const title = (big: boolean) => (
    <h1 className={cn("relative font-bold tracking-tight", big ? "text-6xl sm:text-7xl" : "text-4xl sm:text-5xl")}>
      Pop The D
      {phase === "idle" ? (
        <span className="relative inline-block">
          <span className="inline-block" style={{ animation: "o-burst 2.4s ease-in-out infinite" }}>o</span>
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[58%] rounded-full border-4 border-pop-foreground"
            style={{ width: "0.6em", height: "0.6em", animation: "o-ring 2.4s ease-out infinite" }}
          />
        </span>
      ) : (
        "o"
      )}
      t
    </h1>
  );

  return (
    <main
      className={cn(
        "relative flex h-dvh flex-col items-center justify-center gap-4 overflow-hidden p-4 transition-colors duration-700",
        coloured ? "text-pop-foreground" : "text-pop",
      )}
      style={{ backgroundColor: coloured ? "var(--pop)" : "var(--background)" }}
    >
      {/* Radial colour sweep: into play from bottom-right, out of play from top-left */}
      {sweepKey > 0 && (
        <div
          key={sweepKey}
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundColor: coloured ? "var(--pop)" : "var(--background)",
            animation: `${coloured ? "sweep-out" : "sweep-in"} 700ms ease-out forwards`,
          }}
        />
      )}

      {phase === "idle" && (
        <div className="relative flex flex-col items-center gap-6 text-center">
          {title(true)}
          <p className="text-xl">Pop as many dots as you can in {GAME_SECONDS} seconds.</p>
          <button onClick={start} className={bigButton}>
            Start
          </button>
        </div>
      )}

      {phase === "over" && (
        <>
          <div className="relative flex flex-col items-center gap-5 text-center">
            <p className="text-2xl">Time's up!</p>
            <p className="text-5xl font-bold sm:text-6xl">
              ⭐ {score} {score === 1 ? "dot" : "dots"} popped
            </p>
            <button onClick={start} className={cn(bigButton, "mt-2")}>
              Restart
            </button>
          </div>
          {/* Game name as a small footer, bottom-left, on the score page */}
          <footer className="absolute bottom-4 left-4 text-base font-medium">
            Pop The Dot
          </footer>
        </>
      )}

      {!coloured && (
        <>
          {title(false)}
          <div className={cn("relative w-full max-w-xl space-y-2", phase !== "playing" && "invisible")}>
            <div className="flex justify-between rounded-full bg-muted px-6 py-3 text-xl font-semibold text-foreground">
              <span>⏱ {timeLeft}s</span>
              <span>⭐ {score}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${pct * 100}%`, backgroundColor: barColour }}
              />
            </div>
          </div>

          <div
            ref={areaRef}
            className="relative aspect-square overflow-hidden rounded-3xl border-4 border-dashed border-border bg-card shadow-lg"
            style={{ width: "min(100%, 36rem, calc(100dvh - 15rem))" }}
          >
            {phase === "playing" && (
              <button
                key={dotKey}
                aria-label="Dot"
                onClick={hitDot}
                className="absolute rounded-full bg-pop shadow-md hover:brightness-110"
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  left: `calc((100% - ${DOT_SIZE}px) * ${dot.x})`,
                  top: `calc((100% - ${DOT_SIZE}px) * ${dot.y})`,
                  animation: "dot-in 150ms ease-out",
                }}
              />
            )}

            {pops.map((p) => (
              <span
                key={p.id}
                className="pointer-events-none absolute rounded-full border-4 border-pop"
                style={{ left: p.x, top: p.y, width: DOT_SIZE, height: DOT_SIZE, animation: "pop-ring 400ms ease-out forwards" }}
              />
            ))}

            {phase === "ready" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="text-2xl font-medium">Get ready…</p>
                <p key={readyLeft} className="text-8xl font-bold" style={{ animation: "ready-pulse 600ms ease-out" }}>
                  {readyLeft}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
