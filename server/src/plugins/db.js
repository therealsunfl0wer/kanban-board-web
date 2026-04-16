import fp from "fastify-plugin";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function dbPlugin(fastify) {
  const db = new Database(join(__dirname, "../../kanban.db"));

  // Enable WAL mode for better performance
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = readFileSync(join(__dirname, "../db/schema.sql"), "utf8");
  db.exec(schema);

  fastify.decorate("db", db);

  fastify.addHook("onClose", () => {
    db.close();
  });
}

export default fp(dbPlugin);
