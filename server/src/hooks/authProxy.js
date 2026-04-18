export async function authProxy(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: "Unauthorized — please log in" });
  }
}
