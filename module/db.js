const mysql = require('mysql2/promise');

let db;

async function connectDB() {
  if (!db) {
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST || process.env.DB_URL,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQLDATABASE,
      port: process.env.MYSQLPORT || 3306,
    });
    console.log(`Conectado a la base de datos: ${process.env.MYSQLDATABASE}`);
  }
  return db;
}

module.exports = connectDB;
