const mysql = require('mysql2/promise');

let db;

async function connectDB() {
  if (!db) {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true,
    });
    console.log(`Conectado a la base de datos: ${process.env.MYSQLDATABASE}`);
  }
  return db;
}

module.exports = connectDB;
