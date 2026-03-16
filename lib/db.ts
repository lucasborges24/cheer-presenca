import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL!;
let dbInstance;

// Se a URL do banco aponta para localhost ou está configurada no docker, usamos conectores pg nativos
if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")) {
  const pool = new Pool({
    connectionString: dbUrl,
  });
  dbInstance = drizzlePg(pool, { schema });
} else {
  // Produção (Vercel) usando Neon Serverless (HTTP)
  const sql = neon(dbUrl);
  dbInstance = drizzleNeon(sql, { schema });
}

export const db = dbInstance;
