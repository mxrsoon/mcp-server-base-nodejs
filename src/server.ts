import { createMcpServer } from "@typia/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import typia from "typia";

import { ClockService } from "./tools/ClockService.js";

/**
 * Monta o servidor MCP a partir da classe de tools.
 *
 * Cada método público de `ClockService` vira uma tool, com input schema,
 * `outputSchema` e validação gerados em tempo de compilação a partir dos
 * tipos e do JSDoc.
 */
export const createServer = (): McpServer =>
  createMcpServer(
    typia.llm.controller<ClockService>("clock", new ClockService()),
    { version: "0.1.0" },
  );
