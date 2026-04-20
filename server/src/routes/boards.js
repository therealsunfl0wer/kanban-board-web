import { authProxy } from "../hooks/authProxy.js";

export default async function boardRoutes(fastify) {
  const opts = { onRequest: [authProxy] };

  // GET /api/boards
  // list all boards for current user
  fastify.get("/", opts, async (request, reply) => {
    const boards = fastify.db
      .prepare(
        "SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(request.user.id);
    return reply.send({ boards });
  });

  // POST /api/boards
  // create a new board
  fastify.post("/", opts, async (request, reply) => {
    const { title } = request.body;
    if (!title?.trim()) {
      return reply.code(400).send({ error: "Board title is required" });
    }

    const result = fastify.db
      .prepare("INSERT INTO boards (user_id, title) VALUES (?, ?)")
      .run(request.user.id, title.trim());

    const board = fastify.db
      .prepare("SELECT * FROM boards WHERE id = ?")
      .get(result.lastInsertRowid);

    // default columns
    const defaultColumns = ["To Do", "In Progress", "Done"];
    const insertCol = fastify.db.prepare(
      "INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)",
    );
    defaultColumns.forEach((col, i) => insertCol.run(board.id, col, i));

    return reply.code(201).send({ board });
  });

  // GET /api/boards/:id
  // get a board with its columns and cards
  fastify.get("/:id", opts, async (request, reply) => {
    const board = fastify.db
      .prepare("SELECT * FROM boards WHERE id = ? AND user_id = ?")
      .get(request.params.id, request.user.id);

    if (!board) return reply.code(404).send({ error: "Board not found" });

    const columns = fastify.db
      .prepare("SELECT * FROM columns WHERE board_id = ? ORDER BY position")
      .all(board.id);

    const cards = fastify.db
      .prepare(
        `SELECT cards.* FROM cards
         JOIN columns ON cards.column_id = columns.id
         WHERE columns.board_id = ?
         ORDER BY cards.position`,
      )
      .all(board.id);

    const columnsWithCards = columns.map((col) => ({
      ...col,
      cards: cards.filter((c) => c.column_id === col.id),
    }));

    return reply.send({ board: { ...board, columns: columnsWithCards } });
  });

  // DELETE /api/boards/:id
  fastify.delete("/:id", opts, async (request, reply) => {
    const board = fastify.db
      .prepare("SELECT * FROM boards WHERE id = ? AND user_id = ?")
      .get(request.params.id, request.user.id);

    if (!board) return reply.code(404).send({ error: "Board not found" });

    fastify.db.prepare("DELETE FROM boards WHERE id = ?").run(board.id);
    return reply.send({ ok: true });
  });
}
