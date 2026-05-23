import type { Logger } from "./index";

export type GracefulShutdownOptions = {
  logger: Logger;
  stopServer?: () => void;
};

let shuttingDown = false;

export function registerGracefulShutdown(options: GracefulShutdownOptions) {
  const { logger, stopServer } = options;

  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      logger.system("收到重复退出信号，强制结束进程", { signal });
      process.exit(1);
      return;
    }
    shuttingDown = true;

    logger.system(`收到 ${signal}，正在关闭服务`, { signal });

    try {
      stopServer?.();
    } catch (error) {
      logger.error("关闭 HTTP 服务失败", error, { signal });
    }

    logger.close();
    process.exit(0);
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
