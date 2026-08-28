# mcp-server-base-nodejs

Base de servidor MCP em TypeScript com a DX do FastMCP: você escreve um **método de classe normal**, com tipos normais e JSDoc, e ele vira uma tool com JSON Schema, `outputSchema` e validação — sem escrever schema à mão.

```ts
export class ClockService {
  /**
   * Retorna a hora atual do servidor em UTC.
   *
   * Use quando precisar do instante presente para datar um registro,
   * calcular um intervalo ou resolver expressões como "hoje" e "agora".
   */
  public async now(): Promise<IUtcNow> {
    const date = new Date();
    return { iso: date.toISOString(), epochMillis: date.getTime(), timeZone: "UTC" };
  }
}
```

O JSDoc do método vira a `description` da tool. O tipo do parâmetro vira o input schema. O tipo de retorno vira o `outputSchema`. Nada é duplicado.

## Como funciona

Tipos TypeScript são apagados no build e JSDoc não existe em runtime, então a extração acontece em **tempo de compilação**, via o transform do [typia](https://typia.io) rodando dentro do [`ttsc`](https://ttsc.dev) (drop-in do `tsc`).

```
src/tools/ClockService.ts   →  typia.llm.controller<ClockService>()  →  createMcpServer()
     classe + JSDoc                 schemas gerados no build              servidor MCP
```

O `@typia/mcp` também valida os argumentos de cada chamada e, quando o modelo erra, devolve o erro de validação em formato que ele consegue corrigir sozinho.

## Requisitos

- Node.js >= 20
- Go instalado (o transform nativo do typia é compilado uma vez e fica em cache)

## Uso

```bash
npm install
npm run build      # ttsc
npm start          # node dist/index.js (stdio)
```

Durante o desenvolvimento:

```bash
npm run dev        # ttsx src/index.ts
npm run typecheck  # ttsc --project tsconfig.test.json
npm test           # smoke test das tools
npm run inspect    # MCP Inspector apontando para o build
```

> ⚠️ `tsc`, `ts-node` e `tsx` **não** aplicam o transform. Use sempre `ttsc` / `ttsx`.
> Se o servidor subir e as tools vierem vazias, quase sempre é isso.

## Registrando no cliente

```json
{
  "mcpServers": {
    "base": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp-server-base-nodejs/dist/index.js"]
    }
  }
}
```

## Adicionando uma tool

1. Crie um método público na classe de serviço (ou uma nova classe em `src/tools/`).
2. Documente com JSDoc — a primeira frase é o resumo que o modelo lê.
3. Tipe entrada e saída. Restrições viram schema:

```ts
import { tags } from "typia";

/** Converte um instante UTC para outro fuso horário. */
public async convert(props: {
  /** Instante de origem, em ISO 8601. */
  iso: string & tags.Format<"date-time">;
  /** Fuso de destino, no formato IANA. Ex.: `America/Sao_Paulo`. */
  timeZone: string & tags.MinLength<1>;
}): Promise<{ iso: string; timeZone: string }> {
  // ...
}
```

`tags.Format<"date-time">` vira `"format": "date-time"`, `tags.MinLength<1>` vira `"minLength": 1`, união de literais vira `enum`. Métodos recebem **um único objeto** de parâmetros.

Para uma nova classe, registre em `src/server.ts`.

## Testes

`npm test` sobe o servidor via `InMemoryTransport`, lista as tools e verifica que a descrição veio do JSDoc e o `outputSchema` veio do tipo de retorno.

Isso existe por causa de um modo de falha específico: quando o build pula o `ttsc`, nada quebra — o servidor sobe normalmente, só que sem tool alguma. Uma compilação verde não pega isso; o teste pega.

## Estrutura

```
src/
├── index.ts              # entrypoint, conecta no transporte stdio
├── server.ts             # monta o McpServer a partir das classes de tools
└── tools/
    └── ClockService.ts   # exemplo: hora atual em UTC
test/
└── tools.test.ts         # prova que a inferência aconteceu
```

## Trade-offs

Vale saber antes de adotar em produção:

- **Depende do toolchain.** Qualquer caminho de build que pule o `ttsc` (SWC, Babel, `nest build`, bundler sem `@ttsc/unplugin`) gera um servidor sem schemas. É o atrito principal em monorepo.
- **Sem decorator em função solta.** Decorators só alcançam classe e método, por isso a classe funciona como namespace de tools.
- **Alternativa sem transform:** Zod/Standard Schema no SDK oficial, com `.describe()` no lugar do JSDoc. Inverte a direção — o schema vira a fonte da verdade e o tipo é inferido dele. Menos ergonômico, zero build mágico.

## Licença

MIT
