import js from "@eslint/js";

export default [
   js.configs.recommended,
   {
      rules: {
        "@react/jsx-runtime": "off",
      },
   },
];