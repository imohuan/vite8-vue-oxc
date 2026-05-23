import type { CallerInfo, FormattedLog, LogLevel } from "./types";
import { formatCaller } from "./caller";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

function padLevel(level: LogLevel): string {
  return level.toUpperCase().padEnd(5);
}

/** 日志必须单行输出：禁止真实换行进入文件/控制台 */
export function sanitizeSingleLine(value: string): string {
  return value
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeMetaValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeSingleLine(value);
  if (Array.isArray(value)) return value.map(sanitizeMetaValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeMetaValue(v)]),
    );
  }
  return value;
}

function serializeMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return ` ${JSON.stringify(sanitizeMetaValue(meta))}`;
  } catch {
    return " [meta:unserializable]";
  }
}

function serializeErrorBlock(error: FormattedLog["error"]): string {
  if (!error) return "";
  const detail: Record<string, unknown> = {
    errorName: error.name,
    errorMessage: sanitizeSingleLine(error.message),
  };
  if (error.frames.length > 0) {
    detail.errorAt = error.frames.map((frame) => formatCaller(frame));
  }
  if (error.stack) {
    detail.errorStack = sanitizeSingleLine(error.stack);
  }
  try {
    return ` ${JSON.stringify(detail)}`;
  } catch {
    return ` {"errorName":"${error.name}","errorMessage":"${sanitizeSingleLine(error.message)}"}`;
  }
}

function formatBase(entry: FormattedLog): string {
  const location = formatCaller(entry.caller);
  const message = sanitizeSingleLine(entry.message);
  const line = `[${entry.timestamp}] [${padLevel(entry.level)}] [${entry.name}] [${location}] ${message}${serializeMeta(entry.meta)}${serializeErrorBlock(entry.error)}`;
  return sanitizeSingleLine(line);
}

export function formatPlain(entry: FormattedLog): string {
  return formatBase(entry);
}

export function formatConsole(entry: FormattedLog, useColor = true): string {
  const plain = formatBase(entry);
  if (!useColor) return plain;

  const location = formatCaller(entry.caller);
  const message = sanitizeSingleLine(entry.message);
  const level = `${LEVEL_COLORS[entry.level]}${padLevel(entry.level)}${RESET}`;
  const metaAndError = `${serializeMeta(entry.meta)}${serializeErrorBlock(entry.error)}`;
  return `\x1b[90m[${entry.timestamp}]\x1b[0m ${level} \x1b[35m[${entry.name}]\x1b[0m \x1b[32m[${location}]\x1b[0m ${message}${metaAndError}`;
}

export function formatCallerLabel(caller: CallerInfo | null): string {
  return formatCaller(caller);
}
