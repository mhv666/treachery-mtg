import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import astro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/", "node_modules/", ".astro/", "*.min.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier,
];
