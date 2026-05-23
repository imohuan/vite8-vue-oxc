import path from "node:path";
import type { CallerInfo } from "./types";

const STACK_FRAME_RE = /^\s*at\s+(?:(.+?)\s+\()?(?:async\s+)?(?:.*?\s+)?(?:file:\/\/)?(.+?):(\d+):(\d+)\)?$/;

const INTERNAL_PREFIXES = ["/logger/", "node:internal", "node:async_hooks", "bun:"];

function isInternalFrame(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return INTERNAL_PREFIXES.some((prefix) => normalized.includes(prefix));
}

function toProjectRelative(filePath: string): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith(cwd)) {
    return normalized.slice(cwd.length + 1);
  }
  if (normalized.startsWith("file://")) {
    return normalized.slice("file://".length);
  }
  return normalized;
}

export function parseStackFrame(line: string): CallerInfo | null {
  const match = line.match(STACK_FRAME_RE);
  if (!match) return null;

  const [, , file, lineNo, column] = match;
  if (!file || !lineNo || !column) return null;
  if (isInternalFrame(file)) return null;

  return {
    file: toProjectRelative(file),
    line: Number(lineNo),
    column: Number(column),
  };
}

export function getCallerLocation(stackSkip = 3): CallerInfo | null {
  const stack = new Error().stack;
  if (!stack) return null;

  const lines = stack.split("\n").slice(stackSkip);
  for (const line of lines) {
    const frame = parseStackFrame(line);
    if (frame) return frame;
  }
  return null;
}

export function parseErrorFrames(error: Error): CallerInfo[] {
  if (!error.stack) return [];

  const frames: CallerInfo[] = [];
  for (const line of error.stack.split("\n").slice(1)) {
    const frame = parseStackFrame(line);
    if (frame) frames.push(frame);
  }
  return frames;
}

export function formatCaller(caller: CallerInfo | null): string {
  if (!caller) return "unknown:?";
  return `${caller.file}:${caller.line}:${caller.column}`;
}

export function resolveLogDir(logDir?: string): string {
  return path.resolve(logDir ?? process.env.LOG_DIR ?? "logs");
}
