import type { JsonObject } from "~/documents";

export function isJsonObject(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null) return false;

  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
