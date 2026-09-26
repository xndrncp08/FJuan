/**
 * components/layout/Navbar.tsx
 *
 * FJUAN command navigation — motorsport HUD styling, Apple-grade behavior.
 *
 * - Translucent material bar; content scrolls underneath. The hairline under
 *   the bar only appears once content is actually beneath it.
 * - Desktop (lg+): coded, uppercase links with a red underline that glides
 *   to the active page. Below lg: a menu sheet that drops from the bar and
 *   returns into it.
 * - ⌘K opens a HUD-style search palette anchored near the top.
 */

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/drivers", label: "Drivers", code: "01", description: "Standings and career stats" },
  { href: "/teams", label: "Teams", code: "02", description: "Constructors and title history" },
  { href: "/tracks", label: "Circuits", code: "03", description: "Every venue on the calendar" },
  { href: "/calendar", label: "Calendar", code: "04", description: "Race weekends and results" },
  { href: "/compare", label: "Compare", code: "05", description: "Two drivers, head to head" },
  { href: "/predict", label: "Predict", code: "06", description: "Model picks for the next race" },
  { href: "/live", label: "Live", code: "07", description: "Session telemetry and lap times" },
];

const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ className, tag = true }: { className?: string; tag?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline font-display text-[1.375rem] leading-none tracking-[-0.04em] text-paper", className)}>
      FJ<span className="text-accent">U</span>AN
      {tag && <span className="ml-1.5 font-mono text-[0.625rem] tracking-normal text-label-3">26</span>}
    </span>
  );
}

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reduce = useReducedMotion();
  const time = useClock();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuOpen(false);
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[200] bg-paper px-4 py-2 font-bold uppercase tracking-widest text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-[100]">
        <div className={cn("material-bar transition-[box-shadow] duration-300", scrolled || menuOpen ? "shadow-[0_1px_0_0_var(--hairline)]" : "shadow-none")}>
          <nav aria-label="Main" className="container-page flex h-[var(--nav-h)] items-stretch gap-2">
            <Link href="/" aria-label="FJUAN home" className="pressable -ml-1 mr-6 flex items-center px-1">
              <Wordmark />
            </Link>

            <ul className="hidden items-stretch lg:flex">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href} className="flex">
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "pressable relative flex items-center gap-1.5 px-3.5 text-[0.8125rem] font-bold uppercase tracking-[0.14em]",
                        active ? "text-paper" : "text-label-3 hover:text-paper",
                      )}
                    >
                      <span aria-hidden className={cn("absolute left-3.5 top-2.5 font-mono text-[0.5625rem] tracking-normal", active ? "text-tint" : "text-label-3")}>
                        {link.code}
                      </span>
                      {link.href === "/live" && <span className="live-dot !h-1.5 !w-1.5" aria-hidden />}
                      {link.label}
                      {active && (
                        <motion.span layoutId="nav-active" className="absolute inset-x-3.5 bottom-0 h-[2px] bg-accent" transition={reduce ? { duration: 0 } : SPRING} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden font-mono text-[0.6875rem] tabular-nums text-label-3 xl:inline" aria-hidden>
                {time}
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                aria-keyshortcuts="Meta+K"
                className="pressable flex h-9 items-center gap-2 border border-hairline px-3 text-label-3 hover:border-accent/50 hover:text-paper"
              >
                <Search className="h-4 w-4" aria-hidden />
                <span className="hidden text-[0.75rem] font-bold uppercase tracking-[0.14em] sm:inline">Search</span>
                <kbd className="ml-1 hidden font-mono text-[0.625rem] text-label-3 sm:inline">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                className="pressable -mr-1 flex h-10 w-10 items-center justify-center text-paper hover:bg-fill-1 lg:hidden"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </nav>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 top-[var(--nav-h)] -z-10 bg-black/55 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                id="mobile-menu"
                key="menu"
                className="material-thick absolute inset-x-0 top-full origin-top overflow-y-auto border-b border-accent/40 shadow-popover lg:hidden"
                style={{ maxHeight: "calc(100dvh - var(--nav-h))" }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scaleY: 0.96 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scaleY: 0.96 }}
                transition={SPRING}
              >
                <ul className="container-page py-2">
                  {[{ href: "/", label: "Home", code: "00", description: "Standings, next race, news" }, ...NAV_LINKS].map((link) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <li key={link.href} className="border-b border-hairline last:border-0">
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          className={cn("row-interactive -mx-3 flex min-h-[60px] items-center gap-4 border-l-2 px-3", active ? "border-accent bg-accent/10" : "border-transparent")}
                        >
                          <span className={cn("w-5 font-mono text-[0.6875rem]", active ? "text-tint" : "text-label-3")}>{link.code}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 font-display text-[1.125rem] uppercase text-paper">
                              {link.label}
                              {link.href === "/live" && <span className="live-dot !h-1.5 !w-1.5" aria-hidden />}
                            </span>
                            <span className="block text-footnote text-label-3">{link.description}</span>
                          </span>
                          <ArrowRight className={cn("h-4 w-4 shrink-0", active ? "text-tint" : "text-label-3")} aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} time={time} />
    </>
  );
}

function SearchPalette({ open, onClose, time }: { open: boolean; onClose: () => void; time: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const q = query.trim().toLowerCase();
  const pages = q ? NAV_LINKS.filter((l) => l.label.toLowerCase().includes(q)) : NAV_LINKS;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            className="tex-grid absolute inset-0 bg-[rgb(10_3_2/0.88)] backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative mx-auto mt-[12vh] w-[min(680px,calc(100%-24px))] origin-top"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            transition={SPRING}
          >
            <div className="mb-3 flex items-center justify-between font-mono text-[0.6875rem] uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2 text-tint">
                <span className="live-dot !h-1.5 !w-1.5" aria-hidden />
                FJUAN / Search
              </span>
              <span className="tabular-nums text-label-3">{time}</span>
            </div>

            <div className="border border-separator border-t-accent bg-surface-1 shadow-popover">
              <form onSubmit={submit} className="flex items-center gap-3 border-b border-hairline px-5">
                <Search className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search drivers, teams, circuits"
                  aria-label="Search drivers, teams, circuits"
                  enterKeyHint="search"
                  className="h-16 min-w-0 flex-1 bg-transparent text-[1.25rem] font-semibold text-paper outline-none placeholder:text-label-3 focus-visible:outline-none"
                />
                <button type="submit" aria-label="Submit search" className="pressable flex h-10 w-12 items-center justify-center bg-accent text-paper hover:bg-[#D5170F]">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <div className="max-h-[50vh] overflow-y-auto p-2">
                {pages.length > 0 && (
                  <>
                    <p className="label-caps px-3 pb-1 pt-2 text-[0.6875rem] text-label-3">Jump to</p>
                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                      {pages.map((link) => (
                        <Link key={link.href} href={link.href} onClick={onClose} className="row-interactive group flex min-h-[64px] flex-col justify-between p-3">
                          <span className="font-mono text-[0.625rem] text-tint">{link.code}</span>
                          <span className="text-[0.875rem] font-bold uppercase tracking-[0.14em] text-label-2 group-hover:text-paper">{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-6 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-label-3">
              <span>Esc / Close</span>
              <span>Enter / Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
