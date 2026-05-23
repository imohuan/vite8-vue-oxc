export type LogLevel = "debug" | "info" | "warn" | "error";

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type CallerInfo = {
  file: string;
  line: number;
  column: number;
};

export type LoggerOptions = {
  name?: string;
  level?: LogLevel;
  logDir?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  maxFileSizeBytes?: number;
};

export type LogMeta = Record<string, unknown>;

export type FormattedLog = {
  timestamp: string;
  level: LogLevel;
  name: string;
  message: string;
  caller: CallerInfo | null;
  meta?: LogMeta;
  error?: {
    name: string;
    message: string;
    stack?: string;
    frames: CallerInfo[];
  };
};
