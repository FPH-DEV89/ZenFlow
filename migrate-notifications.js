
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
    console.log('Connected successfully to Supabase. Creating push_subscriptions table...');
    
    const sql = `
      -- Create push_subscriptions table
      CREATE TABLE IF NOT EXISTS public.push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        subscription JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Enable RLS
      ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

      -- Create policy: users can only see/edit their own subscriptions
      -- Use a safe check to see if policy exists first? Actually just drop and recreate for simplicity in migration script
      DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
      CREATE POLICY "Users can manage their own push subscriptions" 
      ON public.push_subscriptions 
      FOR ALL 
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

      -- Index for user_id
      CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);
    `;

    await client.query(sql);
    console.log('SUCCESS: Table push_subscriptions created and secured.');
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
