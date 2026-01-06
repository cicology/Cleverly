import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from root
const rootDir = path.resolve(process.cwd(), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file");
  console.log("Please create a .env file in the project root with:");
  console.log("  SUPABASE_URL=https://your-project.supabase.co");
  console.log("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log("🚀 Starting Cleverly AI Grader database setup...\n");

  const migrationsDir = path.resolve(__dirname, "../../../supabase/migrations");

  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.error("❌ No migration files found");
      process.exit(1);
    }

    console.log(`📁 Found ${files.length} migration files:\n`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log();

    // Run each migration
    for (const file of files) {
      console.log(`📝 Executing: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      // Execute the SQL using Supabase client
      // Note: Supabase client doesn't directly support raw SQL execution
      // We'll need to use the REST API or SQL Editor for this
      console.log(`   ⚠️  Please run this migration manually in Supabase SQL Editor`);
      console.log(`   📄 File: ${filePath}\n`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 MANUAL SETUP REQUIRED");
    console.log("=".repeat(60));
    console.log("\nThe @supabase/supabase-js client library doesn't support");
    console.log("executing raw SQL directly. Please follow these steps:\n");
    console.log("1. Go to your Supabase Dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run each migration file in order:");

    files.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file}`);
    });

    console.log("\n4. Copy and paste the SQL content from each file");
    console.log("5. Click 'Run' to execute\n");

    console.log("Migration files are located at:");
    console.log(`   ${migrationsDir}\n`);

    // Verify connection
    console.log("🔌 Verifying Supabase connection...");
    const { data, error } = await supabase.from("_migrations").select("*").limit(1);

    if (error && error.code !== "PGRST116") { // PGRST116 = table doesn't exist (expected before migrations)
      console.log(`   ⚠️  Connection established but migrations not yet applied`);
    } else {
      console.log(`   ✅ Connection successful`);
    }

    // Try to check if tables exist
    console.log("\n🔍 Checking existing tables...");
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

    let existingCount = 0;
    for (const table of tables) {
      const { error } = await supabase.from(table).select("*").limit(1);
      if (!error) {
        console.log(`   ✅ ${table}`);
        existingCount++;
      } else if (error.code === "42P01") {
        console.log(`   ⏳ ${table} (not created yet)`);
      } else {
        console.log(`   ❌ ${table} (${error.message})`);
      }
    }

    if (existingCount === tables.length) {
      console.log("\n✨ All tables already exist! Database is ready.");
    } else if (existingCount > 0) {
      console.log(`\n⚠️  Some tables exist (${existingCount}/${tables.length}). Please complete the migrations.`);
    } else {
      console.log("\n⏳ No tables found. Please run the migrations in Supabase SQL Editor.");
    }

  } catch (err: any) {
    console.error("\n❌ Setup failed:", err.message);
    process.exit(1);
  }
}

setupDatabase();
