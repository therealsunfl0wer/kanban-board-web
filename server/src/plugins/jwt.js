import fp from "fastify-plugin";
import fjwt from "@fastify/jwt";
import fCookie from "@fastify/cookie";

async function jwtPlugin(fastify) {
  fastify.register(fCookie);

  fastify.register(fjwt, {
    secret: process.env.JWT_SECRET || "lmao-no-prod-for-this",
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });
}

export default fp(jwtPlugin);
