"use client";

/**
 * components/layout/TabBar.tsx
 *
 * Phone and tablet bottom tabs: the five places people go most, in thumb
 * reach. The red bar glides to the active tab. Everything else stays in
 * the top menu. Hidden from lg up, where the top nav shows every link.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, CalendarDays, Home, Sparkles, Trophy } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/drivers", label: "Standings", icon: Trophy },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/live", label: "Live", icon: Activity },
  { href: "/predict", label: "Predict", icon: Sparkles },
];

export function TabBar() {
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const active = [...TABS].reverse().find((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)));

  return (
    <nav aria-label="Quick" className="tabbar material-bar fixed inset-x-0 bottom-0 z-[90] border-t border-separator lg:hidden">
      <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-xl grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const on = active?.href === href;
          return (
            <li key={href} className="relative">
              {on && <motion.span layoutId="tab-active" aria-hidden className="absolute inset-x-4 top-0 h-0.5 bg-accent" transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.4 }} />}
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn("pressable flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em]", on ? "text-paper" : "text-label-3")}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-200", on && "-translate-y-px text-tint")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
