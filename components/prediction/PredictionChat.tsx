/**
 * components/prediction/PredictionChat.tsx
 *
 * "Nacho Bot" — floating chat about the next race's prediction.
 * Tagline: "I'm not your bot, ese."
 *
 * - The bubble docks in any corner, picture-in-picture style: drag it (or
 *   flick it — release velocity is projected forward) and it springs to the
 *   nearest corner, carrying the throw's velocity. Arrow keys move it too.
 *   The corner is remembered across visits.
 * - The panel grows out of the bubble's corner and returns into it, on a
 *   critically damped spring.
 * - On phones it lifts above the soft keyboard via visualViewport.
 * - Escape closes; the input is focused on open; replies are announced.
 */
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowUp, MessageCircle, RotateCcw, X } from "lucide-react";
import type { RacePrediction } from "@/lib/types/prediction";
import { cn } from "@/lib/utils/cn";
import { BUBBLE_SIZE, CORNERS, cornerInDirection, cornerPoint, isLeft, isTop, loadCorner, nearestCorner, project, saveCorner, type Corner } from "./bubbleDock";

const noopSubscribe = () => () => {};

const PANEL_SIDE: Record<Corner, string> = {
  tl: "left-3 origin-top-left sm:left-6",
  tr: "right-3 origin-top-right sm:right-6",
  bl: "left-3 origin-bottom-left sm:left-6",
  br: "right-3 origin-bottom-right sm:right-6",
};
const CORNER_NAME: Record<Corner, string> = { tl: "top left", tr: "top right", bl: "bottom left", br: "bottom right" };

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = ["Who’s most likely to win?", "Why is the favourite favoured?", "Who has the best record here?", "How does the model work?"];

const SEEN_KEY = "nachobot-seen";

function storageGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // private mode / blocked storage — the hint just shows again
  }
}

