import { defineConfig } from "@richardscull/eslint-config";

export default defineConfig({
  fileCase: "kebabCase",
  ignores: ["**/types/api/**"], // Generated files by hey-api
});
