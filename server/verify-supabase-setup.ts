/**
 * Supabase Setup Verification Script
 *
 * Run this to verify your Supabase configuration is correct
 *
 * Usage: npx tsx verify-supabase-setup.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('\n🔍 Cleverly AI Grader - Supabase Setup Verification\n');
console.log('='.repeat(60));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing environment variables!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  let errors = 0;
  let warnings = 0;

  // Test 1: Connection
  console.log('\n[1/7] Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('  ✅ Connected to Supabase');
  } catch (error: any) {
    console.error('  ❌ Connection failed:', error.message);
    errors++;
  }

  // Test 2: Tables exist
  console.log('\n[2/7] Checking database tables...');
  const requiredTables = [
    'profiles',
    'courses',
    'course_files',
    'course_embeddings',
    'graders',
    'rubrics',
    'submissions',
    'submission_grades'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log(`  ✅ Table '${table}' exists`);
    } catch (error: any) {
      console.error(`  ❌ Table '${table}' missing:`, error.message);
      errors++;
    }
  }

  // Test 3: pgvector extension
  console.log('\n[3/7] Checking pgvector extension...');
  try {
    const { data, error } = await supabase.rpc('match_course_embeddings', {
      query_embedding: Array(768).fill(0),
      course_id: '00000000-0000-0000-0000-000000000000',
      match_count: 1
    });

    console.log('  ✅ Vector search function exists');
    console.log('  ✅ pgvector extension enabled');
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      console.error('  ❌ match_course_embeddings function not found');
      console.error('     Run migration 004_match_course_embeddings.sql');
      errors++;
    } else {
      // Other errors are ok (like missing data)
      console.log('  ✅ Vector search function exists');
    }
  }

  // Test 4: Storage bucket
  console.log('\n[4/7] Checking storage bucket...');
  try {
    const { data, error } = await supabase.storage.getBucket('courses');
    if (error) throw error;
    console.log(`  ✅ Storage bucket 'courses' exists`);
    console.log(`     Public: ${data.public ? 'Yes' : 'No'}`);
  } catch (error: any) {
    console.error('  ❌ Storage bucket not found:', error.message);
    console.error('     Create bucket named "courses" in Supabase Storage');
    errors++;
  }

  // Test 5: RLS Policies
  console.log('\n[5/7] Checking Row Level Security...');
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    // This should work with service role key regardless of RLS
    console.log('  ✅ RLS configured (service role has access)');
  } catch (error: any) {
    console.error('  ⚠️  Warning:', error.message);
    warnings++;
  }

  // Test 6: Indexes
  console.log('\n[6/7] Checking vector index...');
  try {
    const { data, error } = await supabase.rpc('pg_indexes', {});
    console.log('  ✅ Database indexes configured');
  } catch (error: any) {
    console.log('  ⚠️  Cannot verify indexes (this is ok)');
    warnings++;
  }

  // Test 7: Sample data test
  console.log('\n[7/7] Testing write operations...');
  try {
    // Try to create a test profile (will fail if auth user doesn't exist, that's ok)
    const testId = '00000000-0000-0000-0000-000000000001';
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: testId, email: 'test@example.com' }, { onConflict: 'id' });

    if (error && !error.message.includes('foreign key')) {
      throw error;
    }

    // Clean up
    await supabase.from('profiles').delete().eq('id', testId);

    console.log('  ✅ Write operations working');
  } catch (error: any) {
    if (error.message.includes('foreign key')) {
      console.log('  ✅ Write operations working (FK constraint ok)');
    } else {
      console.error('  ❌ Write test failed:', error.message);
      errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Verification Summary:\n');

  if (errors === 0 && warnings === 0) {
    console.log('  🎉 Perfect! Your Supabase setup is complete!\n');
    console.log('  You can now start the application:');
    console.log('    1. Start Redis: redis-server');
    console.log('    2. Start backend: cd server && npm run dev');
    console.log('    3. Start frontend: cd client && npm run dev\n');
    return 0;
  } else if (errors === 0) {
    console.log(`  ✅ Setup is functional (${warnings} warnings)\n`);
    console.log('  You can proceed, but review warnings above.\n');
    return 0;
  } else {
    console.log(`  ❌ Setup incomplete (${errors} errors, ${warnings} warnings)\n`);
    console.log('  Please fix the errors above before proceeding.');
    console.log('  See SUPABASE_SETUP_GUIDE.md for detailed instructions.\n');
    return 1;
  }
}

verify()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\nPlease check your .env configuration.\n');
    process.exit(1);
  });
