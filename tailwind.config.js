/** @type {import('tailwindcss').Config} */

// Every color resolves to a CSS custom property defined in app/globals.css,
// stored as bare "r g b" channels so Tailwind's /opacity modifiers work.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface-1"),
          1: token("surface-1"),
          2: token("surface-2"),
          3: token("surface-3"),
        },
        paper: token("paper"),
        label: {
          DEFAULT: token("paper"),
          1: token("paper"),
          // Secondary tiers are paper at fixed alphas — see --label-* in globals.css.
          2: "var(--label-2)",
          3: "var(--label-3)",
          4: "var(--label-4)",
        },
        hairline: "var(--hairline)",
        separator: "var(--separator)",
        fill: {
          DEFAULT: "var(--fill-1)",
          1: "var(--fill-1)",
          2: "var(--fill-2)",
          3: "var(--fill-3)",
        },
        accent: token("accent"),
        tint: token("tint"),
        ember: token("ember"),
        ink: token("ink"),
        maroon: token("maroon"),
        success: token("success"),
        warning: token("warning"),
        info: token("info"),
        gold: token("gold"),
        silver: token("silver"),
        bronze: token("bronze"),
        // F1 timing convention: purple = fastest.
        purple: token("purple"),

        // shadcn-style aliases consumed by components/ui/select.tsx
        border: "var(--hairline)",
        input: "var(--hairline)",
        ring: token("tint"),
        background: token("canvas"),
        foreground: token("paper"),
        popover: { DEFAULT: token("surface-3"), foreground: token("paper") },
        muted: { DEFAULT: token("surface-2"), foreground: "var(--label-3)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
        mono: ["var(--font-data)", "ui-monospace", "monospace"],
      },
      // UI tiers (Rajdhani). Rajdhani runs small, so sizes sit ~1px above
      // Apple's ramp to read at the same optical size. Display tiers (Russo
      // One, uppercase) are defined as components in the plugin below.
      fontSize: {
        headline: ["1.1875rem", { lineHeight: "1.25", letterSpacing: "0.01em", fontWeight: "700" }],
        body: ["1.0625rem", { lineHeight: "1.5", letterSpacing: "0.005em" }],
        callout: ["1.0625rem", { lineHeight: "1.4", letterSpacing: "0.005em" }],
        subhead: ["1rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        footnote: ["0.9375rem", { lineHeight: "1.35", letterSpacing: "0.01em" }],
        caption: ["0.8125rem", { lineHeight: "1.3", letterSpacing: "0.04em" }],
      },
      // Square, like the timing screens this borrows from. `full` stays round
      // for dots and the chat button.
      borderRadius: {
        none: "0",
        xs: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        full: "9999px",
      },
      boxShadow: {
        card: "0 0 0 1px var(--hairline), 0 1px 0 0 rgba(255,255,255,0.035) inset, 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.45)",
        raised: "0 0 0 1px var(--separator), 0 1px 0 0 rgba(255,255,255,0.05) inset, 0 2px 4px rgba(0,0,0,0.3), 0 20px 40px -16px rgba(0,0,0,0.6)",
        popover: "0 0 0 1px var(--separator), 0 12px 32px rgba(0,0,0,0.5), 0 32px 64px -24px rgba(0,0,0,0.6)",
        "accent-glow": "0 8px 24px -8px rgb(var(--accent) / 0.6)",
      },
      maxWidth: {
        content: "1200px",
        prose: "68ch",
      },
      transitionTimingFunction: {
        // Critically damped feel: fast out, gentle settle, no overshoot.
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "live-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--accent) / 0.55)" },
          "70%": { boxShadow: "0 0 0 6px rgb(var(--accent) / 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "scale-in": "scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "live-pulse": "live-pulse 2s ease-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Display type: Russo One, uppercase, tight. Size, leading and tracking
    // travel together so every heading on the site comes from this ramp.
    function ({ addComponents }) {
      const display = (size, lineHeight, letterSpacing) => ({
        fontFamily: "var(--font-display), Impact, sans-serif",
        fontWeight: "400",
        textTransform: "uppercase",
        fontSize: size,
        lineHeight,
        letterSpacing,
      });
      addComponents({
        ".text-display": display("clamp(2.75rem, 7vw, 5.25rem)", "0.92", "-0.02em"),
        ".text-title-1": display("clamp(2.1rem, 4.6vw, 3.4rem)", "0.95", "-0.015em"),
        ".text-title-2": display("clamp(1.45rem, 2.6vw, 1.9rem)", "1", "-0.01em"),
        ".text-title-3": display("1.1875rem", "1.1", "0"),
        ".text-stat-lg": { ...display("clamp(2.25rem, 4.2vw, 3rem)", "1", "-0.02em"), textTransform: "none" },
        ".text-stat": { ...display("1.75rem", "1", "-0.02em"), textTransform: "none" },
      });
    },
  ],
};
