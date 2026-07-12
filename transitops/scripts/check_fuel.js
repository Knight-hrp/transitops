const fs = require('fs');
const { Client } = require('pg');

function getDatabaseUrl() {
  const envPath = './.env.local';
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
  return match ? match[1] : null;
}

(async () => {
  const url = getDatabaseUrl();
  if (!url) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(2);
  }

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) AS count FROM fuel_logs');
    console.log('fuel_logs count:', res.rows[0].count);

    const rows = await client.query('SELECT id, vehicle_id, liters, cost, date FROM fuel_logs ORDER BY date DESC LIMIT 10');
    console.log('recent rows:', rows.rows);
  } catch (err) {
    console.error('Query error:', err.message);
    process.exit(3);
  } finally {
    await client.end();
  }
})();
