import cesiumNode from "eslint-config-cesium/node.js";
import cesiumBrowser from "eslint-config-cesium/browser.js";
import html from "eslint-plugin-html";

export default [
  { ignores: ["dist/**"] },
  {
    ...cesiumNode,
    files: ["*.js"],
    languageOptions: {
      ...cesiumNode.languageOptions,
      sourceType: "module",
    },
    rules: {
      ...cesiumNode.rules,
      "n/no-unpublished-import": "off",
    },
  },
  {
    ...cesiumBrowser,
    files: ["src/**/*.js", "*.html", "src/**/*.html"],
    plugins: { ...cesiumBrowser.plugins, html },
    rules: {
      ...cesiumBrowser.rules,
      "no-unused-vars": ["error", { vars: "all", args: "none" }],
    },
  },
];
