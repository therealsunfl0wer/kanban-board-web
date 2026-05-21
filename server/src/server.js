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
const decoratorInstance =
  process.env.NODE_ENV !== "production" ? new LogDecorator() : null;
const loggerInstance = new Logger("info", {}, decoratorInstance);

const fastify = Fastify({
  loggerInstance: loggerInstance,
});

// Plugins
await fastify.register(import("@fastify/static"), {
  root: path.join(__dirname, "..", "public"),
  prefix: "/",
});
await fastify.register(corsPlugin);
await fastify.register(dbPlugin);
await fastify.register(jwtPlugin);

// doofus protection
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

// Routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(boardRoutes, { prefix: "/api/boards" });
fastify.register(cardRoutes, { prefix: "/api/cards" });

// Health check
fastify.get("/health", async () => ({ ok: true }));

try {
  await fastify.listen({ port: 3000, host: "127.0.0.1" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