export default function PredictionChat({ prediction }: { prediction: RacePrediction }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hint, setHint] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  // ── Corner docking ──────────────────────────────────────────────────────
  // The bubble is positioned entirely by x/y motion values (fixed at 0,0),
  // so a drag and the dock spring move the same values and hand off
  // without a jump. It renders only after mount: its position needs the
  // viewport, and the saved corner lives in localStorage.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [corner, setCorner] = useState<Corner>(() => (typeof window === "undefined" ? "br" : loadCorner()));
  const [target, setTarget] = useState<Corner | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const docked = useRef<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  const dock = useCallback(
    (c: Corner, velocity?: { x: number; y: number }) => {
      const p = cornerPoint(c, keyboard);
      const first = docked.current === null;
      docked.current = `${c}:${keyboard}`;
      if (first || reduce) {
        x.set(p.x);
        y.set(p.y);
        return;
      }
      // Critically damped for repositioning; a touch of bounce only when a
      // throw carried momentum into the corner.
      const thrown = !!velocity && Math.hypot(velocity.x, velocity.y) > 300;
      const spring = { type: "spring", bounce: thrown ? 0.18 : 0, duration: 0.45 } as const;
      animate(x, p.x, { ...spring, velocity: velocity?.x ?? 0 });
      animate(y, p.y, { ...spring, velocity: velocity?.y ?? 0 });
    },
    [keyboard, reduce, x, y],
  );

  useEffect(() => {
    if (mounted && !dragging.current && docked.current !== `${corner}:${keyboard}`) dock(corner);
  }, [mounted, corner, keyboard, dock]);

  useEffect(() => {
    const onResize = () => !dragging.current && dock(corner);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [corner, dock]);

  const landing = (vx: number, vy: number) =>
    nearestCorner(x.get() + project(vx), y.get() + project(vy), keyboard);

  const moveTo = (c: Corner) => {
    setCorner(c);
    saveCorner(c);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, streaming, reduce]);

  // Lift above the soft keyboard on phones.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onChange = () => setKeyboard(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);
    return () => {
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
    };
  }, []);

  // One-time hint on wide screens.
  useEffect(() => {
    if (storageGet(SEEN_KEY) || window.innerWidth < 640) return;
    const show = setTimeout(() => setHint(true), 1500);
    const hide = setTimeout(() => setHint(false), 7000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    if (!open) {
      storageSet(SEEN_KEY, "1");
      setHint(false);
    }
    setOpen((o) => !o);
  };

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, prediction }),
      });
      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? "Chat API error");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      // SSE events can be split across network chunks: keep the trailing
      // partial line and only parse complete ones.
      let buffer = "";
      let finished = false;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") {
            finished = true;
            break;
          }
          try {
            const delta = JSON.parse(raw).choices?.[0]?.delta?.content;
            if (delta) {
              reply += delta;
              const text = reply;
              setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: text }]);
            }
          } catch {
            // keep-alive or non-JSON line — skip
          }
        }
      }
      if (!reply) throw new Error("Empty reply");
    } catch {
      // Replace the empty streaming bubble (if any) with the error line.
      setMessages((prev) => [
        ...(prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1].content ? prev.slice(0, -1) : prev),
        { role: "assistant", content: "Ay, something went wrong ese. Try again." },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  const lift = `${keyboard}px`;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Nacho Bot"
            className={cn(
              "material-thick fixed z-[400] flex w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl shadow-popover",
              PANEL_SIDE[corner],
            )}
            style={
              isTop(corner)
                ? {
                    top: `calc(var(--nav-h) + ${BUBBLE_SIZE + 24}px)`,
                    height: `min(560px, calc(100dvh - var(--nav-h) - ${BUBBLE_SIZE + 40}px - ${lift}))`,
                  }
                : { bottom: `calc(5.5rem + env(safe-area-inset-bottom) + ${lift})`, height: `min(560px, calc(100dvh - 8rem - ${lift}))` }
            }
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: isTop(corner) ? -12 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: isTop(corner) ? -12 : 12 }}
            transition={{ type: "spring", bounce: 0, duration: 0.32 }}
          >
            <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center bg-accent text-paper">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-callout font-semibold text-paper">Nacho Bot</p>
                <p className="truncate text-caption text-label-3">I’m not your bot, ese.</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  aria-label="Clear conversation"
                  className="pressable flex h-9 w-9 items-center justify-center text-label-3 hover:bg-fill-1 hover:text-paper"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="pressable flex h-9 w-9 items-center justify-center text-label-3 hover:bg-fill-1 hover:text-paper"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
              {messages.length === 0 && (
                <div>
                  <p className="text-subhead text-label-2">
                    Ask me anything about the <span className="font-semibold text-paper">{prediction.raceName}</span>.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="pressable bg-fill-2 px-3 py-2 text-left text-footnote text-paper hover:bg-fill-3"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap px-3.5 py-2 text-subhead",
                      m.role === "user" ? "rounded-br-md bg-accent text-paper" : "rounded-bl-md bg-surface-3 text-paper",
                    )}
                  >
                    {m.content || <Typing />}
                  </p>
                </div>
              ))}
              {streaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex">
                  <p className=" rounded-bl-md bg-surface-3 px-3.5 py-2">
                    <Typing />
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-hairline p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nacho Bot"
                aria-label="Message"
                disabled={streaming}
                enterKeyHint="send"
                className="h-10 min-w-0 flex-1 bg-fill-1 px-4 text-paper outline-none placeholder:text-label-4 focus:bg-fill-2 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Send"
                className="pressable flex h-10 w-10 shrink-0 items-center justify-center bg-accent text-paper disabled:bg-fill-2 disabled:text-label-4"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hint && !open && mounted && (
          <motion.button
            type="button"
            onClick={toggle}
            className={cn(
              "material-thick fixed z-[399] hidden px-4 py-2 text-footnote text-paper shadow-popover sm:block",
              isLeft(corner) ? "left-24 origin-left" : "right-24 origin-right",
            )}
            style={isTop(corner) ? { top: "calc(var(--nav-h) + 22px)" } : { bottom: "calc(2.25rem + env(safe-area-inset-bottom))" }}
            initial={{ opacity: 0, x: isLeft(corner) ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLeft(corner) ? -8 : 8 }}
          >
            Psst. Ask me anything, ese. 🏎️
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drag bounds: the bubble rubber-bands past the viewport edges. */}
      <div ref={viewport} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />

      {/* Dock targets, shown while dragging; the one it will land in is lit. */}
      <AnimatePresence>
        {target &&
          CORNERS.map((c) => {
            const p = cornerPoint(c, keyboard);
            const lit = c === target;
            return (
              <motion.span
                key={c}
                aria-hidden
                className={cn(
                  "pointer-events-none fixed left-0 top-0 z-[398] rounded-full border-2 border-dashed",
                  lit ? "border-accent bg-accent/15" : "border-paper/25",
                )}
                style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE, x: p.x, y: p.y }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: lit ? 1.08 : 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", bounce: 0, duration: 0.25 }}
              />
            );
          })}
      </AnimatePresence>

      {mounted && (
        <motion.button
          type="button"
          onPointerDown={() => (didDrag.current = false)}
          onClick={() => {
            // A drag ends with a click on the same element; don't treat it as
            // a tap. Also catch a release that left the bubble off its corner
            // (a flick so fast the drag never registered) and dock it instead.
            const home = cornerPoint(corner, keyboard);
            const settled = !x.isAnimating() && !y.isAnimating();
            const offCorner = settled && Math.hypot(x.get() - home.x, y.get() - home.y) > 8;
            if (didDrag.current || offCorner) {
              didDrag.current = false;
              if (offCorner && !dragging.current) {
                const c = nearestCorner(x.get(), y.get(), keyboard);
                moveTo(c);
                dock(c);
              }
              return;
            }
            toggle();
          }}
          onKeyDown={(e) => {
            if (!e.key.startsWith("Arrow")) return;
            e.preventDefault();
            const next = cornerInDirection(corner, e.key);
            if (next !== corner) moveTo(next);
          }}
          aria-label={open ? "Close Nacho Bot" : "Open Nacho Bot"}
          aria-description={`Docked ${CORNER_NAME[corner]}. Drag, or use the arrow keys, to move it to another corner.`}
          aria-expanded={open}
          drag={!open}
          dragMomentum={false}
          dragConstraints={viewport}
          dragElastic={0.18}
          onDragStart={() => {
            dragging.current = true;
            didDrag.current = true;
            setHint(false);
            setTarget(corner);
          }}
          onDrag={(_, info) => {
            const c = landing(info.velocity.x, info.velocity.y);
            setTarget((t) => (t === c ? t : c));
          }}
          onDragEnd={(_, info) => {
            dragging.current = false;
            const c = landing(info.velocity.x, info.velocity.y);
            setTarget(null);
            moveTo(c);
            dock(c, info.velocity);
          }}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          whileDrag={reduce ? undefined : { scale: 1.08 }}
          className={cn(
            "fixed left-0 top-0 z-[400] flex h-14 w-14 touch-none select-none items-center justify-center rounded-full bg-accent text-paper shadow-[0_8px_24px_-6px_rgb(var(--accent)/0.7),0_2px_6px_rgba(0,0,0,0.4)] hover:bg-[#D5170F]",
            !open && "cursor-grab active:cursor-grabbing",
          )}
          style={{ x, y }}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
        </motion.button>
      )}
    </>
  );
}

function Typing() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Nacho Bot is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-label-3" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  );
}
