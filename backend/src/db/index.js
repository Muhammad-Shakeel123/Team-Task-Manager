// src/db/index.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL connected: ${process.env.PGDATABASE}`);
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection failed', err);
    process.exit(1);
  }
};

export default pool;
