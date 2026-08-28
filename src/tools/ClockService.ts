import { tags } from "typia";

/** Instante presente do servidor, sempre em UTC. */
export interface IUtcNow {
  /** Data e hora em ISO 8601, sempre com sufixo `Z`. */
  iso: string & tags.Format<"date-time">;

  /** Milissegundos decorridos desde a época Unix (1970-01-01T00:00:00Z). */
  epochMillis: number & tags.Type<"int64">;

  /** Fuso horário da resposta. Sempre `UTC`. */
  timeZone: "UTC";
}

/**
 * Relógio do servidor.
 *
 * Cada método público desta classe vira uma tool MCP automaticamente.
 */
export class ClockService {
  /**
   * Retorna a hora atual do servidor em UTC.
   *
   * Use quando precisar do instante presente para datar um registro, calcular
   * um intervalo ou resolver expressões relativas como "hoje" e "agora".
   * O valor não depende do fuso horário do cliente.
   */
  public async now(): Promise<IUtcNow> {
    const date: Date = new Date();
    return {
      iso: date.toISOString(),
      epochMillis: date.getTime(),
      timeZone: "UTC",
    };
  }
}
