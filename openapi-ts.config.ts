import { config } from "./src/lib/configs/env";

export default {
  input: `https://api.${config.sunrise.uri}/openapi/v1.json`,
  output: "src/lib/types/api",
  plugins: [
    "@hey-api/sdk",
    {
      baseUrl: false,
      name: "@hey-api/client-fetch",
    },
    {
      enums: "typescript",
      name: "@hey-api/typescript",
    },
  ],
};
