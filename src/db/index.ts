import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // Réutilise l'instance entre les rechargements HMR en développement.
  var _drizzleDb: NodePgDatabase<typeof schema> | undefined;
}

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquante : définissez-la dans l'environnement.");
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5_000,
  });
  return drizzle(pool, { schema });
}

// Initialisation paresseuse : le module peut être importé au build
// (collecte des pages) sans DATABASE_URL ; la connexion n'est créée
// qu'à la première requête.
function getDb(): NodePgDatabase<typeof schema> {
  if (!globalThis._drizzleDb) {
    globalThis._drizzleDb = createDb();
  }
  return globalThis._drizzleDb;
}

export const db: NodePgDatabase<typeof schema> = new Proxy(
  {} as NodePgDatabase<typeof schema>,
  {
    get(_target, property) {
      const instance = getDb();
      const value = Reflect.get(instance, property, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  },
);

export { schema };
