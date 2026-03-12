
const { Client } = require('pg');

async function run(password) {
  const client = new Client({
    host: 'db.doavmwjdozziqqulwdiy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase. Adding UNIQUE constraint...');
    
    const sql = `
      -- Add UNIQUE constraint to user_id if it doesn't exist
      ALTER TABLE public.push_subscriptions 
      ADD CONSTRAINT push_subscriptions_user_id_unique UNIQUE (user_id);
    `;

    await client.query(sql);
    console.log('SUCCESS: UNIQUE constraint added to push_subscriptions.user_id.');
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('NOTE: Constraint already exists, nothing to do.');
      await client.end();
      return true;
    }
    console.error('Operation failed:', err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const pwd1 = 'Zc4jmx1989@';
  const pwd2 = 'Zc4jmx01051989@';
  
  if (await run(pwd1)) return;
  if (await run(pwd2)) return;
  
  process.exit(1);
}

main();
