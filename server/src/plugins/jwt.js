import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import fCookie from "@fastify/cookie";

async function jwtPlugin(fastify) {
  fastify.register(fCookie);

  let secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
    secret = "dev-unsafe-secret";
    fastify.log.warn(
      "JWT_SECRET is not set. Using an insecure dev-only default.",
    );
  }

  fastify.register(fjwt, {
    secret,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });
}

export default fp(jwtPlugin);
