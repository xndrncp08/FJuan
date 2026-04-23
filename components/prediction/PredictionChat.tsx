/**
 * components/prediction/PredictionChat.tsx
 *
 * "Nacho Bot" — floating F1 AI chat widget, bottom-right of the prediction page.
 * Tagline: "I'm not your bot, ese."
 *
 * Mobile improvements:
 *   - Panel uses dvh units and clamps height so the keyboard never crushes it
 *   - Input row lifts above the iOS/Android keyboard via visualViewport tracking
 *   - font-size 16px on input prevents iOS auto-zoom
 *   - 44px min tap targets throughout
 *   - Safe-area insets honoured on notched devices
 *   - Tooltip hidden on mobile (too cramped next to FAB)
 *   - Panel width fills the screen on small viewports with side margins
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { RacePrediction } from "@/lib/types/prediction";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PredictionChatProps {
  prediction: RacePrediction;
}

const SUGGESTIONS = [
  "Who is most likely to win?",
  "Why is the P1 driver favoured?",
  "Best circuit history this race?",
  "Explain the methodology",
];

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.75rem",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#E10600",
            flexShrink: 0,
            marginTop: "6px",
            marginRight: "8px",
          }}
        />
      )}
      <div
        style={{
          maxWidth: "82%",
          padding: isUser ? "0.5rem 0.85rem" : "0.5rem 0",
          background: isUser ? "rgba(225,6,0,0.1)" : "transparent",
          border: isUser ? "1px solid rgba(225,6,0,0.18)" : "none",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: "0.85rem",
          lineHeight: 1.65,
          color: isUser ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E10600", flexShrink: 0 }} />
      <div style={{ display: "flex", gap: "3px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              animation: `nachoPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PredictionChat({ prediction }: PredictionChatProps) {
  const [isOpen, setIsOpen]           = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDone, setTooltipDone] = useState(false);

  // Tracks how far the keyboard has pushed up the visual viewport on mobile
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // ── visualViewport: shift panel up when keyboard appears ────────────────
  // When the soft keyboard opens on mobile, window.visualViewport shrinks.
  // We measure the gap between the layout viewport and the visual viewport
  // and apply it as a bottom offset so the panel floats above the keyboard.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function onViewportChange() {
      const gap = window.innerHeight - vv!.height - vv!.offsetTop;
      setKeyboardOffset(Math.max(0, gap));
    }

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  // ── 5-second intro tooltip (desktop only) ───────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem("nachobot-seen")) return;
    if (window.innerWidth < 640) return; // too cramped on mobile

    const showTimer = setTimeout(() => setShowTooltip(true), 1000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 6000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // ── Open / close toggle ──────────────────────────────────────────────────
  function handleToggle() {
    if (!isOpen) {
      sessionStorage.setItem("nachobot-seen", "1");
      setShowTooltip(false);
      setTooltipDone(true);
    }
    setIsOpen((o) => !o);
  }

  // ── Send a message and stream the response ───────────────────────────────
  async function handleSend(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || isStreaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, prediction }),
      });

      if (!res.ok || !res.body) throw new Error("Chat API error");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const raw = line.replace("data: ", "").trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            const delta  = parsed.choices?.[0]?.delta?.content ?? "";
            assistantText += delta;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantText };
              return updated;
            });
          } catch { /* malformed chunk — skip */ }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ay, something went wrong ese. Try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Dynamic bottom values — keyboard offset lifts both the FAB and panel
  const panelBottom = `calc(5.5rem + ${keyboardOffset}px)`;
  const fabBottom   = `calc(max(1.5rem, env(safe-area-inset-bottom) + 0.75rem) + ${keyboardOffset}px)`;

  return (
    <>
      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="nacho-panel" style={{ bottom: panelBottom }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Russo One', sans-serif",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                  color: "white",
                  letterSpacing: "0.04em",
                }}
              >
                Nacho Bot
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: "1px",
                  fontStyle: "italic",
                }}
              >
                I'm not your bot, ese.
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.25)",
                    minHeight: "44px",
                    padding: "0 0.6rem",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Nacho Bot"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            {messages.length === 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Ask me anything about{" "}
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>
                    {prediction.raceName}
                  </span>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.4)",
                        minHeight: "44px",
                        padding: "0 0.75rem",
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: "0.8rem",
                        textAlign: "left",
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <TypingIndicator />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "0.75rem",
              display: "flex",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nacho Bot…"
              disabled={isStreaming}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "white",
                padding: "0 0.75rem",
                height: "44px",
                fontFamily: "'Rajdhani', sans-serif",
                // 16px prevents iOS auto-zoom on focus
                fontSize: "16px",
                outline: "none",
                borderRadius: "2px",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              style={{
                background: input.trim() && !isStreaming ? "#E10600" : "rgba(255,255,255,0.04)",
                border: "none",
                color: input.trim() && !isStreaming ? "white" : "rgba(255,255,255,0.2)",
                height: "44px",
                padding: "0 1rem",
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                flexShrink: 0,
                borderRadius: "2px",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ── Intro tooltip (desktop only) ─────────────────────────────────── */}
      {showTooltip && !tooltipDone && !isOpen && (
        <button
          onClick={handleToggle}
          aria-label="Open Nacho Bot"
          style={{
            position: "fixed",
            bottom: "1.65rem",
            right: "5rem",
            background: "#0a0a0a",
            border: "1px solid rgba(225,6,0,0.35)",
            borderRight: "none",
            color: "rgba(255,255,255,0.7)",
            padding: "0.55rem 0.9rem",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "0.78rem",
            letterSpacing: "0.04em",
            cursor: "pointer",
            zIndex: 1002,
            whiteSpace: "nowrap",
            animation: "nachoTooltipIn 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span
            style={{
              position: "absolute",
              right: "-6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderLeft: "6px solid rgba(225,6,0,0.35)",
            }}
          />
          Psst. Ask me anything, ese. 🏎️
        </button>
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? "Close Nacho Bot" : "Open Nacho Bot"}
        className="nacho-fab"
        style={{
          position: "fixed",
          bottom: fabBottom,
          right: "1.5rem",
          borderRadius: "50%",
          background: isOpen ? "#1a1a1a" : "#E10600",
          border: isOpen ? "1px solid rgba(255,255,255,0.12)" : "none",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          boxShadow: isOpen
            ? "0 2px 12px rgba(0,0,0,0.4)"
            : "0 4px 20px rgba(225,6,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
          transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
        }}
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes nachoSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nachoPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes nachoTooltipIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── FAB ── */
        .nacho-fab {
          width: 52px;
          height: 52px;
        }
        .nacho-fab:hover { transform: scale(1.07); }
        .nacho-fab:active { transform: scale(0.94); }

        /* ── Panel — desktop default (bottom-right, fixed size) ── */
        .nacho-panel {
          position: fixed;
          right: 1.5rem;
          /* bottom is driven by inline style (keyboard offset) */
          width: min(380px, calc(100vw - 3rem));
          /*
            Clamp height so it never overflows the screen.
            dvh shrinks as the browser chrome collapses on mobile scroll.
          */
          height: min(520px, calc(100dvh - 9rem));
          background: #0a0a0a;
          border: 1px solid rgba(255,255,255,0.08);
          border-top: 2px solid #E10600;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
          animation: nachoSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Mobile overrides (<= 640px) ──
           Panel stays floating (not full-screen). It fills the available
           width and reduces its height to avoid overflowing the screen.
           The visualViewport listener handles keyboard avoidance dynamically.
        ── */
        @media (max-width: 640px) {
          .nacho-panel {
            right: 0.75rem;
            width: calc(100vw - 1.5rem);
            height: min(460px, calc(100dvh - 8rem));
          }
          .nacho-fab {
            width: 56px;
            height: 56px;
            right: 0.75rem !important;
          }
        }
      `}</style>
    </>
  );
}