import type { DebateStreamEvent } from "@/types";

export interface ParsedSSEBuffer {
  events: DebateStreamEvent[];
  remainder: string;
}

export function parseSSEBuffer(buffer: string): ParsedSSEBuffer {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const messages = normalized.split("\n\n");
  const remainder = messages.pop() ?? "";
  const events: DebateStreamEvent[] = [];

  for (const message of messages) {
    const data = message
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!data) {
      continue;
    }

    events.push(JSON.parse(data) as DebateStreamEvent);
  }

  return {
    events,
    remainder,
  };
}
