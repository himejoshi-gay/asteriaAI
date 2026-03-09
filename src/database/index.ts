import path from "node:path";

import Database from "bun:sqlite";
import { getMigrations, migrate } from "bun-sqlite-migrations";

function databaseFactory() {
  const db = new Database(path.resolve(process.cwd(), "data", "sunshine.db"), { create: true });
  migrate(db, getMigrations(path.resolve(process.cwd(), "data", "migrations")));
  return db;
}

export const db = databaseFactory();
