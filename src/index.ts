import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createServer } from "./server.js";

const main = async (): Promise<void> => {
  const server = createServer();
  await server.connect(new StdioServerTransport());
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
