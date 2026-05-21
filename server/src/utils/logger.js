const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
};

const serializers = {
  req: (request) => ({
    method: request.method,
    url: request.url,
    hostname: request.hostname,
    remoteAddress: request.ip,
  }),
  res: (reply) => ({
    statusCode: reply.statusCode,
  }),
  err: (error) => ({
    type: error.constructor.name,
    message: error.message,
    stack: error.stack,
  }),
};

export default class PinoLikeLogger {
  constructor(level = "info", bindings = {}, decorator = null) {
    this.level = level;
    this.levelValue = LOG_LEVELS[level] ?? 30;
    this.bindings = bindings;
    this.decorator = decorator;

    Object.keys(LOG_LEVELS).forEach((lvl) => {
      if (lvl !== "silent") {
        this[lvl] = this.createLogMethod(lvl);
      } else {
        this[lvl] = () => {};
      }
    });
  }

  createLogMethod(methodLevel) {
    return (firstArg, msg, ...args) => {
      const methodValue = LOG_LEVELS[methodLevel];
      if (methodValue < this.levelValue) return;

      let logObject = { ...this.bindings };
      let finalMsg = "";

      if (typeof firstArg === "object" && firstArg !== null) {
        const processedArgs = {};

        if (firstArg.req || firstArg.request) {
          processedArgs.req = serializers.req(firstArg.req || firstArg.request);
        }
        if (firstArg.res || firstArg.reply) {
          processedArgs.res = serializers.res(firstArg.res || firstArg.reply);
        }
        if (firstArg instanceof Error) {
          processedArgs.err = serializers.err(firstArg);
        }

        logObject = { ...logObject, ...firstArg, ...processedArgs };

        if (firstArg.raw && firstArg.id) {
          logObject.req = serializers.req(firstArg);
          delete logObject.raw;
          delete logObject.id;
        }

        finalMsg = msg || "";
      } else if (typeof firstArg === "string") {
        finalMsg = firstArg;
      }

      const output = {
        level: methodValue,
        time: Date.now(),
        pid: typeof process !== "undefined" ? process.pid : undefined,
        msg: finalMsg,
        ...logObject,
      };

      try {
        if (this.decorator) {
          console.log(this.decorator.decorate(output));
        } else {
          console.log(JSON.stringify(output));
        }
      } catch (err) {
        console.log(
          JSON.stringify({
            level: methodValue,
            time: Date.now(),
            msg: `[Logger Error: Failed to serialize log]: ${err.message}`,
          }),
        );
      }
    };
  }

  child(newBindings) {
    return new PinoLikeLogger(
      this.level,
      { ...this.bindings, ...newBindings },
      this.decorator,
    );
  }
}
