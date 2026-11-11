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
