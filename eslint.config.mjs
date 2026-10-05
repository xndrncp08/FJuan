import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", ".verify/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    rules: {
      // The Jolpica/OpenF1 payloads are untyped JSON; `any` is how the API
      // layer passes them through today.
      "@typescript-eslint/no-explicit-any": "off",
      // React Compiler rules. The app doesn't run the compiler, and the
      // existing effects that trip these are intentional (hydration-safe
      // clocks, reset-on-route-change). Surface them without failing CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    files: ["*.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
