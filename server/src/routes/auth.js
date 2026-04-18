import { UserFactory } from "../models/factories.js";

export default async function authRoutes(fastify) {
  // POST /api/auth/register
  fastify.post("/register", async (request, reply) => {
    const { username, email, password } = request.body;

    let newUser;
    try {
      newUser = UserFactory.create({ username, email, password });
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    try {
      const stmt = fastify.db.prepare(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      );
      const result = stmt.run(
        newUser.username,
        newUser.email,
        newUser.password_hash,
      );

      const user = fastify.db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(result.lastInsertRowid);

      const token = fastify.jwt.sign({ id: user.id, username: user.username });

      return reply
        .setCookie("token", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        })
        .code(201)
        .send({ user: UserFactory.toPublic(user) });
    } catch (err) {
      if (err.message.includes("UNIQUE")) {
        return reply
          .code(409)
          .send({ error: "Username or email already taken" });
      }
      return reply.code(500).send({ error: "Registration failed" });
    }
  });

  // POST /api/auth/login
  fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password are required" });
    }

    const hash = UserFactory.hashPassword(password);
    const user = fastify.db
      .prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?")
      .get(email.toLowerCase(), hash);

    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = fastify.jwt.sign({ id: user.id, username: user.username });

    return reply
      .setCookie("token", token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      })
      .send({ user: UserFactory.toPublic(user) });
  });

  // POST /api/auth/logout
  fastify.post("/logout", async (request, reply) => {
    return reply.clearCookie("token", { path: "/" }).send({ ok: true });
  });

  // GET /api/auth/me - check current session
  fastify.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const user = fastify.db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(request.user.id);
      if (!user) return reply.code(404).send({ error: "User not found" });
      return reply.send({ user: UserFactory.toPublic(user) });
    } catch {
      return reply.code(401).send({ error: "Not authenticated" });
    }
  });
}
