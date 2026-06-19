import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Loader2, X, Copy, Check, Download, ExternalLink,
  Monitor, Smartphone, Eye, Heart, Users, Hash, Sparkles,
} from "lucide-react";
import { getGameInfo } from "@/lib/roblox.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KrazodBlox — Roblox Game Lookup" },
      { name: "description", content: "Enter a Roblox Game ID to view game info, thumbnails, stats and more." },
    ],
  }),
  component: Home,
});

type Device = "pc" | "mobile";
type Game = Awaited<ReturnType<typeof getGameInfo>>;

const MODEL_LINKS = [
  "https://create.roblox.com/store/asset/112543655425498/Kick-A-Luckyblock-Kit-V3",
  "https://create.roblox.com/store/asset/15170127693/Realistic-Tree-Pack",
  "https://create.roblox.com/store/asset/14219112299/Sci-Fi-Sword-Pack",
  "https://create.roblox.com/store/asset/13987650091/Modern-Car-Model",
  "https://create.roblox.com/store/asset/18465432189/Anime-Character-Kit",
];

function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 6,
        color: Math.random() > 0.5 ? "var(--neon)" : "var(--neon-purple)",
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}

function safeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_") || "Game";
}

function downloadRbx(gameName: string) {
  const filename = `${safeFilename(gameName)}.rbx`;
  const placeholder = `<roblox version="4">
  <!-- KrazodBlox demo .rbx file -->
  <!-- This is a placeholder file. It contains no game assets, scripts, models, or data. -->
  <Meta name="generated-by">KrazodBlox</Meta>
  <Meta name="game">${gameName}</Meta>
  <Meta name="timestamp">${new Date().toISOString()}</Meta>
</roblox>
`;
  const blob = new Blob([placeholder], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground/90 transition hover:bg-white/10 hover:text-[color:var(--neon)]"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up" style={{ animationDuration: "0.2s" }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in">{children}</div>
    </div>
  );
}

function Home() {
  const fetchGame = useServerFn(getGameInfo);
  const [gameId, setGameId] = useState("");
  const [device, setDevice] = useState<Device | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; name: string; thumbnail: string }>>([]);
  const modelLink = useRef(MODEL_LINKS[Math.floor(Math.random() * MODEL_LINKS.length)]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("krazod-history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const saveHistory = (entry: { id: string; name: string; thumbnail: string }) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((h) => h.id !== entry.id)].slice(0, 6);
      try { localStorage.setItem("krazod-history", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!gameId.trim()) return;
    setError(null);
    setDeviceModalOpen(true);
  };

  const handleDeviceSelect = async (d: Device) => {
    setDevice(d);
    setDeviceModalOpen(false);
    setLoading(true);
    setError(null);
    modelLink.current = MODEL_LINKS[Math.floor(Math.random() * MODEL_LINKS.length)];
    try {
      const result = await fetchGame({ data: { placeId: gameId.trim() } });
      setGame(result);
      saveHistory({ id: String(result.placeId), name: result.name, thumbnail: result.thumbnail });
      setDownloadOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const openFromHistory = (id: string) => {
    setGameId(id);
    setError(null);
    setDeviceModalOpen(true);
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Particles />

      {/* Nav */}
      <header className="relative z-10 mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg glass neon-glow">
            <Sparkles className="h-5 w-5 text-[color:var(--neon)]" />
          </div>
          <span className="font-display text-xl font-black tracking-wider">
            KRAZOD<span className="text-[color:var(--neon)]">BLOX</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[color:var(--neon)] animate-pulse" />
          Online · Roblox API
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-3xl px-6 py-10 sm:py-16">
        <div className="text-center animate-fade-up">
          <p className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[color:var(--neon-purple)]" /> Roblox Game Lookup
          </p>
          <h1 className="mt-5 text-4xl sm:text-6xl font-black leading-[1.05]">
            Decode any <span className="neon-text">Roblox</span> game,
            <br className="hidden sm:block" /> instantly.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Paste a Roblox Game ID to fetch live stats, creator info, thumbnails and more — built for developers.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="glass rounded-2xl p-2 sm:p-3 flex items-center gap-2 shadow-[0_0_40px_color-mix(in_oklab,var(--neon)_20%,transparent)]">
            <div className="pl-3 text-[color:var(--neon)]">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter Roblox Game ID"
              className="flex-1 bg-transparent px-2 py-3 text-base sm:text-lg outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={!gameId.trim() || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--neon)] px-4 sm:px-6 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--primary-foreground)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed animate-pulse-glow"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Lookup</span>
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/80 text-center">
            Tip: the Game ID is the number in a Roblox game URL — e.g. <span className="text-foreground/80">roblox.com/games/<b>2753915549</b>/...</span>
          </p>
        </form>

        {error && (
          <div className="mt-6 glass border border-destructive/40 rounded-xl px-4 py-3 text-sm text-destructive-foreground animate-fade-up">
            {error}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="mt-12 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
              Recent Lookups
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => openFromHistory(h.id)}
                  className="glass rounded-xl p-3 flex items-center gap-3 text-left transition hover:border-[color:var(--neon)]/60 hover:-translate-y-0.5"
                >
                  {h.thumbnail ? (
                    <img src={h.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-white/5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{h.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{h.id}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Features strip */}
        <section className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {[
            { icon: Eye, label: "Live Stats" },
            { icon: Sparkles, label: "Glass UI" },
            { icon: Download, label: ".rbx Export" },
            { icon: Smartphone, label: "Mobile Ready" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass rounded-xl px-3 py-4 text-center">
              <Icon className="h-5 w-5 mx-auto text-[color:var(--neon)]" />
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 border-t border-border/50 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="font-display tracking-wider">
            © {new Date().getFullYear()} <span className="text-foreground">KRAZODBLOX</span>
          </div>
          <nav className="flex items-center gap-5">
            <a href="https://discord.gg/xCxYuvaFMv" target="_blank" rel="noreferrer noopener" className="hover:text-[color:var(--neon)] transition">Discord</a>
            <a href="https://youtube.com/@krazoblox" target="_blank" rel="noreferrer noopener" className="hover:text-[color:var(--neon)] transition">YouTube</a>
            <a href="mailto:hendrystudioz@gmail.com" className="hover:text-[color:var(--neon)] transition">Contact</a>
          </nav>

        </div>
      </footer>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm animate-fade-up" style={{ animationDuration: "0.2s" }}>
          <div className="glass rounded-2xl px-8 py-7 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin-slow text-[color:var(--neon)]" />
            <div className="font-display text-sm uppercase tracking-[0.25em]">Fetching game data…</div>
          </div>
        </div>
      )}

      {/* Device selection modal */}
      <Modal open={deviceModalOpen} onClose={() => setDeviceModalOpen(false)}>
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--neon)]">Step 1</p>
              <h3 className="mt-1 text-2xl font-black">What device are you using?</h3>
              <p className="mt-1 text-sm text-muted-foreground">We'll tailor the output to your platform.</p>
            </div>
            <button onClick={() => setDeviceModalOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleDeviceSelect("pc")}
              className="glass rounded-xl p-5 text-left transition hover:border-[color:var(--neon)] hover:-translate-y-0.5"
            >
              <Monitor className="h-7 w-7 text-[color:var(--neon)]" />
              <div className="mt-3 font-display text-lg font-bold">PC / Laptop</div>
              <div className="text-xs text-muted-foreground">Desktop tools & file export</div>
            </button>
            <button
              onClick={() => handleDeviceSelect("mobile")}
              className="glass rounded-xl p-5 text-left transition hover:border-[color:var(--neon-purple)] hover:-translate-y-0.5"
            >
              <Smartphone className="h-7 w-7 text-[color:var(--neon-purple)]" />
              <div className="mt-3 font-display text-lg font-bold">Mobile</div>
              <div className="text-xs text-muted-foreground">Mobile-optimized model links</div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Download / model modal */}
      <Modal open={downloadOpen && !!game} onClose={() => setDownloadOpen(false)}>
        {game && (
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--neon)]">Step 2 · {device === "pc" ? "Download File" : "Model Link"}</p>
                <h3 className="mt-1 text-2xl font-black truncate">{game.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {game.creator}</p>
              </div>
              <button onClick={() => setDownloadOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {device === "pc" ? (
              <div className="mt-6 space-y-4">
                <button
                  onClick={() => downloadRbx(game.name)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--neon)] px-5 py-3.5 font-bold uppercase tracking-wider text-[color:var(--primary-foreground)] transition hover:brightness-110 animate-pulse-glow"
                >
                  <Download className="h-5 w-5" />
                  Download {safeFilename(game.name)}.rbx
                </button>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generates a sample <code className="text-foreground/80">.rbx</code> file for testing and demonstration.
                  This is a placeholder file and does <b>not</b> contain any game assets, scripts, models, or data from Roblox games.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="glass rounded-xl p-3 text-xs break-all text-foreground/90">
                  {modelLink.current}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={modelLink.current}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--neon-purple)] px-5 py-3 font-bold uppercase tracking-wider text-[color:var(--primary-foreground)] transition hover:brightness-110"
                  >
                    <ExternalLink className="h-4 w-4" /> Open Model
                  </a>
                  <CopyButton value={modelLink.current} label="Copy Link" />
                </div>
              </div>
            )}

            <button
              onClick={() => { setDownloadOpen(false); setInfoOpen(true); }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl glass border border-[color:var(--neon)]/40 px-5 py-3 text-sm font-bold uppercase tracking-wider text-[color:var(--neon)] transition hover:bg-white/5"
            >
              View Game Information →
            </button>
          </div>
        )}
      </Modal>

      {/* Game info modal */}
      <Modal open={infoOpen && !!game} onClose={() => setInfoOpen(false)}>
        {game && (
          <div className="glass rounded-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--neon)]">Game Information</p>
              <button onClick={() => setInfoOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {game.thumbnail && (
              <img
                src={game.thumbnail}
                alt={game.name}
                className="mt-4 w-full aspect-square sm:aspect-video object-cover rounded-xl border border-border"
              />
            )}

            <h3 className="mt-5 text-2xl font-black">{game.name}</h3>
            <p className="text-sm text-muted-foreground">by {game.creator}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat icon={Eye} label="Visits" value={game.visits.toLocaleString()} />
              <Stat icon={Heart} label="Favorites" value={game.favorites.toLocaleString()} />
              <Stat icon={Users} label="Playing" value={game.playing.toLocaleString()} />
              <Stat icon={Hash} label="Place ID" value={String(game.placeId)} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <CopyButton value={String(game.placeId)} label="Copy Game ID" />
              <CopyButton value={`https://www.roblox.com/games/${game.placeId}`} label="Copy Game URL" />
              {device === "mobile" && <CopyButton value={modelLink.current} label="Copy Asset Link" />}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-[color:var(--neon)]" />
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold truncate">{value}</div>
    </div>
  );
}
