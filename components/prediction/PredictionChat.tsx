/**
 * components/prediction/PredictionChat.tsx
 *
 * "Nacho Bot" — floating F1 AI chat widget, bottom-right of the prediction page.
 * Tagline: "I'm not your bot, ese."
 *
 * New in this version:
 *   - position: fixed so it stays visible while the user scrolls
 *   - 5-second intro tooltip ("Psst. Ask me anything, ese.") that auto-dismisses
 *     and never shows again once the user opens the chat (stored in sessionStorage)
 *   - Mobile-friendly: on screens < 640px the chat panel goes full-screen so
 *     the keyboard doesn't crush the layout
 *   - Touch-safe: 44px minimum tap targets, no hover-only interactions on mobile
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

// ─── Suggested starter questions ─────────────────────────────────────────────

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#E10600",
          flexShrink: 0,
        }}
      />
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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Tooltip state:
  //   showTooltip  — whether the "Psst" bubble is currently visible
  //   tooltipDone  — true once the user has opened the chat (never show again)
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDone, setTooltipDone] = useState(false);

  // Auto-scroll anchor
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // ── 5-second intro tooltip ───────────────────────────────────────────────
  // Shows 1 second after mount, auto-hides after 5 seconds.
  // Once the user clicks the button the tooltip is gone for the session.
  useEffect(() => {
    // If already interacted this session, skip entirely
    if (sessionStorage.getItem("nachobot-seen")) return;

    // Small delay so it doesn't fire before the page has settled
    const showTimer = setTimeout(() => setShowTooltip(true), 1000);

    // Auto-dismiss after 5 seconds
    const hideTimer = setTimeout(() => setShowTooltip(false), 6000); // 1s delay + 5s visible

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // ── Open / close toggle ──────────────────────────────────────────────────
  function handleToggle() {
    if (!isOpen) {
      // First open — mark as seen so tooltip never shows again this session
      sessionStorage.setItem("nachobot-seen", "1");
      setShowTooltip(false);
      setTooltipDone(true);
    }
    setIsOpen((o) => !o);
  }

  // ── Send a message and stream the Groq response ──────────────────────────
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

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // Seed empty assistant bubble — will grow token by token
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
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            assistantText += delta;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });
          } catch {
            /* malformed chunk — skip */
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Ay, something went wrong ese. Try again.",
        },
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

  return (
    <>
      {/* ── Chat panel ────────────────────────────────────────────────────
          Desktop: 380px wide, 520px tall, anchored bottom-right.
          Mobile (<640px): full-screen overlay so the keyboard doesn't
          crush the panel — achieved via the nachoMobile CSS class below.
      ─────────────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="nacho-panel">
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

            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.25)",
                    // 44px min tap target height for mobile
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
                  // 44px min tap target for mobile
                  minWidth: "44px",
                  minHeight: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
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
              // Smooth momentum scroll on iOS
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Empty state */}
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.4)",
                        // 44px min tap target
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

            {isStreaming &&
              messages[messages.length - 1]?.role !== "assistant" && (
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
              // Lifts the input above the iOS home indicator
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nacho Bot…"
              disabled={isStreaming}
              // font-size 16px prevents iOS auto-zoom on focus
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "white",
                padding: "0 0.75rem",
                height: "44px",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: "16px",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              style={{
                background:
                  input.trim() && !isStreaming
                    ? "#E10600"
                    : "rgba(255,255,255,0.04)",
                border: "none",
                color:
                  input.trim() && !isStreaming
                    ? "white"
                    : "rgba(255,255,255,0.2)",
                height: "44px",
                padding: "0 1rem",
                fontFamily: "'Russo One', sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor:
                  input.trim() && !isStreaming ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ── Intro tooltip ─────────────────────────────────────────────────
          Slides in from the right after 1s, auto-dismisses after 5s.
          Clicking it opens the chat directly.
      ─────────────────────────────────────────────────────────────────── */}
      {showTooltip && !tooltipDone && !isOpen && (
        <button
          onClick={handleToggle}
          aria-label="Open Nacho Bot"
          style={{
            position: "fixed",
            bottom: "1.65rem",
            // Sits to the left of the FAB (52px button + 0.5rem gap + 1.5rem right)
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
          {/* Small red triangle pointing right toward the FAB */}
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

      {/* ── Floating action button (FAB) ──────────────────────────────────
          Always visible, position: fixed so it follows the scroll.
          56px on mobile for easier tapping, 52px on desktop.
      ─────────────────────────────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? "Close Nacho Bot" : "Open Nacho Bot"}
        className="nacho-fab"
        style={{
          position: "fixed",
          bottom: "1.5rem",
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
          transition:
            "background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
        }}
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
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

      {/* ── Styles ────────────────────────────────────────────────────────
          Using a <style> block to handle the mobile breakpoint cleanly
          without needing a separate CSS file or Tailwind.
      ─────────────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Keyframes ── */
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

        /* ── FAB — desktop default ── */
        .nacho-fab {
          width: 52px;
          height: 52px;
        }
        .nacho-fab:hover {
          transform: scale(1.07);
        }
        .nacho-fab:active {
          transform: scale(0.94);
        }

        /* ── Chat panel — desktop default ── */
        .nacho-panel {
          position: fixed;
          bottom: 5.5rem;
          right: 1.5rem;
          width: min(380px, calc(100vw - 2rem));
          height: 520px;
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
           Panel goes full-screen so the on-screen keyboard doesn't
           push content offscreen. FAB grows to 56px for easier tapping.
        ── */
        @media (max-width: 640px) {
          .nacho-panel {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            /* dvh accounts for the browser chrome shrinking on scroll */
            height: 100dvh;
            border-left: none;
            border-right: none;
            border-bottom: none;
            border-radius: 0;
            animation: nachoSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
          }
          .nacho-fab {
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </>
  );
}
