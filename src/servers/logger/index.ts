import type { CallerInfo, FormattedLog, LogLevel, LogMeta, LoggerOptions } from "./types";
import { LOG_LEVEL_PRIORITY } from "./types";

const PROCESS_CALLER: CallerInfo = { file: "process", line: 0, column: 0 };
import { formatCaller, getCallerLocation, parseErrorFrames } from "./caller";
import { formatConsole, formatPlain } from "./format";
import { FileWriter } from "./file-writer";

function parseLogLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  const normalized = value?.toLowerCase();
  if (normalized === "debug" || normalized === "info" || normalized === "warn" || normalized === "error") {
    return normalized;
  }
  return fallback;
}

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "object" && value !== null && "message" in value) {
    return new Error(String((value as { message?: unknown }).message ?? value));
  }
  return new Error(String(value));
}

export class Logger {
  readonly name: string;
  private readonly level: LogLevel;
  private readonly enableConsole: boolean;
  private readonly enableFile: boolean;
  private readonly fileWriter: FileWriter | null;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name ?? "server";
    this.level = parseLogLevel(process.env.LOG_LEVEL, options.level ?? "info");
    this.enableConsole = options.enableConsole ?? envFlag("LOG_CONSOLE", true);
    this.enableFile = options.enableFile ?? envFlag("LOG_FILE", true);
    this.fileWriter = this.enableFile
      ? new FileWriter({
          logDir: options.logDir,
          maxFileSizeBytes: options.maxFileSizeBytes ?? 10 * 1024 * 1024,
        })
      : null;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  private emit(level: LogLevel, message: string, meta?: LogMeta, err?: Error, callerOverride?: CallerInfo | null) {
    if (!this.shouldLog(level)) return;

    const caller = callerOverride ?? getCallerLocation(4);
    const entry: FormattedLog = {
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      caller,
      meta,
    };

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        frames: parseErrorFrames(err),
      };
    }

    const plain = formatPlain(entry);
    if (this.enableConsole) {
      const line = formatConsole(entry);
      if (level === "error") {
        console.error(line);
      } else if (level === "warn") {
        console.warn(line);
      } else if (level === "debug") {
        console.debug(line);
      } else {
        console.info(line);
      }
    }

    if (this.fileWriter) {
      if (level === "error") {
        this.fileWriter.writeError(plain);
      } else {
        this.fileWriter.writeApp(plain);
      }
    }
  }

  child(name: string): Logger {
    return new Logger({
      name: `${this.name}:${name}`,
      level: this.level,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
    });
  }

  debug(message: string, meta?: LogMeta) {
    this.emit("debug", message, meta);
  }

  info(message: string, meta?: LogMeta) {
    this.emit("info", message, meta);
  }

  warn(message: string, meta?: LogMeta) {
    this.emit("warn", message, meta);
  }

  error(message: string, error?: unknown, meta?: LogMeta) {
    const err = error === undefined ? undefined : toError(error);
    this.emit("error", message, meta, err);
  }

  /** 进程/信号等场景：固定 caller，避免 [unknown:?] */
  system(message: string, meta?: LogMeta) {
    this.emit("info", message, meta, undefined, PROCESS_CALLER);
  }

  http(method: string, path: string, status: number, durationMs: number, meta?: LogMeta) {
    const level: LogLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    this.emit(
      level,
      `${method} ${path} ${status} ${durationMs}ms`,
      { method, path, status, durationMs, ...meta },
      undefined,
      getCallerLocation(4),
    );
  }

  close() {
    this.fileWriter?.close();
  }
}

export function registerProcessErrorHandlers(logger: Logger) {
  process.on("uncaughtException", (error) => {
    logger.error("未捕获的异常", error, { type: "uncaughtException" });
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("未处理的 Promise 拒绝", reason, { type: "unhandledRejection" });
  });
}

export { registerGracefulShutdown } from "./shutdown";
export type { GracefulShutdownOptions } from "./shutdown";

export const logger = new Logger({ name: "sub2api-ui" });

export { formatCaller, getCallerLocation, parseErrorFrames };
export type { CallerInfo, LogLevel, LogMeta, LoggerOptions };
