import fp from "fastify-plugin";
import cors from "@fastify/cors";

const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = new Set([...DEFAULT_ORIGINS, ...extraOrigins]);
const ALLOW_ALL = process.env.CORS_ALLOW_ALL === "true";

async function corsPlugin(fastify) {
  fastify.register(cors, {
    origin: (origin, callback) => {
      if (ALLOW_ALL) {
        callback(null, true);
        return;
      }
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });
}

export default fp(corsPlugin);
