import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";
import authRoutes from "./routes/auth.js";

const fastify = Fastify({ logger: true });

await fastify.register(dbPlugin);
await fastify.register(jwtPlugin);

fastify.register(authRoutes, { prefix: "/api/auth" });

fastify.get("/health", async () => ({ ok: true }));

try {
  await fastify.listen({ port: 3000, host: "127.0.0.1" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
