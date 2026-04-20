import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";
import corsPlugin from "./plugins/cors.js";
import authRoutes from "./routes/auth.js";
import boardRoutes from "./routes/boards.js";
import cardRoutes from "./routes/cards.js";

const fastify = Fastify({ logger: true });

await fastify.register(corsPlugin);
await fastify.register(dbPlugin);
await fastify.register(jwtPlugin);

fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(boardRoutes, { prefix: "/api/boards" });
fastify.register(cardRoutes, { prefix: "/api/cards" });

fastify.get("/health", async () => ({ ok: true }));

try {
  await fastify.listen({ port: 3000, host: "127.0.0.1" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
