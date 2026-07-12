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
    const vehicles = await client.query('SELECT id, vehicle_name FROM vehicles ORDER BY id LIMIT 1');
    if (vehicles.rows.length === 0) {
      console.error('No vehicles found. Cannot insert fuel log.');
      process.exit(3);
    }
    const vehicle = vehicles.rows[0];
    const now = new Date();
    const res = await client.query(
      'INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES ($1, $2, $3, $4) RETURNING id',
      [vehicle.id, 50, 4000, now]
    );
    console.log('Inserted fuel log id:', res.rows[0].id, 'for vehicle', vehicle.vehicle_name);
  } catch (err) {
    console.error('Insert error:', err.message);
    process.exit(4);
  } finally {
    await client.end();
  }
})();
