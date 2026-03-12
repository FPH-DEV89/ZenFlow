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
    console.log('Connected successfully to Supabase checking the DB...');
    await client.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time TIME;
    `);
    console.log('SUCCESS: Columns due_date and due_time added successfully.');
    await client.end();
    return true;
  } catch (err) {
    console.error('Connection failed for the given password:', err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function main() {
  const pwd1 = 'Zc4jmx1989@';
  const pwd2 = 'Zc4jmx01051989@';
  
  console.log("Attempt 1...");
  if (await run(pwd1)) return;
  
  console.log("Attempt 2...");
  if (await run(pwd2)) return;
  
  console.error("FAILURE: Both passwords failed to connect to the database.");
  process.exit(1);
}

main();
