import fs from "node:fs";
import path from "node:path";
import { resolveLogDir } from "./caller";

type FileWriterOptions = {
  logDir?: string;
  maxFileSizeBytes: number;
};

function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export class FileWriter {
  private readonly logDir: string;
  private readonly maxFileSizeBytes: number;
  private currentDate = "";

  constructor(options: FileWriterOptions) {
    this.logDir = resolveLogDir(options.logDir);
    this.maxFileSizeBytes = options.maxFileSizeBytes;
    fs.mkdirSync(this.logDir, { recursive: true });
  }

  private appFilePath(date: string) {
    return path.join(this.logDir, `app-${date}.log`);
  }

  private errorFilePath(date: string) {
    return path.join(this.logDir, `error-${date}.log`);
  }

  private rotateIfNeeded(filePath: string) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size < this.maxFileSizeBytes) return;
      const rotated = `${filePath}.${Date.now()}.bak`;
      fs.renameSync(filePath, rotated);
    } catch {
      // file may not exist yet
    }
  }

  private append(filePath: string, line: string) {
    this.rotateIfNeeded(filePath);
    fs.appendFileSync(filePath, `${line}\n`, "utf8");
  }

  private pathsForToday() {
    const date = dateKey();
    if (date !== this.currentDate) {
      this.currentDate = date;
    }
    return {
      app: this.appFilePath(this.currentDate || date),
      error: this.errorFilePath(this.currentDate || date),
    };
  }

  writeApp(line: string) {
    const { app } = this.pathsForToday();
    this.append(app, line);
  }

  writeError(line: string) {
    const { app, error } = this.pathsForToday();
    this.append(app, line);
    this.append(error, line);
  }

  close() {
    // sync writer has no open handles
  }
}
