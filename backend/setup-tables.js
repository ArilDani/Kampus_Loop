require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('./supabaseClient');

async function setupTables() {
  console.log('[*] Checking Supabase tables...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const tables = ['users', 'user_profiles', 'products', 'wishlist', 'orders', 'contacts', 'settings'];
  let missingCount = 0;

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      missingCount++;
      console.log(`[!] Table "${table}" missing or inaccessible: ${error.message}`);
    } else {
      console.log(`[OK] Table "${table}" exists`);
    }
  }

  console.log('');
  if (missingCount > 0) {
    console.log('[BLOCKER] Supabase publishable key cannot execute raw DDL (CREATE TABLE).');
    console.log('[ACTION] Please run backend/schema.sql in Supabase Dashboard > SQL Editor:');
    console.log('         https://supabase.com/dashboard > Your Project > SQL Editor');
    console.log('');
    console.log('--- SQL from backend/schema.sql ---');
    console.log(sql);
    process.exitCode = 1;
  } else {
    console.log('[OK] All 7 tables verified in Supabase.');
  }
}

setupTables().catch((err) => {
  console.error('[FATAL] setup-tables error:', err);
  process.exit(1);
});
