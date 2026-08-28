import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "../src/server.js";

/**
 * Sobe o servidor em memória e devolve um cliente MCP já conectado.
 */
const connect = async (): Promise<Client> => {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const server = createServer();
  const client = new Client({ name: "test", version: "0.0.0" });

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
};

test("as tools são inferidas dos tipos e do JSDoc", async () => {
  const client = await connect();
  const { tools } = await client.listTools();

  const now = tools.find((tool) => tool.name === "now");
  assert.ok(
    now,
    `tool "now" não foi registrada. Encontradas: ${
      tools.map((tool) => tool.name).join(", ") || "(nenhuma)"
    }. Se a lista está vazia, o build não passou pelo ttsc.`,
  );

  // A descrição vem do JSDoc do método, não de string escrita à mão.
  assert.match(now.description ?? "", /hora atual do servidor em UTC/i);

  // O tipo de retorno vira outputSchema.
  assert.deepEqual(
    Object.keys(now.outputSchema?.properties ?? {}).sort(),
    ["epochMillis", "iso", "timeZone"],
  );

  await client.close();
});

test("a tool responde um instante UTC válido", async () => {
  const client = await connect();
  const before = Date.now();
  const result = await client.callTool({ name: "now", arguments: {} });
  const after = Date.now();

  assert.equal(result.isError, undefined);

  const output = result.structuredContent as {
    iso: string;
    epochMillis: number;
    timeZone: string;
  };

  assert.equal(output.timeZone, "UTC");
  assert.ok(output.iso.endsWith("Z"), `iso não está em UTC: ${output.iso}`);
  assert.equal(new Date(output.iso).getTime(), output.epochMillis);
  assert.ok(output.epochMillis >= before && output.epochMillis <= after);

  await client.close();
});
