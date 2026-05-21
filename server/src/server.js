import path from "path";
import { fileURLToPath } from "url";
import Fastify from "fastify";
import Logger from "./utils/logger.js";
import LogDecorator from "./utils/logDecorator.js";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";
import corsPlugin from "./plugins/cors.js";
import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/boards.js";
import cardRoutes from "./routes/cards.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";
const decoratorInstance = isProd ? null : new LogDecorator();
const loggerInstance = new Logger("info", {}, decoratorInstance);

const fastify = Fastify({
  loggerInstance: loggerInstance,
});

// Plugins
const staticRoot = isProd
  ? path.resolve(
      process.env.CLIENT_DIST_DIR ??
        path.join(__dirname, "..", "..", "client", "dist"),
    )
  : path.join(__dirname, "..", "public");

await fastify.register(import("@fastify/static"), {
  root: staticRoot,
  prefix: "/",
});
await fastify.register(corsPlugin);
await fastify.register(dbPlugin);
await fastify.register(jwtPlugin);

// doofus protection
if (!isProd) {
  fastify.get("/favicon.ico", async (request, reply) => {
    request.log.warn(
      {
        meta: {
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        },
      },
      "Someone tried to access /favicon.ico. Are you lost?",
    );

    return reply.code(204).send();
  });

  fastify.get("/", async (request, reply) => {
    request.log.warn(
      {
        meta: {
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        },
      },
      "Someone accessed the root URL. Are you lost?",
    );

    return reply.code(418).sendFile("teapot.html");
  });
}

// Routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(boardRoutes, { prefix: "/api/boards" });
fastify.register(cardRoutes, { prefix: "/api/cards" });

// Health check
fastify.get("/health", async () => ({ ok: true }));

if (isProd) {
  fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith("/api")) {
      return reply.code(404).send({ error: "Not found" });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html");
  });
}

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || (isProd ? "0.0.0.0" : "127.0.0.1");

try {
  await fastify.listen({ port, host });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
