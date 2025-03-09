import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: ["lib/**/*", "generated/**/*"],
  },
  {
    files: ["**/*.{js,ts}"],
    extends: [
      tseslint.configs.recommended,
    ],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      "quotes": ["error", "double"],
      "import/no-unresolved": 0,
      "indent": ["error", 2],
      "max-len": ["error", { "code": 120 }], // Increasing line length limit
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn"
    },
  },
  {
    files: ["*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Will use the closest tsconfig.json
      },
    },
  },
)
