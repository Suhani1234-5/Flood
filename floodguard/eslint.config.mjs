import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig, // Sabse niche hona chahiye taaki rules override na ho
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // 'any' use karna mana hai
      "no-unused-vars": "warn",
      "no-console": "warn",       
      "semi": ["error", "always"], 
      "quotes": ["error", "double"] 
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;