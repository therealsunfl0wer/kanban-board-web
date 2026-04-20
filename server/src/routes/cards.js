import { authProxy } from "../hooks/authProxy.js";
import { CardFactory } from "../models/factories.js";

export default async function cardRoutes(fastify) {
  const opts = { onRequest: [authProxy] };

  // POST /api/cards
  // create a card
  fastify.post("/", opts, async (request, reply) => {
    let card;
    try {
      card = CardFactory.create(request.body);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    const column = fastify.db
      .prepare(
        "SELECT columns.id FROM columns JOIN boards ON columns.board_id = boards.id WHERE columns.id = ? AND boards.user_id = ?",
      )
      .get(card.column_id, request.user.id);

    if (!column) return reply.code(404).send({ error: "Column not found" });

    const max = fastify.db
      .prepare("SELECT MAX(position) as pos FROM cards WHERE column_id = ?")
      .get(card.column_id);

    card.position = (max?.pos ?? -1) + 1;

    const result = fastify.db
      .prepare(
        "INSERT INTO cards (column_id, title, description, priority, position) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        card.column_id,
        card.title,
        card.description,
        card.priority,
        card.position,
      );

    const created = fastify.db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(result.lastInsertRowid);

    return reply.code(201).send({ card: created });
  });

  // PATCH /api/cards/:id
  // update cards
  fastify.patch("/:id", opts, async (request, reply) => {
    const { title, description, priority } = request.body;
    const card = fastify.db
      .prepare(
        "SELECT cards.* FROM cards JOIN columns ON cards.column_id = columns.id JOIN boards ON columns.board_id = boards.id WHERE cards.id = ? AND boards.user_id = ?",
      )
      .get(request.params.id, request.user.id);

    if (!card) return reply.code(404).send({ error: "Card not found" });

    fastify.db
      .prepare(
        "UPDATE cards SET title = ?, description = ?, priority = ? WHERE id = ?",
      )
      .run(
        title ?? card.title,
        description ?? card.description,
        priority ?? card.priority,
        card.id,
      );

    const updated = fastify.db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(card.id);
    return reply.send({ card: updated });
  });

  // PATCH /api/cards/:id/move
  fastify.patch("/:id/move", opts, async (request, reply) => {
    const { column_id, position } = request.body;

    if (!column_id) {
      return reply.code(400).send({ error: "column_id is required" });
    }

    const card = fastify.db
      .prepare(
        "SELECT cards.*, columns.board_id FROM cards JOIN columns ON cards.column_id = columns.id JOIN boards ON columns.board_id = boards.id WHERE cards.id = ? AND boards.user_id = ?",
      )
      .get(request.params.id, request.user.id);

    if (!card) return reply.code(404).send({ error: "Card not found" });

    const targetColumn = fastify.db
      .prepare(
        "SELECT columns.* FROM columns JOIN boards ON columns.board_id = boards.id WHERE columns.id = ? AND boards.user_id = ?",
      )
      .get(column_id, request.user.id);

    if (!targetColumn)
      return reply.code(404).send({ error: "Column not found" });

    if (targetColumn.board_id !== card.board_id) {
      return reply
        .code(400)
        .send({ error: "Cannot move card to another board" });
    }

    const desiredPosition = Number.isInteger(position)
      ? position
      : Number.parseInt(position ?? 0, 10);
    const normalizedPosition = Number.isNaN(desiredPosition)
      ? 0
      : desiredPosition;

    const selectCards = fastify.db.prepare(
      "SELECT id FROM cards WHERE column_id = ? ORDER BY position",
    );
    const updateCard = fastify.db.prepare(
      "UPDATE cards SET column_id = ?, position = ? WHERE id = ?",
    );

    const moveCard = fastify.db.transaction(
      (fromColumnId, toColumnId, cardId, insertAt) => {
        if (fromColumnId === toColumnId) {
          const ids = selectCards.all(fromColumnId).map((row) => row.id);
          const fromIndex = ids.indexOf(cardId);
          if (fromIndex === -1) return;

          ids.splice(fromIndex, 1);
          let targetIndex = insertAt;
          if (fromIndex < targetIndex) {
            targetIndex -= 1;
          }
          const clampedIndex = Math.max(0, Math.min(targetIndex, ids.length));
          ids.splice(clampedIndex, 0, cardId);

          ids.forEach((id, index) => updateCard.run(toColumnId, index, id));
          return;
        }

        const fromIds = selectCards
          .all(fromColumnId)
          .map((row) => row.id)
          .filter((id) => id !== cardId);

        fromIds.forEach((id, index) => updateCard.run(fromColumnId, index, id));

        const toIds = selectCards.all(toColumnId).map((row) => row.id);
        const clampedIndex = Math.max(0, Math.min(insertAt, toIds.length));
        toIds.splice(clampedIndex, 0, cardId);

        toIds.forEach((id, index) => updateCard.run(toColumnId, index, id));
      },
    );

    moveCard(card.column_id, targetColumn.id, card.id, normalizedPosition);

    const updated = fastify.db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(card.id);
    return reply.send({ card: updated });
  });

  // DELETE /api/cards/:id
  fastify.delete("/:id", opts, async (request, reply) => {
    const card = fastify.db
      .prepare(
        "SELECT cards.* FROM cards JOIN columns ON cards.column_id = columns.id JOIN boards ON columns.board_id = boards.id WHERE cards.id = ? AND boards.user_id = ?",
      )
      .get(request.params.id, request.user.id);

    if (!card) return reply.code(404).send({ error: "Card not found" });

    fastify.db.prepare("DELETE FROM cards WHERE id = ?").run(card.id);
    return reply.send({ ok: true });
  });

  // POST /api/columns
  fastify.post("/columns", opts, async (request, reply) => {
    const { board_id, title } = request.body;
    if (!title?.trim())
      return reply.code(400).send({ error: "Column title required" });

    const board = fastify.db
      .prepare("SELECT id FROM boards WHERE id = ? AND user_id = ?")
      .get(board_id, request.user.id);

    if (!board) return reply.code(404).send({ error: "Board not found" });

    const max = fastify.db
      .prepare("SELECT MAX(position) as pos FROM columns WHERE board_id = ?")
      .get(board_id);

    const position = (max?.pos ?? -1) + 1;

    const result = fastify.db
      .prepare(
        "INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)",
      )
      .run(board_id, title.trim(), position);

    const col = fastify.db
      .prepare("SELECT * FROM columns WHERE id = ?")
      .get(result.lastInsertRowid);

    return reply.code(201).send({ column: col });
  });

  // PATCH /api/cards/columns/:id/move — reorder a column within its board
  fastify.patch("/columns/:id/move", opts, async (request, reply) => {
    const { position } = request.body;
    const column = fastify.db
      .prepare(
        "SELECT columns.*, boards.id as board_id FROM columns JOIN boards ON columns.board_id = boards.id WHERE columns.id = ? AND boards.user_id = ?",
      )
      .get(request.params.id, request.user.id);

    if (!column) return reply.code(404).send({ error: "Column not found" });

    const desiredPosition = Number.isInteger(position)
      ? position
      : Number.parseInt(position ?? 0, 10);
    const normalizedPosition = Number.isNaN(desiredPosition)
      ? 0
      : desiredPosition;

    const selectColumns = fastify.db.prepare(
      "SELECT id FROM columns WHERE board_id = ? ORDER BY position",
    );
    const updateColumn = fastify.db.prepare(
      "UPDATE columns SET position = ? WHERE id = ?",
    );

    const reorder = fastify.db.transaction((boardId, columnId, insertAt) => {
      const ids = selectColumns.all(boardId).map((row) => row.id);
      const currentIndex = ids.indexOf(columnId);
      if (currentIndex === -1) return;

      ids.splice(currentIndex, 1);
      const clampedIndex = Math.max(0, Math.min(insertAt, ids.length));
      ids.splice(clampedIndex, 0, columnId);

      ids.forEach((id, index) => updateColumn.run(index, id));
    });

    reorder(column.board_id, column.id, normalizedPosition);

    const updated = fastify.db
      .prepare("SELECT * FROM columns WHERE id = ?")
      .get(column.id);
    return reply.send({ column: updated });
  });

  // DELETE /api/cards/columns/:id
  fastify.delete("/columns/:id", opts, async (request, reply) => {
    const column = fastify.db
      .prepare(
        "SELECT columns.* FROM columns JOIN boards ON columns.board_id = boards.id WHERE columns.id = ? AND boards.user_id = ?",
      )
      .get(request.params.id, request.user.id);

    if (!column) return reply.code(404).send({ error: "Column not found" });

    fastify.db.prepare("DELETE FROM columns WHERE id = ?").run(column.id);
    return reply.send({ ok: true });
  });
}
