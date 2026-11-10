// Exercise 2, Demo 4.
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**", "public/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Browser globals (window, document, fetch, localStorage, ...) -
      // this app has no Node-side code at all, it's a plain client-side
      // app, so this is the only globals set it needs.
      globals: {
        ...globals.browser,
      },
    },
  },
];
