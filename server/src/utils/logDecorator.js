export default class LogDecorator {
  constructor(options = {}) {
    this.useColors = options.colors ?? true;

    this.levelMap = {
      10: { label: "TRACE", color: "\x1b[90m" },
      20: { label: "DEBUG", color: "\x1b[36m" },
      30: { label: "INFO", color: "\x1b[32m" },
      40: { label: "WARN", color: "\x1b[33m" },
      50: { label: "ERROR", color: "\x1b[31m" },
      60: { label: "FATAL", color: "\x1b[41m\x1b[37m" },
    };

    this.resetColor = "\x1b[0m";
  }

  decorate(log) {
    const timeStr = this.formatTime(log.time);
    const levelConfig = this.levelMap[log.level] || {
      label: "USER",
      color: "\x1b[35m",
    };

    const levelLabel = this.useColors
      ? `${levelConfig.color}${levelConfig.label}${this.resetColor}`
      : levelConfig.label;

    let msg = log.msg || "";
    const {
      level,
      time,
      pid,
      msg: _msg,
      hostname,
      req,
      res,
      responseTime,
      reqId,
      meta,
      ...rest
    } = log;

    // [req-4] -> [4]
    const idPrefix = reqId ? `[${reqId.slice(4)}] ` : "";
    let metaStr = "";
    const totalMeta = { ...(meta || {}), ...rest };

    if (Object.keys(totalMeta).length > 0) {
      const formattedItems = Object.entries(totalMeta)
        .map(
          ([key, val]) =>
            `${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`,
        )
        .join("\n");

      metaStr = this.useColors
        ? ` \x1b[90m\n${formattedItems}\x1b[0m`
        : `\n${formattedItems}`;
    }

    if (req) {
      const methodStr = this.useColors
        ? `\x1b[36m${req.method}\x1b[0m`
        : req.method;
      msg = `${idPrefix}${methodStr} ${req.url}`;
    } else if (res) {
      let statusColor = "\x1b[32m";
      if (res.statusCode >= 400 && res.statusCode < 500)
        statusColor = "\x1b[33m";
      if (res.statusCode >= 500) statusColor = "\x1b[31m";

      const statusStr = this.useColors
        ? `${statusColor}${res.statusCode}\x1b[0m`
        : res.statusCode;
      const ms = responseTime ? ` (${responseTime.toFixed(2)}ms)` : "";
      const urlStr = req ? ` ${req.method} ${req.url}` : "";

      msg = `${idPrefix}request completed ${statusStr}${urlStr}${ms}`;
    } else if (msg) {
      msg = `${idPrefix}${msg}`;
    }

    return `[${timeStr}] ${levelLabel}: ${msg}${metaStr}`;
  }

  formatTime(epoch) {
    if (!epoch) return new Date().toLocaleTimeString();
    return new Date(epoch).toISOString().split("T")[1].slice(0, -1);
  }
}
