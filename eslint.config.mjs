import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "framer-motion",
              message:
                "Use framer-motion only in allowed Editor's Desk motion surfaces.",
            },
            {
              name: "framer-motion/dom",
              message:
                "Use framer-motion only in allowed Editor's Desk motion surfaces.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/components/desk/**/*.{ts,tsx}",
      "src/components/ui/modal.tsx",
      "src/components/ui/command-bar.tsx",
      "src/app/**/loading.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored gstack (upstream lint differs from this repo)
    ".agents/**",
  ]),
]);

export default eslintConfig;
