import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(__dirname, "..", file), "utf8");
      for (const line of content.split("\n")) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) {
          process.env[key.trim()] ??= rest.join("=").trim();
        }
      }
    } catch {
      // ignore
    }
  }
}

loadEnv();

const password = process.env.SUPABASE_DB_PASSWORD ?? process.env.DATABASE_PASSWORD;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const projectRef =
  projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";

const dbUrl =
  process.env.DATABASE_URL ??
  (password && projectRef
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!dbUrl) {
  console.error(
    "Defina SUPABASE_DB_PASSWORD ou DATABASE_URL no .env.local e rode este script."
  );
  console.error(
    "Ou cole o SQL de supabase/migrations/009_fila_clientes_lavagem.sql no SQL Editor do Supabase."
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/009_fila_clientes_lavagem.sql"),
  "utf8"
);

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration 009 aplicada com sucesso (clientes + fila).");
} catch (error) {
  console.error("Erro ao aplicar migration:", error.message);
  console.error(
    "Alternativa: cole o arquivo 009_fila_clientes_lavagem.sql no SQL Editor do Supabase."
  );
  process.exit(1);
} finally {
  await client.end();
}
