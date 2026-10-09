const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(__dirname, "users.db");

function initializeDatabase(callback) {
  const db = new sqlite3.Database(databasePath, (error) => {
    if (error) {
      return callback(error);
    }

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (error) => {
        if (error) {
          db.close();
          return callback(error);
        }

        console.log("SQLite database ready:", databasePath);
        callback(null, db);
      }
    );
  });
}

module.exports = { initializeDatabase };