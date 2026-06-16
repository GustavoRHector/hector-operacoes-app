import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", ".npm-cache/**"]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
