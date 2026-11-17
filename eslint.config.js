// Exercise 2, Demo 4. TypeScript support (typescript-eslint) added Demo 8,
// after discovering this config only ever matched **/*.js - once Demo 7
// converted the whole app to .ts, `eslint .` was silently linting nothing.
// See CHANGES.MD.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", "node_modules/**", "public/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Exercise 3, Demo 6: added **/*.tsx here too, same "File ignored
    // because no matching configuration was supplied" problem Exercise 2
    // Demo 8 already found for .ts files would otherwise repeat for .tsx.
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    ignores: ["server/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Browser globals (window, document, fetch, localStorage, ...) -
      // the frontend has no Node-side code mixed in, so this is the
      // only globals set it needs.
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    // Exercise 6, Demo 4: the dev-only backend is the first Node-side
    // code in this repo - `process`, `console`, Node's module globals,
    // none of which the browser config block above declares, and none
    // of which this file should declare either, it's never bundled
    // into the browser-facing app.
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
