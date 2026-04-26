
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env
const envFile = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [key, ...val] = line.split('=');
      return [key.trim(), val.join('=').trim()];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking tables in project:', supabaseUrl);
  
  const tables = ['profiles', 'generations', 'styles', 'characters', 'media_assets', 'render_jobs'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table '${table}' does NOT exist.`);
        } else {
          console.log(`⚠️  Table '${table}' check error:`, error.message);
        }
      } else {
        console.log(`✅ Table '${table}' exists.`);
      }
    } catch (err) {
      console.log(`💥 Error checking '${table}':`, err.message);
    }
  }
}

checkTables();
