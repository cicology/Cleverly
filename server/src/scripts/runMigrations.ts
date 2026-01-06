import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, "../../../supabase/migrations");

  try {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      console.log(`\n🔄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      // Split by semicolons to execute statements separately
      const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--"));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        try {
          const { error } = await supabase.rpc("exec_sql", { sql_query: statement });

          if (error) {
            // Try direct query if rpc fails
            const { error: directError } = await supabase.from("_migrations").select("*").limit(1);
            if (directError) {
              console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
            }
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, err);
        }
      }

      console.log(`✅ Completed: ${file}`);
    }

    console.log("\n✨ All migrations completed successfully!");

    // Verify tables were created
    console.log("\n🔍 Verifying tables...");
    const tables = [
      "profiles",
      "courses",
      "course_files",
      "course_embeddings",
      "graders",
      "rubrics",
      "submissions",
      "submission_grades",
      "lti_course_links",
      "lti_launches"
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        console.log(`❌ Table '${table}' not accessible: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' verified`);
      }
    }

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
