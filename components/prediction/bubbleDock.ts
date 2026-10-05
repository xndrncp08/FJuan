/**
 * components/prediction/bubbleDock.ts
 *
 * Corner docking for the Nacho Bot bubble, picture-in-picture style: the
 * bubble lives in one of four corners; a drag release projects the flick's
 * momentum forward (Apple's scroll-deceleration projection) and docks to
 * the corner nearest that projected point, so a quick flick throws it.
 */

export type Corner = "tl" | "tr" | "bl" | "br";

export const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];
export const BUBBLE_SIZE = 56;

const STORAGE_KEY = "nachobot-corner";

export const isTop = (c: Corner) => c[0] === "t";
export const isLeft = (c: Corner) => c[1] === "l";

/** Bottom safe-area inset (iOS home indicator), read once from CSS env(). */
let safeBottom: number | null = null;
function safeAreaBottom(): number {
  if (safeBottom !== null) return safeBottom;
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden";
  document.body.appendChild(probe);
  safeBottom = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return safeBottom;
}

/** Edge gaps: 16px on phones, 24px from sm up; top corners clear the navbar. */
export function cornerPoint(corner: Corner, lift = 0) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = vw >= 640 ? 24 : 16;
  const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
  return {
    x: isLeft(corner) ? margin : vw - margin - BUBBLE_SIZE,
    y: isTop(corner) ? nav + 12 : vh - BUBBLE_SIZE - Math.max(20, safeAreaBottom() + 12) - lift,
  };
}

/**
 * Where a flick would come to rest (exponential decay, as scroll views
 * decelerate). 0.998 is the normal scroll rate — at desktop scale anything
 * snappier barely throws the bubble.
 */
export function project(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function nearestCorner(x: number, y: number, lift = 0): Corner {
  let best: Corner = "br";
  let bestD = Infinity;
  for (const c of CORNERS) {
    const p = cornerPoint(c, lift);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Arrow-key move: flips the side or the edge in that direction. */
export function cornerInDirection(c: Corner, key: string): Corner {
  const v = c[0];
  const h = c[1];
  if (key === "ArrowLeft") return `${v}l` as Corner;
  if (key === "ArrowRight") return `${v}r` as Corner;
  if (key === "ArrowUp") return `t${h}` as Corner;
  if (key === "ArrowDown") return `b${h}` as Corner;
  return c;
}

export function loadCorner(): Corner {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return CORNERS.includes(v as Corner) ? (v as Corner) : "br";
  } catch {
    return "br";
  }
}

export function saveCorner(c: Corner) {
  try {
    localStorage.setItem(STORAGE_KEY, c);
  } catch {
    // private mode / blocked storage — it just resets next visit
  }
}
