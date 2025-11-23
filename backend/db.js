const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/inventory.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL,
    status TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    old_quantity INTEGER,
    new_quantity INTEGER,
    changed_by TEXT,
    timestamp TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
});

module.exports = db;
