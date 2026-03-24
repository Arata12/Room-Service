/**
 * DB abstraction layer — supports SQLite (dev) and PostgreSQL (production).
 * 
 * Driver selection via DB_DRIVER env:
 *   sqlite  — better-sqlite3, data stored in DB_PATH (default: ./data/dev.db)
 *   postgres — pg pool, connection via DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
 * 
 * All routes use this module. Raw SQL is written for PostgreSQL;
 * the SQLite path normalizes queries via the adaptSql() transformer.
 * 
 * API (all methods return Promises):
 *   db.all(sql, params)   — SELECT → array of rows
 *   db.get(sql, params)   — SELECT → single row or null
 *   db.run(sql, params)   — INSERT/UPDATE/DELETE → { rowCount, lastInsertRowid }
 *   db.tx(fn)             — transaction; fn receives { all, get, run } with same signatures
 */

const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DRIVER = process.env.DB_DRIVER || 'sqlite';

// ---------------------------------------------------------------------------
// SQLite adapter
// ---------------------------------------------------------------------------

function createSqliteDb() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dev.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number        TEXT    NOT NULL,
      guest_name         TEXT    NOT NULL,
      total_usd          REAL    NOT NULL DEFAULT 0,
      currency           TEXT    NOT NULL DEFAULT 'USD',
      status             TEXT    NOT NULL DEFAULT 'pending',
      notes              TEXT,
      stripe_session_id  TEXT,
      created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id          INTEGER NOT NULL,
      item_id           TEXT    NOT NULL,
      item_name_en      TEXT    NOT NULL,
      item_name_es      TEXT    NOT NULL,
      quantity          INTEGER NOT NULL,
      unit_price_usd    REAL    NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  return db;
}

function adaptSql(sql) {
  return sql
    .replace(/::int/g, '')
    .replace(/'\[\]'::json/g, "'[]'")
    .replace(/\bILIKE\b/g, 'LIKE')
    .replace(/\$(\d+)/g, '?');
}

function sqliteQuery(db) {
  function run(sql, params = []) {
    const adapted = adaptSql(sql);
    const info = db.prepare(adapted).run(...params);
    return { rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
  }

  function get(sql, params = []) {
    const adapted = adaptSql(sql);
    return db.prepare(adapted).get(...params) || null;
  }

  function all(sql, params = []) {
    const adapted = adaptSql(sql);
    return db.prepare(adapted).all(...params);
  }

  async function tx(fn) {
    return db.transaction(() => {
      return fn({ run, get, all });
    })();
  }

  return { run, get, all, tx, pool: db };
}

// ---------------------------------------------------------------------------
// PostgreSQL adapter
// ---------------------------------------------------------------------------

function createPgPool() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars for PostgreSQL: ${missing.join(', ')}`);
    process.exit(1);
  }

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', err => console.error('Unexpected PG pool error:', err));
  return pool;
}

function pgQuery(pool) {
  async function run(sql, params = []) {
    const res = await pool.query(sql, params);
    return { rowCount: res.rowCount, lastInsertRowid: null };
  }

  async function get(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  }

  async function all(sql, params = []) {
    const res = await pool.query(sql, params);
    return res.rows;
  }

  async function tx(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        run: (sql, params) => client.query(sql, params).then(r => ({ rowCount: r.rowCount })),
        get: (sql, params) => client.query(sql, params).then(r => r.rows[0] || null),
        all: (sql, params) => client.query(sql, params).then(r => r.rows),
      });
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  return { run, get, all, tx, pool };
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

let db;

if (DRIVER === 'postgres') {
  db = pgQuery(createPgPool());
  console.log('Database: PostgreSQL');
} else {
  db = sqliteQuery(createSqliteDb());
  console.log(`Database: SQLite (${process.env.DB_PATH || path.join(__dirname, '..', 'data', 'dev.db')})`);
}

module.exports = db;
