import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: ["prisma/migrations/**"],
  },
  {
    name: "influsepet/pragmatic-overrides",
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      "import/no-named-as-default-member": "off",
      // Dinamik / harici URL görselleri için bilinçli <img> kullanımı
      "@next/next/no-img-element": "off",
    },
  },
];

/** @type {import("eslint").Linter.Config[]} */
export default config;
