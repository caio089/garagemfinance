import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const envPath = resolve(__dirname, "..", file);
    try {
      const content = readFileSync(envPath, "utf8");
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
const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "lrdiswloqffdubnbtoso";

const dbUrl =
  process.env.DATABASE_URL ??
  (password
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!dbUrl) {
  console.error(
    "Defina SUPABASE_DB_PASSWORD ou DATABASE_URL no .env.local para executar a migration."
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/001_initial_schema.sql"),
  "utf8"
);

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Tabelas criadas com sucesso!");

  const { rows } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('dias', 'entradas', 'saidas') ORDER BY table_name"
  );
  console.log("Tabelas encontradas:", rows.map((r) => r.table_name).join(", "));
} catch (error) {
  console.error("Erro ao criar tabelas:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
